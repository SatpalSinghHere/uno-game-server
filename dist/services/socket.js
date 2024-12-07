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
        this.players = [];
        this.turnOrder = [];
    }
    initListeners() {
        const io = this._io;
        console.log("Init Socket listeners...");
        io.on("connect", (socket) => {
            console.log("New connection: ", socket.id);
            this.players.push(socket.id);
            io.emit("Online Players", this.players);
            const card = { color: "#D32F2F", value: 3 };
            io.emit("New Central Card", JSON.stringify(card));
            socket.on("Start Game", () => {
                io.emit("Start Game");
            });
            socket.on("New Central Card", (data) => {
                console.log("New Central Card: ", data);
                io.emit("New Central Card", data);
            });
            socket.on("disconnect", () => {
                console.log("Disconnected: ", socket.id);
                this.players = this.players.filter(player => player !== socket.id);
                io.emit("Online Players", this.players);
            });
        });
    }
    get io() {
        return this._io;
    }
}
exports.default = SocketService;
