"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
class SocketService {
    constructor() {
        this._io = new socket_io_1.Server({
            cors: {
                origin: "*",
                allowedHeaders: ["*"]
            }
        });
    }
    initListeners() {
        const io = this._io;
        console.log("Init Socket listeners...");
        io.on("connect", (socket) => {
            console.log("New connection: ", socket.id);
            socket.on("disconnect", () => {
                console.log("Disconnected: ", socket.id);
            });
            const card = { color: "#D32F2F", value: 3 };
            io.emit("New Central Card", JSON.stringify(card));
            socket.on("New Central Card", (data) => {
                console.log("New Central Card: ", data);
                io.emit("New Central Card", data);
            });
        });
    }
    get io() {
        return this._io;
    }
}
exports.default = SocketService;
