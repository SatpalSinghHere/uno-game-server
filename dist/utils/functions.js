"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomDeckGen = void 0;
const cardObjects_1 = require("./cardObjects");
const randomDeckGen = (length) => {
    const randomDeck = [];
    for (let i = 0; i < length; i++) {
        const index = Math.floor(Math.random() * cardObjects_1.cardList.length);
        randomDeck.push(cardObjects_1.cardList[index]);
    }
    return randomDeck;
};
exports.randomDeckGen = randomDeckGen;
