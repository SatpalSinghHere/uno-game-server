import { Server } from "socket.io";
import { Card, cardList } from "../utils/cardObjects";
import { Prisma, PrismaClient } from "@prisma/client";
import { connect } from "http2";

const prisma = new PrismaClient()


class SocketService {
    private _io: Server
    private players
    private turnOrder

    constructor() {
        this._io = new Server({
            cors: {
                origin: "*",
                allowedHeaders: ["*"]
            }
        })

        this.players = <string[]>[]
        this.turnOrder = <number[]>[]
    }

    public initListeners() {
        const io = this._io
        console.log("Init Socket listeners...")

        io.on("connect", (socket) => {
            console.log("New connection: ", socket.id)

            socket.on('join room', async (roomId: string, playerName: string, playerEmail: string, deck: Card[]) => {
                console.log("Joined room: ", roomId)
                socket.join(roomId)

                console.log('player information : ', playerName, playerEmail, deck)
                let room
                try{
                    room = await prisma.room.create({
                        data:{
                            id: roomId,
                            clockwise: true,
                            whoseTurn: 0,
                            discardCard: {color: cardList[12].color, value: '7'},
                        }
                    })
                }
                catch(error: any){
                    if(error.code == 'P2002'){
                        console.log('DUPLICATE ROOM ENTRY')
                        room = await prisma.room.findUnique({
                            where: {
                                id: roomId
                            }
                        })
                    }
                    else{
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
                        include: {
                            room: true
                        }
                    })
                } catch (error : any) {
                    if (error.code === 'P2002') {
                        // Handle unique constraint violation
                        console.log('DUPLICATE PLAYER ENTRY',error);
                        
                    } else {
                        throw error; // Rethrow other unexpected errors
                    }
                }

            })

            this.players.push(socket.id)
            io.emit("Online Players", this.players)

            const card = { color: "#D32F2F", value: '3' }
            io.emit("New Central Card", JSON.stringify(card))

            socket.on("Start Game", (roomId) => {

                io.emit("Start Game", roomId)
            })

            socket.on("New Central Card", (data) => {
                console.log("New Central Card: ", data)
                io.emit("New Central Card", data)
            })


            socket.on("disconnect", async() => {
                console.log("Disconnected: ", socket.id)
                this.players = this.players.filter(player => player !== socket.id)
                io.emit("Online Players", this.players)

                const player = await prisma.player.findUnique({
                    where: {
                        socketId: socket.id
                    }
                })
                let roomId
                if(player){
                    roomId = player.roomId
                    await prisma.player.delete({
                        where: {
                            socketId: player.socketId
                        }
                    })
                }

                const room = await prisma.room.findUnique({
                    where: {
                        id: roomId
                    },
                    include: {
                        players: true
                    }
                })

                if(room){
                    const playerCount = room.players.length
                    if(playerCount === 0){
                        await prisma.room.delete({
                            where: {
                                id: roomId
                            }
                        })
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