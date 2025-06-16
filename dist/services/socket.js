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
const functions_1 = require("../utils/functions");
const prisma = new client_1.PrismaClient();
;
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
        this.timers = {};
    }
    launchTimer(roomId) {
        let seconds = 10;
        // If there's already a timer for this room, stop it first
        if (this.timers[roomId]) {
            clearInterval(this.timers[roomId]);
        }
        const intervalId = setInterval(() => __awaiter(this, void 0, void 0, function* () {
            if (seconds === 0) {
                const room = yield prisma.room.findUnique({
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
                    const whoseTurn = room.players[room.whoseTurn];
                    if (whoseTurn) {
                        const socketId = whoseTurn.socketId;
                        console.log('Timeout', whoseTurn.email);
                        this.io.to(socketId).emit("time is up");
                    }
                }
                seconds = 10;
            }
            seconds--;
        }), 1000);
        this.timers[roomId] = intervalId; // Save the timer
    }
    stopTimer(roomId) {
        if (this.timers[roomId]) {
            clearInterval(this.timers[roomId]);
            delete this.timers[roomId];
            console.log(`Timer for ${roomId} stopped`);
        }
    }
    handleWaitingRoom(socket, io, username, roomId) {
        if (!this.players.some(player => player[0] === roomId && player[1] === socket.id && player[2] === username)) {
            this.players.push([roomId, socket.id, username]);
            console.log(socket.id, 'Joined Room:', roomId);
            socket.join(roomId);
            console.log('New player waiting');
            const thisRoomPlayers = this.players.filter((player) => player[0] == roomId);
            io.in(roomId).emit('players waiting', thisRoomPlayers);
            socket.emit('players waiting', thisRoomPlayers);
        }
    }
    handleJoinRoom(socket, io, roomId, playerName, playerEmail) {
        return __awaiter(this, void 0, void 0, function* () {
            if ((socket.rooms.size >= 1)) {
                console.log("Joined room:", roomId);
                socket.join(roomId);
            }
            let room;
            try {
                room = yield prisma.room.create({
                    data: {
                        id: roomId,
                        clockwise: true,
                        whoseTurn: 1,
                        counter: 0,
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
                        where: { id: roomId },
                        include: {
                            players: {
                                orderBy: {
                                    index: 'asc', // or 'desc' for descending
                                },
                            },
                        },
                    });
                }
                else {
                    throw error;
                }
            }
            const deck = (0, functions_1.randomDeckGen)(10);
            console.log('Player information:', playerName, playerEmail, deck);
            let player = yield prisma.player.findUnique({
                where: { email: playerEmail }
            });
            if (player) {
                yield prisma.player.update({
                    where: {
                        email: playerEmail
                    },
                    data: {
                        socketId: socket.id,
                        online: true
                    }
                });
            }
            try {
                const playersInRoom = yield prisma.player.findMany({
                    where: { roomId },
                });
                yield prisma.player.create({
                    data: {
                        socketId: socket.id,
                        email: playerEmail,
                        playerName,
                        deck,
                        roomId,
                        index: playersInRoom.length, // Starts from 0
                    },
                });
            }
            catch (error) {
                if (error.code === 'P2002') {
                    console.log('DUPLICATE PLAYER ENTRY');
                }
                else {
                    throw error;
                }
            }
            const players = yield prisma.player.findMany({
                where: { roomId: roomId },
                orderBy: { index: 'asc' }
            });
            const gameState = {
                roomId: roomId,
                clockwise: room === null || room === void 0 ? void 0 : room.clockwise,
                whoseTurn: room === null || room === void 0 ? void 0 : room.whoseTurn,
                discardCard: room === null || room === void 0 ? void 0 : room.discardCard,
                players: players,
                counter: room === null || room === void 0 ? void 0 : room.counter
            };
            console.log('NEW GAME STATE WHOSE TURN', gameState.whoseTurn);
            this.launchTimer(roomId); //launching Timer
            io.in(roomId).emit('new game state', gameState);
            socket.emit('new game state', gameState);
        });
    }
    handleStartGame(socket, io, roomId) {
        io.in(roomId).emit("Start Game", roomId);
        // socket.emit("Start Game", roomId);
    }
    handleNewGameState(socket, io, gameState, roomId, playerEmail) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            console.log('receiving new gameState');
            if (gameState.discardCard.value === '+2') {
                gameState.counter = gameState.counter + 2;
            }
            if (gameState.discardCard.value === '+4') {
                gameState.counter = gameState.counter + 4;
            }
            if (roomId) {
                let players = yield prisma.player.findMany({
                    where: { roomId: roomId },
                    orderBy: { index: 'asc' } // get all the players
                });
                let finalWhoseTurn;
                if (players) {
                    let room = yield prisma.room.findUnique({
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
                        let whoseTurnIndex = gameState.whoseTurn;
                        console.log('PREVIOUS TURN : ', whoseTurnIndex, players[whoseTurnIndex].email);
                        let player = players[whoseTurnIndex]; // this player played this move
                        let playerOnline = false;
                        const onlinePlayers = players.filter(p => p.online);
                        if (onlinePlayers.length == 2 && (gameState.discardCard.value == 'S' || gameState.discardCard.value == 'R')) {
                            whoseTurnIndex = whoseTurnIndex;
                        }
                        else {
                            while (playerOnline == false) {
                                if (player.online) {
                                    playerOnline = true;
                                }
                                else {
                                    if (gameState.clockwise) {
                                        whoseTurnIndex = (whoseTurnIndex + 1) % players.length;
                                        player = players[whoseTurnIndex];
                                    }
                                    else {
                                        whoseTurnIndex = (whoseTurnIndex - 1 + players.length) % players.length;
                                        player = players[whoseTurnIndex];
                                    }
                                    console.log('NEXT WHOSE TURN : ', whoseTurnIndex, players[whoseTurnIndex].email);
                                    player = players[whoseTurnIndex]; //player = who will play next
                                }
                            }
                        }
                        finalWhoseTurn = whoseTurnIndex;
                        console.log('FINAL WHOSE TURN : ', finalWhoseTurn);
                        gameState.whoseTurn = whoseTurnIndex;
                    }
                }
                // console.log("New game state:", gameState, roomId);
                io.in(roomId).emit("new game state", gameState); // broadcasting new game state
                socket.emit("new game state", gameState);
                this.launchTimer(roomId); // restarting the timer for this roomId
                let newDeck = (_a = gameState.players.find(player => player.email === playerEmail)) === null || _a === void 0 ? void 0 : _a.deck;
                if (newDeck) {
                    yield prisma.player.update({
                        where: {
                            email: playerEmail
                        }, // updating current deck data in database
                        data: {
                            deck: newDeck
                        }
                    });
                }
                yield prisma.room.update({
                    where: {
                        id: roomId
                    },
                    data: {
                        clockwise: gameState.clockwise,
                        whoseTurn: finalWhoseTurn,
                        discardCard: gameState.discardCard,
                        counter: gameState.counter,
                    }
                });
                const playersData = gameState.players;
                for (let i = 0; i < gameState.players.length; i++) {
                    yield prisma.player.update({
                        where: {
                            email: gameState.players[i].email
                        },
                        data: {
                            deck: gameState.players[i].deck
                        }
                    });
                }
            }
        });
    }
    handleDisconnect(socket, io) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            console.log("Disconnected:", socket.id);
            this.players = this.players.filter(player => player[1] !== socket.id);
            const player = yield prisma.player.findUnique({
                where: { socketId: socket.id } // finding player who got disconnected
            });
            try {
                if (player) {
                    const roomId = player.roomId;
                    yield prisma.player.update({
                        where: {
                            socketId: player.socketId
                        },
                        data: {
                            online: false // updating that player is offline in database
                        }
                    });
                    const room = yield prisma.room.findUnique({
                        where: { id: roomId },
                        include: {
                            players: {
                                orderBy: {
                                    index: 'asc', // or 'desc' for descending
                                },
                            },
                        },
                    });
                    let onlineCount = 0;
                    if (room) {
                        for (let i = 0; i < 4; i++) {
                            if (((_a = room.players[i]) === null || _a === void 0 ? void 0 : _a.online) === true) {
                                onlineCount++; // counting how many players are online
                            }
                        }
                        if (onlineCount === 0) {
                            this.stopTimer(roomId);
                            yield prisma.player.deleteMany({
                                where: {
                                    roomId: roomId // if all are offline, delete the room details from database
                                }
                            });
                            yield prisma.room.delete({
                                where: {
                                    id: roomId
                                }
                            });
                            return;
                        }
                        const fixedPlayers = room.players.map(p => ({
                            roomId: p.roomId,
                            playerName: p.playerName,
                            socketId: p.socketId,
                            email: p.email,
                            deck: p.deck, // ✅ cast deck to array
                        }));
                        let whoseTurn = room.whoseTurn;
                        const gameState = {
                            roomId: roomId,
                            clockwise: room === null || room === void 0 ? void 0 : room.clockwise,
                            whoseTurn: room === null || room === void 0 ? void 0 : room.whoseTurn,
                            discardCard: room === null || room === void 0 ? void 0 : room.discardCard,
                            players: fixedPlayers,
                            counter: room === null || room === void 0 ? void 0 : room.counter,
                            extraCards: null,
                        };
                        if (player.email == room.players[whoseTurn].email) {
                            if (room.counter > 0) {
                                const extraCards = (0, functions_1.randomDeckGen)(room.counter);
                                let newDeck = Array.isArray(player.deck) ? [...player.deck] : [];
                                newDeck = [...newDeck, ...extraCards];
                                gameState.players[whoseTurn].deck = newDeck;
                                gameState.counter = 0;
                            }
                            let nextWhoseTurn;
                            if (gameState.clockwise) {
                                nextWhoseTurn = (gameState.whoseTurn + 1) % gameState.players.length;
                            }
                            else {
                                nextWhoseTurn = (gameState.whoseTurn - 1 + gameState.players.length) % gameState.players.length;
                            }
                            gameState.whoseTurn = nextWhoseTurn;
                        }
                        // io.in(roomId).emit("new game state", gameState);
                        this.handleNewGameState(socket, io, gameState, gameState.roomId, player.email);
                    }
                }
            }
            catch (error) {
                if (error.code === 'P2025') {
                    console.log('Room already deleted');
                }
                else {
                    throw error;
                }
            }
        });
    }
    handleForNoPlusCard(socket, io, gameState, playerEmail) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('handling no plus card, game state ->', gameState);
            if (gameState && playerEmail) {
                let counter = gameState === null || gameState === void 0 ? void 0 : gameState.counter;
                let extraCards = (0, functions_1.randomDeckGen)(counter);
                gameState.counter = 0;
                if (gameState.clockwise) {
                    gameState.whoseTurn = (gameState.whoseTurn + 1) % gameState.players.length;
                }
                else {
                    gameState.whoseTurn = (gameState.whoseTurn - 1 + gameState.players.length) % gameState.players.length;
                }
                let player = gameState.players.find(player => player.email === playerEmail);
                let deck = player === null || player === void 0 ? void 0 : player.deck;
                deck = deck === null || deck === void 0 ? void 0 : deck.concat(extraCards);
                if (deck) {
                    gameState.players.find(player => player.email === playerEmail).deck = deck;
                }
                gameState.discardCard = Object.assign(Object.assign({}, gameState.discardCard), { value: ' ' });
                console.log("Extra cards New game state:", playerEmail, gameState);
                // io.in(gameState.roomId).emit("got extra cards", counter, player);
                // socket.emit("got extra cards", counter, player);
                gameState.extraCards = {
                    playerEmail: playerEmail,
                    counter: counter
                };
                // io.in(gameState.roomId).emit("new game state", gameState);
                // socket.emit("new game state", gameState);
                this.handleNewGameState(socket, io, gameState, gameState.roomId, playerEmail);
            }
        });
    }
    handleMessage(socket, io, name, msg, roomId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Broadcasting message', msg);
            io.in(roomId).emit("message", name, msg);
        });
    }
    handleToast(socket, io, toast, roomId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Broadcasting toast', toast);
            io.in(roomId).emit("new toast", toast);
            socket.emit("new toast", toast);
        });
    }
    initListeners() {
        const io = this._io;
        console.log("Init Socket listeners...");
        io.on("connect", (socket) => {
            console.log("New connection:", socket.id);
            socket.on('message', (name, msg, roomId) => this.handleMessage(socket, io, name, msg, roomId));
            socket.on('coming to waiting room', (username, roomId) => this.handleWaitingRoom(socket, io, username, roomId));
            socket.on('join room', (roomId, playerName, playerEmail) => //remove deck parameter
             __awaiter(this, void 0, void 0, function* () { //remove deck parameter
            return this.handleJoinRoom(socket, io, roomId, playerName, playerEmail); }));
            socket.on("Start Game", (roomId) => this.handleStartGame(socket, io, roomId));
            socket.on("new game state", (data, roomId, playerEmail) => this.handleNewGameState(socket, io, data, roomId, playerEmail));
            socket.on("+ card not available", (gameState, playerEmail) => {
                this.handleForNoPlusCard(socket, io, gameState, playerEmail);
            });
            socket.on("disconnect", () => this.handleDisconnect(socket, io));
            socket.on("new toast", (toast, roomId) => {
                this.handleToast(socket, io, toast, roomId);
            });
        });
    }
    get io() {
        return this._io;
    }
}
exports.default = SocketService;
