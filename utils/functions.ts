import { cardList } from "./cardObjects"

export const randomDeckGen = (length: number) => {
    const randomDeck = []
    for (let i = 0; i < length; i++) {
      const index = Math.floor(Math.random() * cardList.length)
      let card = {...cardList[index], id: crypto.randomUUID().replace(/-/g, '').slice(0, 10)}
      randomDeck.push(card)
    }
    return randomDeck
  }