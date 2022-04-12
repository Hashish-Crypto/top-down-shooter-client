import { Player, Schema, MapSchema } from './Internal'

export interface State extends Schema {
  players: MapSchema<Player>
}
