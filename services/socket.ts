import { Server } from "socket.io";


class SocketService {
    private _io: Server
    constructor (){
        this._io = new Server({
            cors: {
                origin: "*",
                allowedHeaders: ["*"]
            }
        })
    }

    public initListeners(){
        const io = this._io
        console.log("Init Socket listeners...")

        io.on("connect", (socket) => {
            console.log("New connection: ", socket.id)
            socket.on("disconnect", () => {
                console.log("Disconnected: ", socket.id)
            })
            const card = {color: "#D32F2F", value: 3}
            io.emit("New Central Card", JSON.stringify(card))

            socket.on("New Central Card", (data) => {
                console.log("New Central Card: ", data)
                io.emit("New Central Card", data)
            })
        })
    }
    get io(): Server{
        return this._io
    }

}

export default SocketService