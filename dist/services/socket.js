"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const cardObjects_1 = require("../utils/cardObjects");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
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
            socket.on('join room', (roomId, playerName, playerEmail, deck) => __awaiter(this, void 0, void 0, function* () {
                console.log("Joined room: ", roomId);
                socket.join(roomId);
                console.log('player information : ', playerName, playerEmail, deck);
                let room = yield prisma.room.findUnique({
                    where: {
                        id: roomId
                    }
                });
                if (!room) {
                    room = yield prisma.room.create({
                        data: {
                            id: roomId,
                            clockwise: true,
                            whoseTurn: 0,
                            discardCard: { color: cardObjects_1.cardList[12].color, value: '7' }
                        }
                    });
                }
                const recDeck = deck;
                let player;
                try {
                    player = yield prisma.player.create({
                        data: {
                            playerName: playerName,
                            email: playerEmail,
                            roomId: room.id,
                            socketId: socket.id,
                            deck: recDeck,
                            // room : { connect : { id : room.id } }
                        },
                        include: {
                            room: true
                        }
                    });
                }
                catch (error) {
                    if (error.code === 'P2002') {
                        // Handle unique constraint violation
                        console.log(`Room with ID ${roomId} already created by another process.`);
                        room = yield prisma.room.findUnique({
                            where: {
                                id: roomId,
                            },
                        });
                    }
                    else {
                        throw error; // Rethrow other unexpected errors
                    }
                }
            }));
            this.players.push(socket.id);
            io.emit("Online Players", this.players);
            const card = { color: "#D32F2F", value: '3' };
            io.emit("New Central Card", JSON.stringify(card));
            socket.on("Start Game", (roomId) => {
                io.emit("Start Game", roomId);
            });
            socket.on("New Central Card", (data) => {
                console.log("New Central Card: ", data);
                io.emit("New Central Card", data);
            });
            socket.on("disconnect", () => __awaiter(this, void 0, void 0, function* () {
                console.log("Disconnected: ", socket.id);
                this.players = this.players.filter(player => player !== socket.id);
                io.emit("Online Players", this.players);
                const player = yield prisma.player.findUnique({
                    where: {
                        socketId: socket.id
                    }
                });
                let roomId;
                if (player) {
                    roomId = player.roomId;
                    yield prisma.player.delete({
                        where: {
                            socketId: player.socketId
                        }
                    });
                }
                const room = prisma.room.findUnique({
                    where: {
                        id: roomId
                    }
                });
                if (room) {
                    const playerCount = room.players.length;
                    if (playerCount === 0) {
                        yield prisma.room.delete({
                            where: {
                                id: roomId
                            }
                        });
                    }
                }
            }));
        });
    }
    get io() {
        return this._io;
    }
}
exports.default = SocketService;
