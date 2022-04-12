import { type, Schema } from '@colyseus/schema'

export class Player extends Schema {
  @type('string') id: string
  @type('number') xPos: number
  @type('number') yPos: number
}
