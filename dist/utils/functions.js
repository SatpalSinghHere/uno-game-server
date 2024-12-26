"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomDeckGen = void 0;
const cardObjects_1 = require("./cardObjects");
const randomDeckGen = (length) => {
    const randomDeck = [];
    for (let i = 0; i < length; i++) {
        const index = Math.floor(Math.random() * cardObjects_1.cardList.length);
        let card = Object.assign(Object.assign({}, cardObjects_1.cardList[index]), { id: crypto.randomUUID().replace(/-/g, '').slice(0, 10) });
        randomDeck.push(card);
    }
    return randomDeck;
};
exports.randomDeckGen = randomDeckGen;
