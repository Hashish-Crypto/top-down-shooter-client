import {
  _decorator,
  Component,
  Node,
  Prefab,
  PhysicsSystem2D,
  EPhysics2DDrawFlags,
  input,
  Input,
  find,
  instantiate,
  resources,
  Canvas,
  Camera,
  EventKeyboard,
  KeyCode,
  Contact2DType,
  Collider2D,
} from 'cc'
import Colyseus from 'db://colyseus-sdk/colyseus.js'
import { State } from './rooms/schema/State'
import { PersistentNode } from './PersistentNode'
import { Joystick } from './Joystick'
import { PlayerController } from './PlayerController'

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
 * Name = BarSceneManager
 * DateTime = Sat Apr 30 2022 11:18:32 GMT-0300 (Brasilia Standard Time)
 * Author = acquati
 * FileBasename = BarSceneManager.ts
 * FileBasenameNoExtension = BarSceneManager
 * URL = db://assets/Scripts/BarSceneManager.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('BarSceneManager')
export class BarSceneManager extends Component {
  @property({ type: Node })
  private gameNode: Node | null = null

  @property({ type: Node })
  private gameUINode: Node | null = null

  @property({ type: Node })
  private playersRef: Node | null = null

  @property({ type: Prefab })
  private playerPrefab: Prefab | null = null

  private _persistentNode: PersistentNode | null = null
  private _room: Colyseus.Room<State> | null = null
  private _players: IPlayer[] = []
  private _currentPlayerUUID: string | null = null
  private _playerControllerActive: boolean = true
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

    this._persistentNode = find('PersistRootNode').getComponent(PersistentNode)
    this._room = this._persistentNode.getRoom()

    input.on(Input.EventType.KEY_DOWN, this._onKeyDown, this)
    input.on(Input.EventType.KEY_UP, this._onKeyUp, this)
    window.addEventListener('gamepadconnected', this._gamepadConnected)
    window.addEventListener('gamepaddisconnected', this._gamepadDisconnected)

    PhysicsSystem2D.instance.on(Contact2DType.BEGIN_CONTACT, this._onBeginContact, this)

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
        this._currentPlayerUUID = clientPlayer.node.uuid
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

  update(deltaTime: number) {
    if (this._joystickLoaded && this._playerControllerActive) {
      if (this._joystick.move === 'idleUp' && this._joystickLastMove !== 'idleUp') {
        this._joystickLastMove = 'idleUp'
        this._idleUp()
      } else if (this._joystick.move === 'idleRight' && this._joystickLastMove !== 'idleRight') {
        this._joystickLastMove = 'idleRight'
        this._idleRight()
      } else if (this._joystick.move === 'idleDown' && this._joystickLastMove !== 'idleDown') {
        this._joystickLastMove = 'idleDown'
        this._idleDown()
      } else if (this._joystick.move === 'idleLeft' && this._joystickLastMove !== 'idleLeft') {
        this._joystickLastMove = 'idleLeft'
        this._idleLeft()
      } else if (this._joystick.move === 'moveUp' && this._joystickLastMove !== 'moveUp') {
        this._joystickLastMove = 'moveUp'
        this._moveUp()
      } else if (this._joystick.move === 'moveRight' && this._joystickLastMove !== 'moveRight') {
        this._joystickLastMove = 'moveRight'
        this._moveRight()
      } else if (this._joystick.move === 'moveDown' && this._joystickLastMove !== 'moveDown') {
        this._joystickLastMove = 'moveDown'
        this._moveDown()
      } else if (this._joystick.move === 'moveLeft' && this._joystickLastMove !== 'moveLeft') {
        this._joystickLastMove = 'moveLeft'
        this._moveLeft()
      }
    }

    if (this._gamepadLoaded && this._playerControllerActive) {
      const gamepad = navigator.getGamepads()[0]

      if (gamepad.buttons[12].pressed && this._gamepadLastMove !== 'moveUp') {
        this._gamepadLastMove = 'moveUp'
        this._moveUp()
      } else if (gamepad.buttons[15].pressed && this._gamepadLastMove !== 'moveRight') {
        this._gamepadLastMove = 'moveRight'
        this._moveRight()
      } else if (gamepad.buttons[13].pressed && this._gamepadLastMove !== 'moveDown') {
        this._gamepadLastMove = 'moveDown'
        this._moveDown()
      } else if (gamepad.buttons[14].pressed && this._gamepadLastMove !== 'moveLeft') {
        this._gamepadLastMove = 'moveLeft'
        this._moveLeft()
      } else if (!gamepad.buttons[12].pressed && this._gamepadLastMove === 'moveUp') {
        this._gamepadLastMove = null
        this._idleUp()
      } else if (!gamepad.buttons[15].pressed && this._gamepadLastMove === 'moveRight') {
        this._gamepadLastMove = null
        this._idleRight()
      } else if (!gamepad.buttons[13].pressed && this._gamepadLastMove === 'moveDown') {
        this._gamepadLastMove = null
        this._idleDown()
      } else if (!gamepad.buttons[14].pressed && this._gamepadLastMove === 'moveLeft') {
        this._gamepadLastMove = null
        this._idleLeft()
      }
    }
  }

  onDisable() {
    input.off(Input.EventType.KEY_DOWN, this._onKeyDown, this)
    input.off(Input.EventType.KEY_UP, this._onKeyUp, this)
    window.removeEventListener('gamepadconnected', this._gamepadConnected)
    window.removeEventListener('gamepaddisconnected', this._gamepadDisconnected)
  }

  private _gamepadConnected = (event: GamepadEvent) => {
    this._gamepadLoaded = true
  }

  private _gamepadDisconnected = (event: GamepadEvent) => {
    if (event.gamepad.index === 0) {
      this._gamepadLoaded = false
    }
  }

  private _onKeyDown(event: EventKeyboard) {
    if (this._playerControllerActive) {
      if (event.keyCode === KeyCode.KEY_W && !this._moveCommands.includes('w')) {
        this._lastKeyDownMoveCommand = 'w'
        this._moveCommands.push('w')
        this._movePlayer()
      } else if (event.keyCode === KeyCode.KEY_D && !this._moveCommands.includes('d')) {
        this._lastKeyDownMoveCommand = 'd'
        this._moveCommands.push('d')
        this._movePlayer()
      } else if (event.keyCode === KeyCode.KEY_S && !this._moveCommands.includes('s')) {
        this._lastKeyDownMoveCommand = 's'
        this._moveCommands.push('s')
        this._movePlayer()
      } else if (event.keyCode === KeyCode.KEY_A && !this._moveCommands.includes('a')) {
        this._lastKeyDownMoveCommand = 'a'
        this._moveCommands.push('a')
        this._movePlayer()
      }
    }
  }

  private _onKeyUp(event: EventKeyboard) {
    if (this._playerControllerActive) {
      if (event.keyCode === KeyCode.KEY_W) {
        this._moveCommands = this._removeItem(this._moveCommands, 'w')
        if (this._moveCommands.length === 0) {
          this._idleUp()
        }
      } else if (event.keyCode === KeyCode.KEY_D) {
        this._moveCommands = this._removeItem(this._moveCommands, 'd')
        if (this._moveCommands.length === 0) {
          this._idleRight()
        }
      } else if (event.keyCode === KeyCode.KEY_S) {
        this._moveCommands = this._removeItem(this._moveCommands, 's')
        if (this._moveCommands.length === 0) {
          this._idleDown()
        }
      } else if (event.keyCode === KeyCode.KEY_A) {
        this._moveCommands = this._removeItem(this._moveCommands, 'a')
        if (this._moveCommands.length === 0) {
          this._room.send('clientMovePlayer', { id: this._room.sessionId, move: 'idleLeft' })
        }
      }

      if (this._lastKeyDownMoveCommand !== this._moveCommands[this._moveCommands.length - 1]) {
        this._movePlayer()
      }
    }
  }

  private _onBeginContact(a: Collider2D, b: Collider2D) {
    if (b.node.uuid === this._currentPlayerUUID) {
      if (a.node.name === 'BarDoor') {
        this._playerControllerActive = false
        this._idleDown()
        console.log('MoonBase')
        this._room.send('clientRemovePlayer')
        this._persistentNode.connect('moonBase')
      }
    }
  }

  private _movePlayer() {
    if (this._moveCommands.length >= 1) {
      if (this._moveCommands[this._moveCommands.length - 1] === 'w') {
        this._moveUp()
      } else if (this._moveCommands[this._moveCommands.length - 1] === 'd') {
        this._moveRight()
      } else if (this._moveCommands[this._moveCommands.length - 1] === 's') {
        this._moveDown()
      } else if (this._moveCommands[this._moveCommands.length - 1] === 'a') {
        this._moveLeft()
      }
    }
  }

  private _moveUp() {
    this._room.send('clientMovePlayer', { id: this._room.sessionId, move: 'moveUp' })
  }

  private _moveRight() {
    this._room.send('clientMovePlayer', { id: this._room.sessionId, move: 'moveRight' })
  }

  private _moveDown() {
    this._room.send('clientMovePlayer', { id: this._room.sessionId, move: 'moveDown' })
  }

  private _moveLeft() {
    this._room.send('clientMovePlayer', { id: this._room.sessionId, move: 'moveLeft' })
  }

  private _idleUp() {
    this._room.send('clientMovePlayer', { id: this._room.sessionId, move: 'idleUp' })
  }

  private _idleRight() {
    this._room.send('clientMovePlayer', { id: this._room.sessionId, move: 'idleRight' })
  }

  private _idleDown() {
    this._room.send('clientMovePlayer', { id: this._room.sessionId, move: 'idleDown' })
  }

  private _idleLeft() {
    this._room.send('clientMovePlayer', { id: this._room.sessionId, move: 'idleLeft' })
  }

  private _removeItem(arr: string[], value: string) {
    return arr.filter((element) => element !== value)
  }
}
