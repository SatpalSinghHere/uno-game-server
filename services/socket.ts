import { Server } from "socket.io";


class SocketService {
    private _io: Server
    private players
    private turnOrder
    
    constructor (){
        this._io = new Server({
            cors: {
                origin: "*",
                allowedHeaders: ["*"]
            }
        })

        this.players = <string[]>[]
        this.turnOrder = <number[]>[]
    }

    public initListeners(){
        const io = this._io
        console.log("Init Socket listeners...")

        io.on("connect", (socket) => {
            console.log("New connection: ", socket.id)

            socket.on('join room', (room) => {
                console.log("Joined room: ", room)
                socket.join(room)
            })

            this.players.push(socket.id)
            io.emit("Online Players", this.players)

            const card = {color: "#D32F2F", value: '3'}
            io.emit("New Central Card", JSON.stringify(card))

            socket.on("Start Game", ()=>{
                io.emit("Start Game")
            })
            
            socket.on("New Central Card", (data) => {
                console.log("New Central Card: ", data)
                io.emit("New Central Card", data)
            })
            
            
            socket.on("disconnect", () => {
                console.log("Disconnected: ", socket.id)
                this.players = this.players.filter(player => player !== socket.id)
                io.emit("Online Players", this.players)
            })
        })
    }
    get io(): Server{
        return this._io
    }

}

export default SocketService