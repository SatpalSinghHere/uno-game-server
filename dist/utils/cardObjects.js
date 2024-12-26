"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cardList = void 0;
const red = "#D32F2F";
const green = "#04db48";
const blue = "#0381FF";
const yellow = "#F8FF03";
const red1 = {
    color: red,
    value: '1',
    id: '',
    flipped: false
};
const red2 = {
    color: red,
    value: '2',
    id: '',
    flipped: false
};
const red3 = {
    color: red,
    value: '3',
    id: '',
    flipped: false
};
const red4 = {
    color: red,
    value: '4',
    id: '',
    flipped: false
};
const red5 = {
    color: red,
    value: '5',
    id: '',
    flipped: false
};
const red6 = {
    color: red,
    value: '6',
    id: '',
    flipped: false
};
const red7 = {
    color: red,
    value: '7',
    id: '',
    flipped: false
};
const red8 = {
    color: red,
    value: '8',
    id: '',
    flipped: false
};
const red9 = {
    color: red,
    value: '9',
    id: '',
    flipped: false
};
const redSkip = {
    color: red,
    value: 'S',
    id: '',
    flipped: false
};
const redReverse = {
    color: red,
    value: 'R',
    id: '',
    flipped: false
};
const redDraw2 = {
    color: red,
    value: '+2',
    id: '',
    flipped: false
};
const redWild = {
    color: red,
    value: 'Wild',
    id: '',
    flipped: false
};
const redWildDraw4 = {
    color: red,
    value: '+4',
    id: '',
    flipped: false
};
const blue1 = {
    color: blue,
    value: '1',
    id: '',
    flipped: false
};
const blue2 = {
    color: blue,
    value: '2',
    id: '',
    flipped: false
};
const blue3 = {
    color: blue,
    value: '3',
    id: '',
    flipped: false
};
const blue4 = {
    color: blue,
    value: '4',
    id: '',
    flipped: false
};
const blue5 = {
    color: blue,
    value: '5',
    id: '',
    flipped: false
};
const blue6 = {
    color: blue,
    value: '6',
    id: '',
    flipped: false
};
const blue7 = {
    color: blue,
    value: '7',
    id: '',
    flipped: false
};
const blue8 = {
    color: blue,
    value: '8',
    id: '',
    flipped: false
};
const blue9 = {
    color: blue,
    value: '9',
    id: '',
    flipped: false
};
const blueSkip = {
    color: blue,
    value: 'S',
    id: '',
    flipped: false
};
const blueReverse = {
    color: blue,
    value: 'R',
    id: '',
    flipped: false
};
const blueDraw2 = {
    color: blue,
    value: '+2',
    id: '',
    flipped: false
};
const blueWild = {
    color: blue,
    value: 'Wild',
    id: '',
    flipped: false
};
const blueWildDraw4 = {
    color: blue,
    value: '+4',
    id: '',
    flipped: false
};
const green1 = {
    color: green,
    value: '1',
    id: '',
    flipped: false
};
const green2 = {
    color: green,
    value: '2',
    id: '',
    flipped: false
};
const green3 = {
    color: green,
    value: '3',
    id: '',
    flipped: false
};
const green4 = {
    color: green,
    value: '4',
    id: '',
    flipped: false
};
const green5 = {
    color: green,
    value: '5',
    id: '',
    flipped: false
};
const green6 = {
    color: green,
    value: '6',
    id: '',
    flipped: false
};
const green7 = {
    color: green,
    value: '7',
    id: '',
    flipped: false
};
const green8 = {
    color: green,
    value: '8',
    id: '',
    flipped: false
};
const green9 = {
    color: green,
    value: '9',
    id: '',
    flipped: false
};
const greenSkip = {
    color: green,
    value: 'S',
    id: '',
    flipped: false
};
const greenReverse = {
    color: green,
    value: 'R',
    id: '',
    flipped: false
};
const greenDraw2 = {
    color: green,
    value: '+2',
    id: '',
    flipped: false
};
const greenWild = {
    color: green,
    value: 'Wild',
    id: '',
    flipped: false
};
const greenWildDraw4 = {
    color: green,
    value: '+4',
    id: '',
    flipped: false
};
const yellow1 = {
    color: yellow,
    value: '1',
    id: '',
    flipped: false
};
const yellow2 = {
    color: yellow,
    value: '2',
    id: '',
    flipped: false
};
const yellow3 = {
    color: yellow,
    value: '3',
    id: '',
    flipped: false
};
const yellow4 = {
    color: yellow,
    value: '4',
    id: '',
    flipped: false
};
const yellow5 = {
    color: yellow,
    value: '5',
    id: '',
    flipped: false
};
const yellow6 = {
    color: yellow,
    value: '6',
    id: '',
    flipped: false
};
const yellow7 = {
    color: yellow,
    value: '7',
    id: '',
    flipped: false
};
const yellow8 = {
    color: yellow,
    value: '8',
    id: '',
    flipped: false
};
const yellow9 = {
    color: yellow,
    value: '9',
    id: '',
    flipped: false
};
const yellowSkip = {
    color: yellow,
    value: 'S',
    id: '',
    flipped: false
};
const yellowReverse = {
    color: yellow,
    value: 'R',
    id: '',
    flipped: false
};
const yellowDraw2 = {
    color: yellow,
    value: '+2',
    id: '',
    flipped: false
};
const yellowWild = {
    color: yellow,
    value: 'Wild',
    id: '',
    flipped: false
};
const yellowWildDraw4 = {
    color: yellow,
    value: '+4',
    id: '',
    flipped: false
};
const cardList = [red1, red2, red3, red4, red5, red6, red7, red8, red9, blue1, blue2, blue3, blue4, blue5, blue6, blue7, blue8, blue9, green1, green2, green3, green4, green5, green6, green7, green8, green9, yellow1, yellow2, yellow3, yellow4, yellow5, yellow6, yellow7, yellow8, yellow9, redDraw2, redSkip, redReverse, redWildDraw4, blueDraw2, blueSkip, blueReverse, blueWildDraw4, greenDraw2, greenSkip, greenReverse, greenWildDraw4, yellowDraw2, yellowSkip, yellowReverse, yellowWildDraw4];
exports.cardList = cardList;
