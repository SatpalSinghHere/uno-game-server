import { Server } from "socket.io";
import { Card, cardList } from "../utils/cardObjects";
import { Prisma, PrismaClient } from "@prisma/client";
import { connect } from "http2";

const prisma = new PrismaClient()


class SocketService {
    private _io: Server
    private players: Array<string[]>
    private turnOrder

    constructor() {
        this._io = new Server({
            cors: {
                origin: "*",
                allowedHeaders: ["*"]
            }
        })

        this.players = []
        this.turnOrder = <number[]>[]
    }

    public initListeners() {
        const io = this._io
        console.log("Init Socket listeners...")

        io.on("connect", (socket) => {
            console.log("New connection: ", socket.id)

            const handleWaitingRoom = (username: string, roomId: string) => {
                this.players.push([roomId, socket.id, username]);
                console.log(socket.id,' Joined Room : ', roomId)
                socket.join(roomId)
                console.log('new player waiting');
                io.in('roomId').emit('players waiting', this.players);
                io.to(socket.id).emit('players waiting', this.players);
                socket.off('coming to waiting room', handleWaitingRoom);
                
            };

            socket.on('coming to waiting room', handleWaitingRoom);

            socket.on('join room', async (roomId: string, playerName: string, playerEmail: string, deck: Card[]) => {
                console.log("Joined room: ", roomId)
                socket.join(roomId)

                console.log('player information : ', playerName, playerEmail, deck)
                let room
                try {
                    room = await prisma.room.create({
                        data: {
                            id: roomId,
                            clockwise: true,
                            whoseTurn: 0,
                            discardCard: { color: cardList[12].color, value: '7' },
                        },
                        include:{
                            players: true
                        }
                    })
                }
                catch (error: any) {
                    if (error.code == 'P2002') {
                        console.log('DUPLICATE ROOM ENTRY')
                        room = await prisma.room.findUnique({
                            where: {
                                id: roomId
                            },
                            include: {
                                players: true
                            }
                        })
                    }
                    else {
                        throw error
                    }
                }

                const recDeck: Array<any> = deck

                let player



                try {
                    player = await prisma.player.create({
                        data: {
                            playerName: playerName,
                            email: playerEmail,
                            roomId: room?.id,
                            socketId: socket.id,
                            deck: recDeck,
                            // room : { connect : { id : room.id } }
                        },
                        
                    })
                } catch (error: any) {
                    if (error.code === 'P2002') {
                        // Handle unique constraint violation
                        console.log('DUPLICATE PLAYER ENTRY');

                    } else {
                        throw error; // Rethrow other unexpected errors
                    }
                }

                const gameState = {
                    roomId: roomId,
                    clockwise: room?.clockwise,
                    whoseTurn: room?.whoseTurn,
                    discardCard: room?.discardCard,
                    players: room?.players
                }

                socket.in(roomId).emit('new game state', gameState)
                socket.to(socket.id).emit('new game state', gameState)

            })



            socket.on("Start Game", (roomId) => {

                io.emit("Start Game", roomId)
            })

            socket.on("new game state", (data) => {
                console.log("New game State ", data)
                io.emit("new game state", data)
            })


            socket.on("disconnect", async () => {
                console.log("Disconnected: ", socket.id)
                this.players = this.players.filter(player => player[1] !== socket.id)
                // io.in(this.players[0][0]).emit("players waiting", this.players)

                const player = await prisma.player.findUnique({
                    where: {
                        socketId: socket.id
                    }
                })
                let roomId
                if (player) {
                    roomId = player.roomId
                    await prisma.player.delete({
                        where: {
                            socketId: player.socketId
                        }
                    })


                    const room = await prisma.room.findUnique({
                        where: {
                            id: roomId
                        },
                        include: {
                            players: true
                        }
                    })


                    if (room) {
                        const playerCount = room.players.length
                        if (playerCount === 0) {
                            await prisma.room.delete({
                                where: {
                                    id: roomId
                                }
                            })
                        }
                    }
                }
            })
        })
    }
    get io(): Server {
        return this._io
    }

}

export default SocketService