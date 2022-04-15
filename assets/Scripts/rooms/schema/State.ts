import { Schema, MapSchema } from '@colyseus/schema'
import { Player } from './Player'

export interface State extends Schema {
  players: MapSchema<Player>
}
