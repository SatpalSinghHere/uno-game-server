import { cardList } from "./cardObjects"

export const randomDeckGen = (length: number) => {
    const randomDeck = []
    for (let i = 0; i < length; i++) {
      const index = Math.floor(Math.random() * cardList.length)
      randomDeck.push(cardList[index])
    }
    return randomDeck
  }