import {
  _decorator,
  Component,
  Node,
  input,
  Input,
  EventKeyboard,
  KeyCode,
  Prefab,
  instantiate,
  resources,
  Button,
  Widget,
} from 'cc'
import Colyseus from 'db://colyseus-sdk/colyseus.js'
import { Joystick } from './Joystick'
import { PlayerController } from './PlayerController'
import type { State } from './rooms/schema/State'

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
  private serverURL: string = 'ws://localhost:2567'

  @property({ type: Node })
  private lobbyNode: Node | null = null

  @property({ type: Node })
  private joinGameButton: Node | null = null

  @property({ type: Node })
  private loadingLabel: Node | null = null

  @property({ type: Node })
  private gameNode: Node | null = null

  @property({ type: Node })
  private playersRef: Node | null = null

  @property({ type: Prefab })
  public playerPrefab: Prefab | null = null

  // private _serverURL: string = 'localhost'
  private _gameState: string = 'LOBBY'
  private _client: Colyseus.Client | null = null
  private _room: Colyseus.Room<State> | null = null
  private _players: IPlayer[] = []
  private _moveCommands: string[] = []
  private _lastKeyDownMoveCommand: string
  private _joystick: Joystick | null = null
  private _joystickLoaded: boolean = false
  private _joystickLastMove: string = 'idleDown'

  onLoad() {
    this._client = new Colyseus.Client(this.serverURL)

    this.resetGame()
  }

  onEnable() {
    this.joinGameButton.on(Button.EventType.CLICK, this.joinGame, this)
  }

  update(deltaTime: number) {
    if (this._joystickLoaded) {
      if (this._joystick.move === 'idleUp' && this._joystickLastMove !== 'idleUp') {
        this._joystickLastMove = 'idleUp'
        this._room.send('clientMovePlayer', { id: this._room.sessionId, move: 'idleUp' })
      } else if (this._joystick.move === 'idleRight' && this._joystickLastMove !== 'idleRight') {
        this._joystickLastMove = 'idleRight'
        this._room.send('clientMovePlayer', { id: this._room.sessionId, move: 'idleRight' })
      } else if (this._joystick.move === 'idleDown' && this._joystickLastMove !== 'idleDown') {
        this._joystickLastMove = 'idleDown'
        this._room.send('clientMovePlayer', { id: this._room.sessionId, move: 'idleDown' })
      } else if (this._joystick.move === 'idleLeft' && this._joystickLastMove !== 'idleLeft') {
        this._joystickLastMove = 'idleLeft'
        this._room.send('clientMovePlayer', { id: this._room.sessionId, move: 'idleLeft' })
      } else if (this._joystick.move === 'moveUp' && this._joystickLastMove !== 'moveUp') {
        this._joystickLastMove = 'moveUp'
        this._room.send('clientMovePlayer', { id: this._room.sessionId, move: 'moveUp' })
      } else if (this._joystick.move === 'moveRight' && this._joystickLastMove !== 'moveRight') {
        this._joystickLastMove = 'moveRight'
        this._room.send('clientMovePlayer', { id: this._room.sessionId, move: 'moveRight' })
      } else if (this._joystick.move === 'moveDown' && this._joystickLastMove !== 'moveDown') {
        this._joystickLastMove = 'moveDown'
        this._room.send('clientMovePlayer', { id: this._room.sessionId, move: 'moveDown' })
      } else if (this._joystick.move === 'moveLeft' && this._joystickLastMove !== 'moveLeft') {
        this._joystickLastMove = 'moveLeft'
        this._room.send('clientMovePlayer', { id: this._room.sessionId, move: 'moveLeft' })
      }
    }
  }

  onDisable() {
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
    this.joinGameButton.getComponent(Button).interactable = false
    this.joinGameButton.off(Button.EventType.CLICK, this.joinGame, this)
    this.loadingLabel.active = true
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

    this._gameState = 'GAME'
    this.handleGameState()

    await this.timeout(900)

    this._room.state.players.forEach((serverPlayer) => {
      this._players.push({
        id: serverPlayer.id,
        node: instantiate(this.playerPrefab),
      })
      const clientPlayer = this._players.find((player) => player.id === serverPlayer.id)
      clientPlayer.node.position.set(serverPlayer.xPos, serverPlayer.yPos)
      if (clientPlayer.id === this._room.sessionId) {
        let camera: Node
        resources.load('Prefabs/Camera', Prefab, (err, prefab) => {
          camera = instantiate(prefab)
          clientPlayer.node.addChild(camera)
          camera.getComponent(Widget).target = this.gameNode
        })
        resources.load('Prefabs/Joystick', Prefab, (err, prefab) => {
          const joystickNode = instantiate(prefab)
          camera.addChild(joystickNode)
          this._joystick = joystickNode.getComponent(Joystick)
          this._joystickLoaded = true
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
      clientPlayer.node.position.set(serverPlayer.xPos, serverPlayer.yPos)
      clientPlayer.playerController = clientPlayer.node.getComponent(PlayerController)
      this.playersRef.addChild(clientPlayer.node)
    }

    this._room.onMessage('serverRequestPlayerPosition', () => {
      const clientPlayer = this._players.find((player) => player.id === this._room.sessionId)
      const xPos = clientPlayer.node.position.x
      const yPos = clientPlayer.node.position.y
      this._room.send('clientDeliverPlayerPosition', { xPos, yPos })
    })

    this._room.onMessage('playerLeaveRoom', (message) => {
      const clientPlayer = this._players.find((player) => player.id === message.id)
      clientPlayer.node.destroy()
      this._players = this._players.filter((player) => player.id !== message.id)
    })

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
