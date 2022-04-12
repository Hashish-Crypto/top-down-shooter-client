import { _decorator, Component, Node, input, Input, EventKeyboard, KeyCode, Prefab, instantiate } from 'cc'
import Colyseus from 'db://colyseus-sdk/colyseus.js'
import { PlayerController } from './PlayerController'
import { State } from './rooms/schema/State'

const { ccclass, property } = _decorator

/**
 * Predefined variables
 * Name = SceneManager
 * DateTime = Sat Apr 02 2022 09:26:55 GMT-0300 (Brasilia Standard Time)
 * Author = acquati
 * FileBasename = SceneManager.ts
 * FileBasenameNoExtension = SceneManager
 * URL = db://assets/Scripts/SceneManager.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SceneManager')
export class SceneManager extends Component {
  @property
  private serverURL: string = 'localhost'

  @property
  private port: string = '2567'

  @property({ type: Node })
  private lobbyNode: Node | null = null

  @property({ type: Node })
  private joinGameButton: Node | null = null

  @property({ type: Node })
  private gameNode: Node | null = null

  @property({ type: Node })
  private playersRef: Node | null = null

  @property({ type: Prefab })
  public playerPrefab: Prefab | null = null

  private _gameState: string = 'LOBBY'
  private _client: Colyseus.Client | null = null
  private _room: Colyseus.Room<State> | null = null
  private _players: Node[] = [null]
  private _playerController: PlayerController | null = null
  private _moveCommands: string[] = []
  private _lastKeyDownMoveCommand: string

  onLoad() {
    const endpoint: string = `ws://${this.serverURL}:${this.port}`
    this._client = new Colyseus.Client(endpoint)

    this.resetGame()
  }

  onEnable() {
    this.joinGameButton.on(Input.EventType.MOUSE_DOWN, this.joinGame, this)
  }

  update(deltaTime: number) {}

  onDisable() {
    this.joinGameButton.off(Input.EventType.MOUSE_DOWN, this.joinGame, this)
    input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this)
    input.off(Input.EventType.KEY_UP, this.onKeyUp, this)
  }

  resetGame() {
    this._gameState = 'LOBBY'
    this.handleGameState()
  }

  handleGameState() {
    this.lobbyNode.active = this._gameState === 'LOBBY'
    this.gameNode.active = this._gameState === 'GAME'
  }

  joinGame() {
    this._gameState = 'GAME'
    this.handleGameState()
    this.connect()
    input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this)
    input.on(Input.EventType.KEY_UP, this.onKeyUp, this)
  }

  async connect() {
    try {
      this._room = await this._client.joinOrCreate('moonBase')
    } catch (err) {
      console.log('Client can not join or create moonBase room.', err)
    }

    setTimeout(() => {
      this._room.state.players.forEach((value: any, key: any) => {
        console.log('key =>', key)
        console.log('value =>', value)
      })
      console.log(this._room.sessionId)
      console.log(this._room.state.players.get(this._room.sessionId).xPos)
      console.log(this._room.state.players.toJSON())
    }, 10)

    for (let i = 0; i < this._players.length; i++) {
      this._players[i] = instantiate(this.playerPrefab)
      this.playersRef.addChild(this._players[i])
      this._playerController = this._players[i].getComponent(PlayerController)
    }

    this._room.onMessage('serverMovePlayer', (message) => {
      if (message === 'moveUp') {
        this._playerController.moveUp()
      } else if (message === 'moveRight') {
        this._playerController.moveRight()
      } else if (message === 'moveDown') {
        this._playerController.moveDown()
      } else if (message === 'moveLeft') {
        this._playerController.moveLeft()
      } else if (message === 'idleUp') {
        this._playerController.idleUp()
      } else if (message === 'idleRight') {
        this._playerController.idleRight()
      } else if (message === 'idleDown') {
        this._playerController.idleDown()
      } else if (message === 'idleLeft') {
        this._playerController.idleLeft()
      }
    })
  }

  onKeyDown(event: EventKeyboard) {
    if (event.keyCode === KeyCode.KEY_W && !this._moveCommands.includes('w')) {
      this._lastKeyDownMoveCommand = 'w'
      this._moveCommands.push('w')
      this.movePlayer()
    } else if (event.keyCode === KeyCode.KEY_D && !this._moveCommands.includes('d')) {
      this._lastKeyDownMoveCommand = 'd'
      this._moveCommands.push('d')
      this.movePlayer()
    } else if (event.keyCode === KeyCode.KEY_S && !this._moveCommands.includes('s')) {
      this._lastKeyDownMoveCommand = 's'
      this._moveCommands.push('s')
      this.movePlayer()
    } else if (event.keyCode === KeyCode.KEY_A && !this._moveCommands.includes('a')) {
      this._lastKeyDownMoveCommand = 'a'
      this._moveCommands.push('a')
      this.movePlayer()
    }
  }

  onKeyUp(event: EventKeyboard) {
    if (event.keyCode === KeyCode.KEY_W) {
      this._moveCommands = this.removeItem(this._moveCommands, 'w')
      if (this._moveCommands.length === 0) {
        this._room.send('clientMovePlayer', 'idleUp')
      }
    } else if (event.keyCode === KeyCode.KEY_D) {
      this._moveCommands = this.removeItem(this._moveCommands, 'd')
      if (this._moveCommands.length === 0) {
        this._room.send('clientMovePlayer', 'idleRight')
      }
    } else if (event.keyCode === KeyCode.KEY_S) {
      this._moveCommands = this.removeItem(this._moveCommands, 's')
      if (this._moveCommands.length === 0) {
        this._room.send('clientMovePlayer', 'idleDown')
      }
    } else if (event.keyCode === KeyCode.KEY_A) {
      this._moveCommands = this.removeItem(this._moveCommands, 'a')
      if (this._moveCommands.length === 0) {
        this._room.send('clientMovePlayer', 'idleLeft')
      }
    }

    if (this._lastKeyDownMoveCommand !== this._moveCommands[this._moveCommands.length - 1]) {
      this.movePlayer()
    }
  }

  movePlayer() {
    if (this._moveCommands.length >= 1) {
      if (this._moveCommands[this._moveCommands.length - 1] === 'w') {
        this._room.send('clientMovePlayer', 'moveUp')
      } else if (this._moveCommands[this._moveCommands.length - 1] === 'd') {
        this._room.send('clientMovePlayer', 'moveRight')
      } else if (this._moveCommands[this._moveCommands.length - 1] === 's') {
        this._room.send('clientMovePlayer', 'moveDown')
      } else if (this._moveCommands[this._moveCommands.length - 1] === 'a') {
        this._room.send('clientMovePlayer', 'moveLeft')
      }
    }
  }

  removeItem(arr: string[], value: string) {
    return arr.filter((element) => element !== value)
  }
}
