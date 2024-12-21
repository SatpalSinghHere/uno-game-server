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
            const handleWaitingRoom = (username, roomId) => {
                if (!this.players.some(player => player[0] === roomId && player[1] === socket.id && player[2] === username)) {
                    this.players.push([roomId, socket.id, username]);
                    console.log(socket.id, ' Joined Room : ', roomId);
                    socket.join(roomId);
                    console.log('new player waiting');
                    io.in(roomId).emit('players waiting', this.players);
                    socket.emit('players waiting', this.players);
                }
            };
            socket.on('coming to waiting room', handleWaitingRoom);
            socket.on('join room', (roomId, playerName, playerEmail, deck) => __awaiter(this, void 0, void 0, function* () {
                console.log("Joined room: ", roomId);
                socket.join(roomId);
                console.log('player information : ', playerName, playerEmail, deck);
                let room;
                try {
                    room = yield prisma.room.create({
                        data: {
                            id: roomId,
                            clockwise: true,
                            whoseTurn: 0,
                            discardCard: { color: cardObjects_1.cardList[12].color, value: '7' },
                        },
                        include: {
                            players: true
                        }
                    });
                }
                catch (error) {
                    if (error.code == 'P2002') {
                        console.log('DUPLICATE ROOM ENTRY');
                        room = yield prisma.room.findUnique({
                            where: {
                                id: roomId
                            },
                            include: {
                                players: true
                            }
                        });
                    }
                    else {
                        throw error;
                    }
                }
                const recDeck = deck;
                let player;
                try {
                    player = yield prisma.player.create({
                        data: {
                            playerName: playerName,
                            email: playerEmail,
                            roomId: room === null || room === void 0 ? void 0 : room.id,
                            socketId: socket.id,
                            deck: recDeck,
                            // room : { connect : { id : room.id } }
                        },
                    });
                }
                catch (error) {
                    if (error.code === 'P2002') {
                        // Handle unique constraint violation
                        console.log('DUPLICATE PLAYER ENTRY');
                    }
                    else {
                        throw error; // Rethrow other unexpected errors
                    }
                }
                const gameState = {
                    roomId: roomId,
                    clockwise: room === null || room === void 0 ? void 0 : room.clockwise,
                    whoseTurn: room === null || room === void 0 ? void 0 : room.whoseTurn,
                    discardCard: room === null || room === void 0 ? void 0 : room.discardCard,
                    players: room === null || room === void 0 ? void 0 : room.players
                };
                socket.in(roomId).emit('new game state', gameState);
                socket.emit('new game state', gameState);
            }));
            socket.on("Start Game", (roomId) => {
                io.in(roomId).emit("Start Game", roomId);
                socket.emit("Start Game", roomId);
            });
            socket.on("new game state", (data) => {
                console.log("New game State ", data);
                io.emit("new game state", data);
            });
            socket.on("disconnect", () => __awaiter(this, void 0, void 0, function* () {
                console.log("Disconnected: ", socket.id);
                this.players = this.players.filter(player => player[1] !== socket.id);
                // io.in(this.players[0][0]).emit("players waiting", this.players)
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
                    const room = yield prisma.room.findUnique({
                        where: {
                            id: roomId
                        },
                        include: {
                            players: true
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
                }
            }));
        });
    }
    get io() {
        return this._io;
    }
}
exports.default = SocketService;
