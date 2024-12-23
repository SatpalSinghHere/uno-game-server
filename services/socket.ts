import { Server, Socket } from "socket.io";
import { Card, cardList } from "../utils/cardObjects";
import { PrismaClient } from "@prisma/client";
import { randomDeckGen } from "../utils/functions";

const prisma = new PrismaClient();

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
        if((socket.rooms.size === 1)){
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
            players: players
        };

        console.log('NEW GAME STATE', gameState)

        io.in(roomId).emit('new game state', gameState);
        socket.emit('new game state', gameState);
    }

    private handleStartGame(socket: Socket, io: Server, roomId: string) {
        io.in(roomId).emit("Start Game", roomId);
        socket.emit("Start Game", roomId);
    }

    private handleNewGameState(socket: Socket, io: Server, data: any, roomId: string) {
        if(data.discardCard.value === '+2'){
            let whoseTurn = data.players[data.whoseTurn]
            let havingPLus2 = false
            for(let i = 0; i < whoseTurn.deck.length; i++){
                if(whoseTurn.deck[i].value === '+2'){
                    havingPLus2 = true
                    break
                }
            }
            if(!havingPLus2){
                let addCard = randomDeckGen(2)
                data.players[data.whoseTurn].deck.push(addCard[0])
                data.players[data.whoseTurn].deck.push(addCard[1])
            }

        }
        if(data.discardCard.value === '+4'){
            let whoseTurn = data.players[data.whoseTurn]
            let havingPLus4 = false
            for(let i = 0; i < whoseTurn.deck.length; i++){
                if(whoseTurn.deck[i].value === '+4'){
                    havingPLus4 = true
                    break
                }
            }
            if(!havingPLus4){
                let addCard = randomDeckGen(4)
                data.players[data.whoseTurn].deck.push(addCard[0])
                data.players[data.whoseTurn].deck.push(addCard[1])
                data.players[data.whoseTurn].deck.push(addCard[2])
                data.players[data.whoseTurn].deck.push(addCard[3])
            }

        }

        console.log("New game state:", data, roomId);
        io.in(roomId).emit("new game state", data);
        socket.emit("new game state", data);
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
        catch (error: any){
            if(error.code === 'P2025'){
                console.log('Room already deleted');
            }
            else{
                throw error;
            }
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

            socket.on("new game state", (data, roomId) =>
                this.handleNewGameState(socket, io, data, roomId)
            );

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
