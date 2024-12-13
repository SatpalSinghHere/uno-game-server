

const red="#D32F2F";
const green = "#04db48";
const blue = "#0381FF";
const yellow = "#F8FF03";

interface Card{
    color: string,
    value: string
}

const red1 : Card = {
    color: red,
    value: '1'
}
const red2 : Card = {
    color: red,
    value: '2'
}
const red3 : Card = {
    color: red,
    value: '3'
}
const red4 : Card = {
    color: red,
    value: '4'
}
const red5 : Card = {
    color: red,
    value: '5'
}
const red6 : Card = {
    color: red,
    value: '6'
}
const red7 : Card = {
    color: red,
    value: '7'
}
const red8 : Card = {
    color: red,
    value: '8'
}
const red9 : Card = {
    color: red,
    value: '9'
}
const redSkip : Card = {
    color: red,
    value: 'S'
}
const redReverse : Card = {
    color: red,
    value: 'R'
}
const redDraw2 : Card = {
    color: red,
    value: '+2'
}
const redWild : Card = {
    color: red,
    value: 'Wild'
}
const redWildDraw4 : Card = {
    color: red,
    value: '+4'
}

const blue1 : Card = {
    color: blue,
    value: '1'
}
const blue2 : Card = {
    color: blue,
    value: '2'
}
const blue3 : Card = {
    color: blue,
    value: '3'
}
const blue4 : Card = {
    color: blue,
    value: '4'
}
const blue5 : Card = {
    color: blue,
    value: '5'
}
const blue6 : Card = {
    color: blue,
    value: '6'
}
const blue7 : Card = {
    color: blue,
    value: '7'
}
const blue8 : Card = {
    color: blue,
    value: '8'
}
const blue9 : Card = {
    color: blue,
    value: '9'
}
const blueSkip : Card = {
    color: blue,
    value: 'S'
}
const blueReverse : Card = {
    color: blue,
    value: 'R'
}
const blueDraw2 : Card = {
    color: blue,
    value: '+2'
}
const blueWild : Card = {
    color: blue,
    value: 'Wild'
}
const blueWildDraw4 : Card = {
    color: blue,
    value: '+4'
}

const green1 : Card = {
    color: green,
    value: '1'
}
const green2 : Card = {
    color: green,
    value: '2'
}
const green3 : Card = {
    color: green,
    value: '3'
}
const green4 : Card = {
    color: green,
    value: '4'
}
const green5 : Card = {
    color: green,
    value: '5'
}
const green6 : Card = {
    color: green,
    value: '6'
}
const green7 : Card = {
    color: green,
    value: '7'
}   
const green8 : Card = {
    color: green,
    value: '8'
}
const green9 : Card = {
    color: green,
    value: '9'
}
const greenSkip : Card = {
    color: green,
    value: 'S'
}
const greenReverse : Card = {
    color: green,
    value: 'R'
}
const greenDraw2 : Card = {
    color: green,
    value: '+2'
}
const greenWild : Card = {
    color: green,
    value: 'Wild'
}
const greenWildDraw4 : Card = {
    color: green,
    value: '+4'
}

const yellow1 : Card = {
    color: yellow,
    value: '1'
}
const yellow2 : Card = {
    color: yellow,
    value: '2'
}
const yellow3 : Card = {
    color: yellow,
    value: '3'
}
const yellow4 : Card = {
    color: yellow,
    value: '4'
}
const yellow5 : Card = {
    color: yellow,
    value: '5'
}
const yellow6 : Card = {
    color: yellow,
    value: '6'
}
const yellow7 : Card = {
    color: yellow,
    value: '7'
}
const yellow8 : Card = {
    color: yellow,
    value: '8'
}
const yellow9 : Card = {
    color: yellow,
    value: '9'
}
const yellowSkip : Card = {
    color: yellow,
    value: 'S'
}
const yellowReverse : Card = {
    color: yellow,
    value: 'R'
}
const yellowDraw2 : Card = {
    color: yellow,
    value: '+2'
}
const yellowWild : Card = {
    color: yellow,
    value: 'Wild'
}
const yellowWildDraw4 : Card = {
    color: yellow,
    value: '+4'
}

const cardList = [red1, red2, red3, red4, red5, red6, red7, red8, red9, blue1, blue2, blue3, blue4, blue5, blue6, blue7, blue8, blue9, green1, green2, green3, green4, green5, green6, green7, green8, green9, yellow1, yellow2, yellow3, yellow4, yellow5, yellow6, yellow7, yellow8, yellow9, redDraw2, redSkip, redReverse, redWildDraw4, blueDraw2, blueSkip, blueReverse, blueWildDraw4, greenDraw2, greenSkip, greenReverse, greenWildDraw4, yellowDraw2, yellowSkip, yellowReverse, yellowWildDraw4]

export {cardList};
export {Card};