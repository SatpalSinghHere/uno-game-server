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
    extraCards: {
        playerEmail: string,
        counter: number
    } | null,
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
    private timers: { [roomId: string]: NodeJS.Timeout };

    constructor() {
        this._io = new Server({
            cors: {
                origin: "*",
                allowedHeaders: ["*"]
            }
        });

        this.players = [];
        this.turnOrder = <number[]>[];
        this.timers = {}
    }

    private launchTimer(roomId: string) {
        let seconds = 10;

        // If there's already a timer for this room, stop it first
        if (this.timers[roomId]) {
            clearInterval(this.timers[roomId]);
        }

        const intervalId = setInterval(async () => {
            if (seconds === 0) {

                const room = await prisma.room.findUnique({
                    where: { id: roomId },
                    include: {
                        players: {
                            orderBy: {
                                index: 'asc', // or 'desc' for descending
                            },
                        },
                    },
                });
                if (room) {
                    const whoseTurn = room.players[room.whoseTurn]
                    if (whoseTurn) {
                        const socketId = whoseTurn.socketId
                        console.log('Timeout', whoseTurn.email);
                        this.io.to(socketId).emit("time is up")
                    }
                }
                seconds = 10;
            }
            seconds--;
        }, 1000);

        this.timers[roomId] = intervalId;  // Save the timer
    }

    private stopTimer(roomId: string) {
        if (this.timers[roomId]) {
            clearInterval(this.timers[roomId]);
            delete this.timers[roomId];
            console.log(`Timer for ${roomId} stopped`);
        }
    }

    private handleWaitingRoom(socket: Socket, io: Server, username: string, roomId: string) {

        if (!this.players.some(player => player[0] === roomId && player[1] === socket.id && player[2] === username)) {
            this.players.push([roomId, socket.id, username]);
            console.log(socket.id, 'Joined Room:', roomId);
            socket.join(roomId);
            console.log('New player waiting');
            const thisRoomPlayers = this.players.filter((player) => player[0] == roomId)
            io.in(roomId).emit('players waiting', thisRoomPlayers);
            socket.emit('players waiting', thisRoomPlayers);
        }

    }

    private async handleJoinRoom(socket: Socket, io: Server, roomId: string, playerName: string, playerEmail: string) {
        if ((socket.rooms.size >= 1)) {
            console.log("Joined room:", roomId);
            socket.join(roomId)
        }

        let room;
        try {
            room = await prisma.room.create({
                data: {
                    id: roomId,
                    clockwise: true,
                    whoseTurn: 1,
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
                    include: {
                        players: {
                            orderBy: {
                                index: 'asc', // or 'desc' for descending
                            },
                        },
                    },
                });
            } else {
                throw error;
            }
        }

        const deck: Array<any> = randomDeckGen(10)
        console.log('Player information:', playerName, playerEmail, deck);
        let player = await prisma.player.findUnique({
            where: { email: playerEmail }
        })
        if (player) {
            await prisma.player.update({
                where: {
                    email: playerEmail
                },
                data: {
                    socketId: socket.id,
                    online: true
                }
            })
        }
        try {
            const playersInRoom = await prisma.player.findMany({
                where: { roomId },
            });

            await prisma.player.create({
                data: {
                    socketId: socket.id,
                    email: playerEmail,
                    playerName,
                    deck,
                    roomId,
                    index: playersInRoom.length, // Starts from 0
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
            where: { roomId: roomId },
            orderBy: { index: 'asc' }
        })

        const gameState = {
            roomId: roomId,
            clockwise: room?.clockwise,
            whoseTurn: room?.whoseTurn,
            discardCard: room?.discardCard,
            players: players,
            counter: room?.counter
        };

        console.log('NEW GAME STATE WHOSE TURN', gameState.whoseTurn)

        this.launchTimer(roomId)  //launching Timer

        io.in(roomId).emit('new game state', gameState);
        socket.emit('new game state', gameState);
    }

    private handleStartGame(socket: Socket, io: Server, roomId: string) {
        io.in(roomId).emit("Start Game", roomId);
        // socket.emit("Start Game", roomId);
    }

    private async handleNewGameState(socket: Socket, io: Server, gameState: GameState, roomId: string, playerEmail: string) {
        console.log('receiving new gameState')
        if (gameState.discardCard.value === '+2') {
            gameState.counter = gameState.counter + 2
        }
        if (gameState.discardCard.value === '+4') {
            gameState.counter = gameState.counter + 4
        }

        if (roomId) {
            let players = await prisma.player.findMany({
                where: { roomId: roomId },
                orderBy: { index: 'asc' }                        // get all the players
            })

            let finalWhoseTurn

            if (players) {
                let room = await prisma.room.findUnique({
                    where: { id: roomId },
                    include: {
                        players: {
                            orderBy: {
                                index: 'asc', // or 'desc' for descending
                            },
                        },
                    },
                });
                if (room) {
                    let whoseTurnIndex = gameState.whoseTurn
                    console.log('PREVIOUS TURN : ', whoseTurnIndex, players[whoseTurnIndex].email)
                    let player = players[whoseTurnIndex]               // this player played this move
                    let playerOnline = false
                    const onlinePlayers = players.filter(p => p.online)
                    if (onlinePlayers.length == 2 && (gameState.discardCard.value == 'S' || gameState.discardCard.value == 'R')) {
                        whoseTurnIndex = whoseTurnIndex
                    }
                    else {
                        while (playerOnline == false) {
                            if (player.online) {
                                playerOnline = true
                            }
                            else {
                                if (gameState.clockwise) {
                                    whoseTurnIndex = (whoseTurnIndex + 1) % players.length
                                    player = players[whoseTurnIndex]

                                }
                                else {
                                    whoseTurnIndex = (whoseTurnIndex - 1 + players.length) % players.length
                                    player = players[whoseTurnIndex]

                                }
                                console.log('NEXT WHOSE TURN : ', whoseTurnIndex, players[whoseTurnIndex].email)

                                player = players[whoseTurnIndex]           //player = who will play next
                            }
                        }
                    }
                    finalWhoseTurn = whoseTurnIndex
                    console.log('FINAL WHOSE TURN : ', finalWhoseTurn)
                    gameState.whoseTurn = whoseTurnIndex
                }
            }

            // console.log("New game state:", gameState, roomId);
            io.in(roomId).emit("new game state", gameState);           // broadcasting new game state
            socket.emit("new game state", gameState);

            this.launchTimer(roomId)  // restarting the timer for this roomId

            let newDeck: Array<any> | undefined = gameState.players.find(player => player.email === playerEmail)?.deck

            if (newDeck) {
                await prisma.player.update({
                    where: {
                        email: playerEmail
                    },                                // updating current deck data in database
                    data: {
                        deck: newDeck
                    }
                })
            }



            await prisma.room.update({
                where: {
                    id: roomId
                },
                data: {
                    clockwise: gameState.clockwise,
                    whoseTurn: finalWhoseTurn,
                    discardCard: gameState.discardCard as any,
                    counter: gameState.counter,
                }
            })

            const playersData = gameState.players
            for (let i = 0; i < gameState.players.length; i++) {
                await prisma.player.update({
                    where: {
                        email: gameState.players[i].email as string
                    },
                    data: {
                        deck: gameState.players[i].deck
                    }
                })
            }

        }
    }

    private async handleDisconnect(socket: Socket, io: Server) {
        console.log("Disconnected:", socket.id);
        this.players = this.players.filter(player => player[1] !== socket.id);

        const player = await prisma.player.findUnique({
            where: { socketId: socket.id }                         // finding player who got disconnected
        });
        try {
            if (player) {
                const roomId = player.roomId;
                await prisma.player.update({
                    where: {
                        socketId: player.socketId
                    },
                    data: {
                        online: false                    // updating that player is offline in database
                    }
                });

                const room = await prisma.room.findUnique({
                    where: { id: roomId },
                    include: {
                        players: {
                            orderBy: {
                                index: 'asc', // or 'desc' for descending
                            },
                        },
                    },
                });
                let onlineCount = 0
                if (room) {

                    for (let i = 0; i < 4; i++) {
                        if (room.players[i]?.online === true) {
                            onlineCount++                           // counting how many players are online
                        }
                    }
                    if (onlineCount === 0) {
                        this.stopTimer(roomId)
                        await prisma.player.deleteMany({
                            where: {
                                roomId: roomId                  // if all are offline, delete the room details from database
                            }
                        })
                        await prisma.room.delete({
                            where: {
                                id: roomId
                            }
                        })
                        return
                    }
                    const fixedPlayers = room.players.map(p => ({
                        roomId: p.roomId,
                        playerName: p.playerName,
                        socketId: p.socketId,
                        email: p.email,
                        deck: p.deck as any[], // ✅ cast deck to array
                    }));
                    let whoseTurn = room.whoseTurn
                    const gameState = {
                        roomId: roomId,
                        clockwise: room?.clockwise,
                        whoseTurn: room?.whoseTurn,
                        discardCard: room?.discardCard as unknown as Card,
                        players: fixedPlayers,
                        counter: room?.counter,
                        extraCards: null,
                    };
                    if (player.email == room.players[whoseTurn].email) {
                        if (room.counter > 0) {
                            const extraCards = randomDeckGen(room.counter)
                            let newDeck: any[] = Array.isArray(player.deck) ? [...player.deck] : [];
                            newDeck = [...newDeck, ...extraCards]
                            gameState.players[whoseTurn].deck = newDeck
                            gameState.counter = 0
                        }
                        let nextWhoseTurn: number
                        if (gameState.clockwise) {
                            nextWhoseTurn = (gameState.whoseTurn as number + 1) % gameState.players.length
                        }
                        else {
                            nextWhoseTurn = (gameState.whoseTurn as number - 1 + gameState.players.length) % gameState.players.length
                        }
                        gameState.whoseTurn = nextWhoseTurn

                    }
                    // io.in(roomId).emit("new game state", gameState);
                    this.handleNewGameState(socket, io, gameState, gameState.roomId, player.email)

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

            gameState.discardCard = { ...gameState.discardCard, value: ' ' }

            console.log("Extra cards New game state:", playerEmail, gameState);

            // io.in(gameState.roomId).emit("got extra cards", counter, player);
            // socket.emit("got extra cards", counter, player);
            gameState.extraCards = {
                playerEmail: playerEmail,
                counter: counter
            }
            // io.in(gameState.roomId).emit("new game state", gameState);
            // socket.emit("new game state", gameState);
            this.handleNewGameState(socket, io, gameState, gameState.roomId, playerEmail)
        }
    }

    private async handleMessage(socket: Socket, io: Server, name: string, msg: string, roomId: string) {
        console.log('Broadcasting message', msg)
        io.in(roomId).emit("message", name, msg);
    }

    private async handleToast(socket: Socket, io: Server, toast: string, roomId: string) {
        console.log('Broadcasting toast', toast)
        io.in(roomId).emit("new toast", toast);
        socket.emit("new toast", toast)
    }

    public initListeners() {
        const io = this._io;
        console.log("Init Socket listeners...");

        io.on("connect", (socket) => {
            console.log("New connection:", socket.id);

            socket.on('message', (name: string, msg: string, roomId: string) =>
                this.handleMessage(socket, io, name, msg, roomId)
            );

            socket.on('coming to waiting room', (username: string, roomId: string) =>
                this.handleWaitingRoom(socket, io, username, roomId)
            );

            socket.on('join room', async (roomId: string, playerName: string, playerEmail: string) => //remove deck parameter
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
                this.handleDisconnect(socket, io)
            );

            socket.on("new toast", (toast: string, roomId: string)=>{
                this.handleToast(socket, io, toast, roomId)
            })
        });
    }

    get io(): Server {
        return this._io;
    }
}

export default SocketService;
