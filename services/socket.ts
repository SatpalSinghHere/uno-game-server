import { Server, Socket } from "socket.io";
import { Card, cardList } from "../utils/cardObjects";
import { PrismaClient } from "@prisma/client";
import { randomDeckGen } from "../utils/functions";

const prisma = new PrismaClient();

interface GameState {
    roomId: string,
    clockwise: boolean,
    whoseTurn: number,
    discardCard: Card,
    counter: number,
    players: Array<
        {
            roomId: string,
            playerName: string,
            socketId: string,
            email: string,
            deck: Array<any>
        }
    >
};

class SocketService {
    private _io: Server;
    private players: Array<string[]>;
    private turnOrder;

    constructor() {
        this._io = new Server({
            cors: {
                origin: "*",
                allowedHeaders: ["*"]
            }
        });

        this.players = [];
        this.turnOrder = <number[]>[];
    }

    private handleWaitingRoom(socket: Socket, io: Server, username: string, roomId: string) {
        if (!this.players.some(player => player[0] === roomId && player[1] === socket.id && player[2] === username)) {
            this.players.push([roomId, socket.id, username]);
            console.log(socket.id, 'Joined Room:', roomId);
            socket.join(roomId);
            console.log('New player waiting');
            io.in(roomId).emit('players waiting', this.players);
            socket.emit('players waiting', this.players);
        }
    }

    private async handleJoinRoom(socket: Socket, io: Server, roomId: string, playerName: string, playerEmail: string) {
        if ((socket.rooms.size === 1)) {
            console.log("Joined room:", roomId);
            socket.join(roomId)
        }

        let room;
        try {
            room = await prisma.room.create({
                data: {
                    id: roomId,
                    clockwise: true,
                    whoseTurn: 0,
                    counter: 0,
                    discardCard: { color: cardList[12].color, value: '7' },
                },
                include: {
                    players: true
                }
            });
        } catch (error: any) {
            if (error.code == 'P2002') {
                console.log('DUPLICATE ROOM ENTRY');
                room = await prisma.room.findUnique({
                    where: { id: roomId },
                    include: { players: true }
                });
            } else {
                throw error;
            }
        }

        const deck: Array<any> = randomDeckGen(10)
        console.log('Player information:', playerName, playerEmail, deck);
        try {
            await prisma.player.create({
                data: {
                    playerName: playerName,
                    email: playerEmail,
                    roomId: roomId,
                    socketId: socket.id,
                    deck: deck,
                },
            });
        } catch (error: any) {
            if (error.code === 'P2002') {
                console.log('DUPLICATE PLAYER ENTRY');
            } else {
                throw error;
            }
        }

        const players = await prisma.player.findMany({
            where: { roomId: roomId }
        })

        const gameState = {
            roomId: roomId,
            clockwise: room?.clockwise,
            whoseTurn: room?.whoseTurn,
            discardCard: room?.discardCard,
            players: players,
            counter: room?.counter
        };

        console.log('NEW GAME STATE', gameState)

        io.in(roomId).emit('new game state', gameState);
        socket.emit('new game state', gameState);
    }

    private handleStartGame(socket: Socket, io: Server, roomId: string) {
        io.in(roomId).emit("Start Game", roomId);
        socket.emit("Start Game", roomId);
    }

    private async handleNewGameState(socket: Socket, io: Server, gameState: GameState, roomId: string, playerEmail: string) {
        if (gameState.discardCard.value === '+2') {
            gameState.counter = gameState.counter + 2
        }
        if (gameState.discardCard.value === '+4') {
            gameState.counter = gameState.counter + 4
        }

        console.log("New game state:", gameState, roomId);
        io.in(roomId).emit("new game state", gameState);
        socket.emit("new game state", gameState);

        let newDeck: Array<any> | undefined = gameState.players.find(player => player.email === playerEmail)?.deck

        if (newDeck) {
            await prisma.player.update({
                where: {
                    email: playerEmail
                },
                data: {
                    deck: newDeck
                }
            })
        }

        if (roomId) {
            await prisma.room.update({
                where: {
                    id: roomId
                },
                data: {
                    clockwise: gameState.clockwise,
                    whoseTurn: gameState.whoseTurn,
                    discardCard: gameState.discardCard as any,
                    counter: gameState.counter
                }
            })
        }
    }

    private async handleDisconnect(socket: Socket) {
        console.log("Disconnected:", socket.id);
        this.players = this.players.filter(player => player[1] !== socket.id);

        const player = await prisma.player.findUnique({
            where: { socketId: socket.id }
        });
        try {
            if (player) {
                const roomId = player.roomId;
                await prisma.player.delete({ where: { socketId: player.socketId } });

                const room = await prisma.room.findUnique({
                    where: { id: roomId },
                    include: { players: true }
                });

                if (room && room.players.length === 0) {
                    await prisma.room.delete({ where: { id: roomId } });
                }
            }
        }
        catch (error: any) {
            if (error.code === 'P2025') {
                console.log('Room already deleted');
            }
            else {
                throw error;
            }
        }
    }

    private async handleForNoPlusCard(socket: Socket, io: Server, gameState: GameState, playerEmail: string) {
        console.log('handling no plus card, game state ->', gameState)
        if (gameState && playerEmail) {
            let counter = gameState?.counter
            let extraCards = randomDeckGen(counter)

            gameState.counter = 0
            if (gameState.clockwise) {
                gameState.whoseTurn = (gameState.whoseTurn as number + 1) % gameState.players.length
            }
            else {
                gameState.whoseTurn = (gameState.whoseTurn as number - 1 + gameState.players.length) % gameState.players.length
            }

            let player = gameState.players.find(player => player.email === playerEmail)
            let deck = player?.deck
            deck = deck?.concat(extraCards)

            if (deck) {
                gameState.players.find(player => player.email === playerEmail)!.deck = deck
            }

            console.log("Extra cards New game state:", playerEmail, gameState );

            io.in(gameState.roomId).emit("got extra cards", counter, player);
            socket.emit("got extra cards", counter, player);
            io.in(gameState.roomId).emit("new game state", gameState);
            socket.emit("new game state", gameState);
        }
    }

    public initListeners() {
        const io = this._io;
        console.log("Init Socket listeners...");

        io.on("connect", (socket) => {
            console.log("New connection:", socket.id);

            socket.on('coming to waiting room', (username: string, roomId: string) =>
                this.handleWaitingRoom(socket, io, username, roomId)
            );

            socket.on('join room', async (roomId: string, playerName: string, playerEmail: string, deck: Card[]) => //remove deck parameter
                this.handleJoinRoom(socket, io, roomId, playerName, playerEmail)
            );

            socket.on("Start Game", (roomId) =>
                this.handleStartGame(socket, io, roomId)
            );

            socket.on("new game state", (data, roomId, playerEmail) =>
                this.handleNewGameState(socket, io, data, roomId, playerEmail)
            );

            socket.on("+ card not available", (gameState, playerEmail: string) => {
                this.handleForNoPlusCard(socket, io, gameState, playerEmail)
            })

            socket.on("disconnect", () =>
                this.handleDisconnect(socket)
            );
        });
    }

    get io(): Server {
        return this._io;
    }
}

export default SocketService;
