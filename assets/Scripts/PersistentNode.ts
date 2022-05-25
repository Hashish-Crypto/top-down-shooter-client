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
  public audioContext: AudioContext | null = null

  onLoad() {
    game.addPersistRootNode(this.node)

    this.audioContext = new AudioContext()
    document.body.addEventListener('click', this._grabAudioOnClick)
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
    } catch (error) {
      console.log('Client can not join or create ' + roomName + ' room.', error)
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

  private _grabAudioOnClick = (event: MouseEvent) => {
    if ((this.audioContext && this.audioContext.state === 'suspended') || this.audioContext.state === 'closed') {
      this.audioContext.resume()
    } else {
      document.body.removeEventListener('click', this._grabAudioOnClick)
    }
  }
}
