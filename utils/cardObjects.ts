

const red="#D32F2F";
const green = "#04db48";
const blue = "#0381FF";
const yellow = "#F8FF03";

interface Card{
    color: string,
    value: string,
    id: string,
}

const red1 : Card = {
    color: red,
    value: '1',
    id: ''
}
const red2 : Card = {
    color: red,
    value: '2',
    id: ''
}
const red3 : Card = {
    color: red,
    value: '3',
    id: ''
}
const red4 : Card = {
    color: red,
    value: '4',
    id: ''
}
const red5 : Card = {
    color: red,
    value: '5',
    id: ''
}
const red6 : Card = {
    color: red,
    value: '6',
    id: ''
}
const red7 : Card = {
    color: red,
    value: '7',
    id: ''
}
const red8 : Card = {
    color: red,
    value: '8',
    id: ''
}
const red9 : Card = {
    color: red,
    value: '9',
    id: ''
}
const redSkip : Card = {
    color: red,
    value: 'S',
    id: ''
}
const redReverse : Card = {
    color: red,
    value: 'R',
    id: ''
}
const redDraw2 : Card = {
    color: red,
    value: '+2',
    id: ''
}
const redWild : Card = {
    color: red,
    value: 'Wild',
    id: ''
}
const redWildDraw4 : Card = {
    color: red,
    value: '+4',
    id: ''
}

const blue1 : Card = {
    color: blue,
    value: '1',
    id: ''
}
const blue2 : Card = {
    color: blue,
    value: '2',
    id: ''
}
const blue3 : Card = {
    color: blue,
    value: '3',
    id: ''
}
const blue4 : Card = {
    color: blue,
    value: '4',
    id: ''
}
const blue5 : Card = {
    color: blue,
    value: '5',
    id: ''
}
const blue6 : Card = {
    color: blue,
    value: '6',
    id: ''
}
const blue7 : Card = {
    color: blue,
    value: '7',
    id: ''
}
const blue8 : Card = {
    color: blue,
    value: '8',
    id: ''
}
const blue9 : Card = {
    color: blue,
    value: '9',
    id: ''
}
const blueSkip : Card = {
    color: blue,
    value: 'S',
    id: ''
}
const blueReverse : Card = {
    color: blue,
    value: 'R',
    id: ''
}
const blueDraw2 : Card = {
    color: blue,
    value: '+2',
    id: ''
}
const blueWild : Card = {
    color: blue,
    value: 'Wild',
    id: ''
}
const blueWildDraw4 : Card = {
    color: blue,
    value: '+4',
    id: ''
}

const green1 : Card = {
    color: green,
    value: '1',
    id: ''
}
const green2 : Card = {
    color: green,
    value: '2',
    id: ''
}
const green3 : Card = {
    color: green,
    value: '3',
    id: ''
}
const green4 : Card = {
    color: green,
    value: '4',
    id: ''
}
const green5 : Card = {
    color: green,
    value: '5',
    id: ''
}
const green6 : Card = {
    color: green,
    value: '6',
    id: ''
}
const green7 : Card = {
    color: green,
    value: '7',
    id: ''
}   
const green8 : Card = {
    color: green,
    value: '8',
    id: ''
}
const green9 : Card = {
    color: green,
    value: '9',
    id: ''
}
const greenSkip : Card = {
    color: green,
    value: 'S',
    id: ''
}
const greenReverse : Card = {
    color: green,
    value: 'R',
    id: ''
}
const greenDraw2 : Card = {
    color: green,
    value: '+2',
    id: ''
}
const greenWild : Card = {
    color: green,
    value: 'Wild',
    id: ''
}
const greenWildDraw4 : Card = {
    color: green,
    value: '+4',
    id: ''
}

const yellow1 : Card = {
    color: yellow,
    value: '1',
    id: ''
}
const yellow2 : Card = {
    color: yellow,
    value: '2',
    id: ''
}
const yellow3 : Card = {
    color: yellow,
    value: '3',
    id: ''
}
const yellow4 : Card = {
    color: yellow,
    value: '4',
    id: ''
}
const yellow5 : Card = {
    color: yellow,
    value: '5',
    id: ''
}
const yellow6 : Card = {
    color: yellow,
    value: '6',
    id: ''
}
const yellow7 : Card = {
    color: yellow,
    value: '7',
    id: ''
}
const yellow8 : Card = {
    color: yellow,
    value: '8',
    id: ''
}
const yellow9 : Card = {
    color: yellow,
    value: '9',
    id: ''
}
const yellowSkip : Card = {
    color: yellow,
    value: 'S',
    id: ''
}
const yellowReverse : Card = {
    color: yellow,
    value: 'R',
    id: ''
}
const yellowDraw2 : Card = {
    color: yellow,
    value: '+2',
    id: ''
}
const yellowWild : Card = {
    color: yellow,
    value: 'Wild',
    id: ''
}
const yellowWildDraw4 : Card = {
    color: yellow,
    value: '+4',
    id: ''
}

const cardList = [red1, red2, red3, red4, red5, red6, red7, red8, red9, blue1, blue2, blue3, blue4, blue5, blue6, blue7, blue8, blue9, green1, green2, green3, green4, green5, green6, green7, green8, green9, yellow1, yellow2, yellow3, yellow4, yellow5, yellow6, yellow7, yellow8, yellow9, redDraw2, redSkip, redReverse, redWildDraw4, blueDraw2, blueSkip, blueReverse, blueWildDraw4, greenDraw2, greenSkip, greenReverse, greenWildDraw4, yellowDraw2, yellowSkip, yellowReverse, yellowWildDraw4]

export {cardList};
export {Card};