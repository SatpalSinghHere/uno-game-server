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
    handleWaitingRoom(socket, io, username, roomId) {
        if (!this.players.some(player => player[0] === roomId && player[1] === socket.id && player[2] === username)) {
            this.players.push([roomId, socket.id, username]);
            console.log(socket.id, 'Joined Room:', roomId);
            socket.join(roomId);
            console.log('New player waiting');
            io.in(roomId).emit('players waiting', this.players);
            socket.emit('players waiting', this.players);
        }
    }
    handleJoinRoom(socket, io, roomId, playerName, playerEmail) {
        return __awaiter(this, void 0, void 0, function* () {
            if ((socket.rooms.size === 1)) {
                console.log("Joined room:", roomId);
                socket.join(roomId);
            }
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
                        where: { id: roomId },
                        include: { players: true }
                    });
                }
                else {
                    throw error;
                }
            }
            const deck = (0, functions_1.randomDeckGen)(10);
            console.log('Player information:', playerName, playerEmail, deck);
            try {
                yield prisma.player.create({
                    data: {
                        playerName: playerName,
                        email: playerEmail,
                        roomId: roomId,
                        socketId: socket.id,
                        deck: deck,
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
                where: { roomId: roomId }
            });
            const gameState = {
                roomId: roomId,
                clockwise: room === null || room === void 0 ? void 0 : room.clockwise,
                whoseTurn: room === null || room === void 0 ? void 0 : room.whoseTurn,
                discardCard: room === null || room === void 0 ? void 0 : room.discardCard,
                players: players
            };
            console.log('NEW GAME STATE', gameState);
            io.in(roomId).emit('new game state', gameState);
            socket.emit('new game state', gameState);
        });
    }
    handleStartGame(socket, io, roomId) {
        io.in(roomId).emit("Start Game", roomId);
        socket.emit("Start Game", roomId);
    }
    handleNewGameState(socket, io, data, roomId) {
        if (data.discardCard.value === '+2') {
            let whoseTurn = data.players[data.whoseTurn];
            let havingPLus2 = false;
            for (let i = 0; i < whoseTurn.deck.length; i++) {
                if (whoseTurn.deck[i].value === '+2') {
                    havingPLus2 = true;
                    break;
                }
            }
            if (!havingPLus2) {
                let addCard = (0, functions_1.randomDeckGen)(2);
                data.players[data.whoseTurn].deck.push(addCard[0]);
                data.players[data.whoseTurn].deck.push(addCard[1]);
            }
        }
        if (data.discardCard.value === '+4') {
            let whoseTurn = data.players[data.whoseTurn];
            let havingPLus4 = false;
            for (let i = 0; i < whoseTurn.deck.length; i++) {
                if (whoseTurn.deck[i].value === '+4') {
                    havingPLus4 = true;
                    break;
                }
            }
            if (!havingPLus4) {
                let addCard = (0, functions_1.randomDeckGen)(4);
                data.players[data.whoseTurn].deck.push(addCard[0]);
                data.players[data.whoseTurn].deck.push(addCard[1]);
                data.players[data.whoseTurn].deck.push(addCard[2]);
                data.players[data.whoseTurn].deck.push(addCard[3]);
            }
        }
        console.log("New game state:", data, roomId);
        io.in(roomId).emit("new game state", data);
        socket.emit("new game state", data);
    }
    handleDisconnect(socket) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Disconnected:", socket.id);
            this.players = this.players.filter(player => player[1] !== socket.id);
            const player = yield prisma.player.findUnique({
                where: { socketId: socket.id }
            });
            try {
                if (player) {
                    const roomId = player.roomId;
                    yield prisma.player.delete({ where: { socketId: player.socketId } });
                    const room = yield prisma.room.findUnique({
                        where: { id: roomId },
                        include: { players: true }
                    });
                    if (room && room.players.length === 0) {
                        yield prisma.room.delete({ where: { id: roomId } });
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
    initListeners() {
        const io = this._io;
        console.log("Init Socket listeners...");
        io.on("connect", (socket) => {
            console.log("New connection:", socket.id);
            socket.on('coming to waiting room', (username, roomId) => this.handleWaitingRoom(socket, io, username, roomId));
            socket.on('join room', (roomId, playerName, playerEmail, deck) => //remove deck parameter
             __awaiter(this, void 0, void 0, function* () { //remove deck parameter
            return this.handleJoinRoom(socket, io, roomId, playerName, playerEmail); }));
            socket.on("Start Game", (roomId) => this.handleStartGame(socket, io, roomId));
            socket.on("new game state", (data, roomId) => this.handleNewGameState(socket, io, data, roomId));
            socket.on("disconnect", () => this.handleDisconnect(socket));
        });
    }
    get io() {
        return this._io;
    }
}
exports.default = SocketService;
