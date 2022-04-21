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
  PhysicsSystem2D,
  EPhysics2DDrawFlags,
  Canvas,
  Camera,
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
  private gameUINode: Node | null = null

  @property({ type: Node })
  private playersRef: Node | null = null

  @property({ type: Prefab })
  private playerPrefab: Prefab | null = null

  private _gameState: string = 'LOBBY'
  private _client: Colyseus.Client | null = null
  private _room: Colyseus.Room<State> | null = null
  private _players: IPlayer[] = []
  private _moveCommands: string[] = []
  private _lastKeyDownMoveCommand: string
  private _joystick: Joystick | null = null
  private _joystickLoaded: boolean = false
  private _joystickLastMove: string = 'idleDown'
  private _gamepadLoaded: boolean = false
  private _gamepadLastMove: string | null = null
  private _debug: boolean = true

  onLoad() {
    if (this._debug) {
      PhysicsSystem2D.instance.debugDrawFlags =
        EPhysics2DDrawFlags.Aabb |
        EPhysics2DDrawFlags.Pair |
        EPhysics2DDrawFlags.CenterOfMass |
        EPhysics2DDrawFlags.Joint |
        EPhysics2DDrawFlags.Shape
    }

    this._client = new Colyseus.Client(this.serverURL)

    window.addEventListener('gamepadconnected', this.gamepadConnected)

    window.addEventListener('gamepaddisconnected', this.gamepadDisconnected)

    this.resetGame()
  }

  onEnable() {
    this.joinGameButton.on(Button.EventType.CLICK, this.joinGame, this)
  }

  update(deltaTime: number) {
    if (this._joystickLoaded) {
      if (this._joystick.move === 'idleUp' && this._joystickLastMove !== 'idleUp') {
        this._joystickLastMove = 'idleUp'
        this.idleUp()
      } else if (this._joystick.move === 'idleRight' && this._joystickLastMove !== 'idleRight') {
        this._joystickLastMove = 'idleRight'
        this.idleRight()
      } else if (this._joystick.move === 'idleDown' && this._joystickLastMove !== 'idleDown') {
        this._joystickLastMove = 'idleDown'
        this.idleDown()
      } else if (this._joystick.move === 'idleLeft' && this._joystickLastMove !== 'idleLeft') {
        this._joystickLastMove = 'idleLeft'
        this.idleLeft()
      } else if (this._joystick.move === 'moveUp' && this._joystickLastMove !== 'moveUp') {
        this._joystickLastMove = 'moveUp'
        this.moveUp()
      } else if (this._joystick.move === 'moveRight' && this._joystickLastMove !== 'moveRight') {
        this._joystickLastMove = 'moveRight'
        this.moveRight()
        console.log(deltaTime)
      } else if (this._joystick.move === 'moveDown' && this._joystickLastMove !== 'moveDown') {
        this._joystickLastMove = 'moveDown'
        this.moveDown()
      } else if (this._joystick.move === 'moveLeft' && this._joystickLastMove !== 'moveLeft') {
        this._joystickLastMove = 'moveLeft'
        this.moveLeft()
      }
    }

    if (this._gamepadLoaded) {
      const gamepad = navigator.getGamepads()[0]

      if (gamepad.buttons[12].pressed && this._gamepadLastMove !== 'moveUp') {
        this._gamepadLastMove = 'moveUp'
        this.moveUp()
      } else if (gamepad.buttons[15].pressed && this._gamepadLastMove !== 'moveRight') {
        this._gamepadLastMove = 'moveRight'
        this.moveRight()
      } else if (gamepad.buttons[13].pressed && this._gamepadLastMove !== 'moveDown') {
        this._gamepadLastMove = 'moveDown'
        this.moveDown()
      } else if (gamepad.buttons[14].pressed && this._gamepadLastMove !== 'moveLeft') {
        this._gamepadLastMove = 'moveLeft'
        this.moveLeft()
      } else if (!gamepad.buttons[12].pressed && this._gamepadLastMove === 'moveUp') {
        this._gamepadLastMove = null
        this.idleUp()
      } else if (!gamepad.buttons[15].pressed && this._gamepadLastMove === 'moveRight') {
        this._gamepadLastMove = null
        this.idleRight()
      } else if (!gamepad.buttons[13].pressed && this._gamepadLastMove === 'moveDown') {
        this._gamepadLastMove = null
        this.idleDown()
      } else if (!gamepad.buttons[14].pressed && this._gamepadLastMove === 'moveLeft') {
        this._gamepadLastMove = null
        this.idleLeft()
      }
    }
  }

  onDisable() {
    input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this)
    input.off(Input.EventType.KEY_UP, this.onKeyUp, this)
    window.removeEventListener('gamepadconnected', this.gamepadConnected)
    window.removeEventListener('gamepaddisconnected', this.gamepadDisconnected)
  }

  gamepadConnected = (event: GamepadEvent) => {
    this._gamepadLoaded = true
    console.log()
  }

  gamepadDisconnected = (event: GamepadEvent) => {
    if (event.gamepad.index === 0) {
      this._gamepadLoaded = false
    }
  }

  resetGame() {
    this._gameState = 'LOBBY'
    this.handleGameState()
  }

  handleGameState() {
    this.lobbyNode.active = this._gameState === 'LOBBY'
    this.gameNode.active = this._gameState === 'GAME'
    this.gameUINode.active = this._gameState === 'GAME'
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
        resources.load('Prefabs/Camera', Prefab, (err, prefab) => {
          const camera = instantiate(prefab)
          clientPlayer.node.addChild(camera)
          this.gameNode.getComponent(Canvas).cameraComponent = camera.getComponent(Camera)
        })
        this._joystick = this.gameUINode.getComponentInChildren(Joystick)
        this._joystickLoaded = true
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
        this.idleUp()
      }
    } else if (event.keyCode === KeyCode.KEY_D) {
      this._moveCommands = this.removeItem(this._moveCommands, 'd')
      if (this._moveCommands.length === 0) {
        this.idleRight()
      }
    } else if (event.keyCode === KeyCode.KEY_S) {
      this._moveCommands = this.removeItem(this._moveCommands, 's')
      if (this._moveCommands.length === 0) {
        this.idleDown()
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
        this.moveUp()
      } else if (this._moveCommands[this._moveCommands.length - 1] === 'd') {
        this.moveRight()
      } else if (this._moveCommands[this._moveCommands.length - 1] === 's') {
        this.moveDown()
      } else if (this._moveCommands[this._moveCommands.length - 1] === 'a') {
        this.moveLeft()
      }
    }
  }

  moveUp() {
    this._room.send('clientMovePlayer', { id: this._room.sessionId, move: 'moveUp' })
  }

  moveRight() {
    this._room.send('clientMovePlayer', { id: this._room.sessionId, move: 'moveRight' })
  }

  moveDown() {
    this._room.send('clientMovePlayer', { id: this._room.sessionId, move: 'moveDown' })
  }

  moveLeft() {
    this._room.send('clientMovePlayer', { id: this._room.sessionId, move: 'moveLeft' })
  }

  idleUp() {
    this._room.send('clientMovePlayer', { id: this._room.sessionId, move: 'idleUp' })
  }

  idleRight() {
    this._room.send('clientMovePlayer', { id: this._room.sessionId, move: 'idleRight' })
  }

  idleDown() {
    this._room.send('clientMovePlayer', { id: this._room.sessionId, move: 'idleDown' })
  }

  idleLeft() {
    this._room.send('clientMovePlayer', { id: this._room.sessionId, move: 'idleLeft' })
  }

  removeItem(arr: string[], value: string) {
    return arr.filter((element) => element !== value)
  }
}
