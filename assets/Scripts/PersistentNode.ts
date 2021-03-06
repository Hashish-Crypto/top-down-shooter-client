import { _decorator, Component, game, director } from 'cc'
import Colyseus from 'db://colyseus-sdk/colyseus.js'
import { State } from './rooms/schema/State'

const { ccclass, property } = _decorator

@ccclass('PersistentNode')
export class PersistentNode extends Component {
  @property
  private serverURL: string = 'ws://localhost:2567'

  private _client: Colyseus.Client | null = null
  private _room: Colyseus.Room<State> | null = null

  onLoad() {
    game.addPersistRootNode(this.node)
  }

  private async _timeout(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms)
    })
  }

  async connect(roomName: string) {
    this._client = new Colyseus.Client(this.serverURL)

    try {
      this._room = await this._client.joinOrCreate(roomName)
    } catch (err) {
      console.log('Client can not join or create ' + roomName + ' room.', err)
    }

    await this._timeout(800)

    director.loadScene(roomName)
  }

  getRoom() {
    return this._room
  }

  getClient() {
    return this._client
  }
}
