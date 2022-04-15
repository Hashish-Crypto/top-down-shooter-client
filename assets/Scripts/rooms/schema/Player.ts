import { Schema } from '@colyseus/schema'

export interface Player extends Schema {
  id: string
  xPos: number
  yPos: number
}
