import { _decorator, Component, Node, input, Input, EventKeyboard, KeyCode, Prefab, instantiate, resources } from 'cc'
import Colyseus from 'db://colyseus-sdk/colyseus.js'
import { PlayerController } from './PlayerController'
import type { State } from './rooms/schema/Internal'

const { ccclass, property } = _decorator

interface IPlayer {
  id: string
  node: Node
  playerController?: PlayerController
}

interface IMovement {
  id: string
  move: string
}

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
  private _players: IPlayer[] = []
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

  async timeout(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms)
    })
  }

  async connect() {
    try {
      this._room = await this._client.joinOrCreate('moonBase')
    } catch (err) {
      console.log('Client can not join or create moonBase room.', err)
    }

    await this.timeout(10)

    this._room.state.players.forEach((serverPlayer) => {
      this._players.push({
        id: serverPlayer.id,
        node: instantiate(this.playerPrefab),
      })
      const clientPlayer = this._players.find((player) => player.id === serverPlayer.id)
      if (clientPlayer.id === this._room.sessionId) {
        resources.load('Prefabs/Camera', Prefab, (err, prefab) => {
          const camera = instantiate(prefab)
          clientPlayer.node.addChild(camera)
        })
      }
      clientPlayer.playerController = clientPlayer.node.getComponent(PlayerController)
      this.playersRef.addChild(clientPlayer.node)
    })

    this._room.state.players.onAdd = (serverPlayer) => {
      this._players.push({
        id: serverPlayer.id,
        node: instantiate(this.playerPrefab),
      })
      const clientPlayer = this._players.find((player) => player.id === serverPlayer.id)
      clientPlayer.playerController = clientPlayer.node.getComponent(PlayerController)
      this.playersRef.addChild(clientPlayer.node)
    }

    this._room.onMessage<IMovement>('serverMovePlayer', (message) => {
      const clientPlayer = this._players.find((player) => player.id === message.id)

      if (message.move === 'moveUp') {
        clientPlayer.playerController.moveUp()
      } else if (message.move === 'moveRight') {
        clientPlayer.playerController.moveRight()
      } else if (message.move === 'moveDown') {
        clientPlayer.playerController.moveDown()
      } else if (message.move === 'moveLeft') {
        clientPlayer.playerController.moveLeft()
      } else if (message.move === 'idleUp') {
        clientPlayer.playerController.idleUp()
      } else if (message.move === 'idleRight') {
        clientPlayer.playerController.idleRight()
      } else if (message.move === 'idleDown') {
        clientPlayer.playerController.idleDown()
      } else if (message.move === 'idleLeft') {
        clientPlayer.playerController.idleLeft()
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
        this._room.send('clientMovePlayer', { id: this._room.sessionId, move: 'idleUp' })
      }
    } else if (event.keyCode === KeyCode.KEY_D) {
      this._moveCommands = this.removeItem(this._moveCommands, 'd')
      if (this._moveCommands.length === 0) {
        this._room.send('clientMovePlayer', { id: this._room.sessionId, move: 'idleRight' })
      }
    } else if (event.keyCode === KeyCode.KEY_S) {
      this._moveCommands = this.removeItem(this._moveCommands, 's')
      if (this._moveCommands.length === 0) {
        this._room.send('clientMovePlayer', { id: this._room.sessionId, move: 'idleDown' })
      }
    } else if (event.keyCode === KeyCode.KEY_A) {
      this._moveCommands = this.removeItem(this._moveCommands, 'a')
      if (this._moveCommands.length === 0) {
        this._room.send('clientMovePlayer', { id: this._room.sessionId, move: 'idleLeft' })
      }
    }

    if (this._lastKeyDownMoveCommand !== this._moveCommands[this._moveCommands.length - 1]) {
      this.movePlayer()
    }
  }

  movePlayer() {
    if (this._moveCommands.length >= 1) {
      if (this._moveCommands[this._moveCommands.length - 1] === 'w') {
        this._room.send('clientMovePlayer', { id: this._room.sessionId, move: 'moveUp' })
      } else if (this._moveCommands[this._moveCommands.length - 1] === 'd') {
        this._room.send('clientMovePlayer', { id: this._room.sessionId, move: 'moveRight' })
      } else if (this._moveCommands[this._moveCommands.length - 1] === 's') {
        this._room.send('clientMovePlayer', { id: this._room.sessionId, move: 'moveDown' })
      } else if (this._moveCommands[this._moveCommands.length - 1] === 'a') {
        this._room.send('clientMovePlayer', { id: this._room.sessionId, move: 'moveLeft' })
      }
    }
  }

  removeItem(arr: string[], value: string) {
    return arr.filter((element) => element !== value)
  }
}
