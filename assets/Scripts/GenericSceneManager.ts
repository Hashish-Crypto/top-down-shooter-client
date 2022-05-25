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
import { Peer, DataConnection } from 'peerjs'
import { State } from './rooms/schema/State'
import { PersistentNode } from './PersistentNode'
import { Joystick } from './Joystick'
import { PlayerController } from './PlayerController'
import createAudioMeter from './lib/createAudioMeter'

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

@ccclass('GenericSceneManager')
export class GenericSceneManager extends Component {
  @property({ type: Node })
  private gameNode: Node | null = null

  @property({ type: Node })
  private gameUINode: Node | null = null

  @property({ type: Node })
  private playersRef: Node | null = null

  @property({ type: Prefab })
  private playerPrefab: Prefab | null = null

  protected _persistentNode: PersistentNode | null = null
  protected _room: Colyseus.Room<State> | null = null
  private _players: IPlayer[] = []
  protected _playerControllerEnabled: boolean = true
  protected _currentPlayerUUID: string | null = null
  private _moveCommands: string[] = []
  private _lastKeyDownMoveCommand: string
  private _joystick: Joystick | null = null
  private _joystickEnabled: boolean = false
  private _joystickLastMove: string = 'idleDown'
  private _gamepadEnabled: boolean = false
  private _gamepadLastMove: string | null = null
  private _debugEnabled: boolean = false
  private _peer: Peer | null = null
  private _connectedPeersIds: string[] = []
  private _peerCallEnabled: boolean = false
  private _peerConnectionMap: Map<string, DataConnection> = new Map<string, DataConnection>()
  private _queuedPeersIds: string[] = []
  private _playerStream: MediaStream | null = null
  private _attemptedPeersIds: string[] = []
  private _timeoutCountMap: Map<string, number> = new Map<string, number>()
  private _peerVolumeMeterMap: Map<string, ScriptProcessorNode> = new Map<string, ScriptProcessorNode>()
  private _mediaPannerMap: Map<string, StereoPannerNode> = new Map<string, StereoPannerNode>()

  onLoad() {
    if (this._debugEnabled) {
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
        resources.load('Prefabs/Camera', Prefab, (error, prefab) => {
          const camera = instantiate(prefab)
          clientPlayer.node.addChild(camera)
          this.gameNode.getComponent(Canvas).cameraComponent = camera.getComponent(Camera)
          this.gameNode.getComponent(Canvas).cameraComponent.orthoHeight = 160
        })
        this._joystick = this.gameUINode.getComponentInChildren(Joystick)
        this._joystickEnabled = true
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

    this._initializePeer()
  }

  update(deltaTime: number) {
    if (this._joystickEnabled) {
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

    if (this._gamepadEnabled) {
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
    this._gamepadEnabled = true
  }

  private _gamepadDisconnected = (event: GamepadEvent) => {
    if (event.gamepad.index === 0) {
      this._gamepadEnabled = false
    }
  }

  private _onKeyDown(event: EventKeyboard) {
    if (this._playerControllerEnabled) {
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
    if (this._playerControllerEnabled) {
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

  protected _onBeginContact(a: Collider2D, b: Collider2D) {
    console.log('_onBeginContact')
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

  protected _idleUp() {
    this._room.send('clientMovePlayer', { id: this._room.sessionId, move: 'idleUp' })
  }

  private _idleRight() {
    this._room.send('clientMovePlayer', { id: this._room.sessionId, move: 'idleRight' })
  }

  protected _idleDown() {
    this._room.send('clientMovePlayer', { id: this._room.sessionId, move: 'idleDown' })
  }

  private _idleLeft() {
    this._room.send('clientMovePlayer', { id: this._room.sessionId, move: 'idleLeft' })
  }

  private _removeItem(arr: string[], value: string) {
    return arr.filter((element) => element !== value)
  }

  private _initializePeer = () => {
    this._connectedPeersIds = []

    // @ts-ignore
    this._peer = new window.peerjs.Peer() as Peer
    // this._peer = new window.peerjs.Peer({ host: 'localhost', port: 8000, path: '/peerjs/myapp', debug: 1 }) as Peer

    this._peer.on('open', () => {
      console.log('My PeerJS ID is:', this._peer.id)
      this._peerCallEnabled = true

      this._callNextPeer()
    })

    this._peer.on('connection', (connection) => {
      connection.on('open', () => {
        this._peerConnectionMap.set(connection.peer, connection)
      })

      connection.on('error', (error) => {
        console.error('Error in peer data connection.', error)
      })
    })

    this._peer.on('close', () => {
      console.error('Peer chat close.')
    })

    this._peer.on('disconnected', () => {
      console.error('Peer chat disconnected.')
      this._initializePeer()
    })

    this._peer.on('error', (error) => {
      const FATAL_ERRORS = [
        'invalid-id',
        'invalid-key',
        'network',
        'ssl-unavailable',
        'server-error',
        'socket-error',
        'socket-closed',
        'unavailable-id',
        'webrtc',
      ]

      if (FATAL_ERRORS.includes(error.name)) {
        // TODO: Add increasing timeout here to avoid thrashing the browser.
        console.error('Fatal error: ', error.name)
        this._initializePeer()
      } else {
        console.log('Non fatal error: ', error.name)
        this._callNextPeer()
      }

      // TODO: Tell the server about this error.
    })

    this._peer.on('call', (call) => {
      try {
        const peerId = call.peer.toString()
        if (peerId === this._peer.id) {
          console.warn('Cannot answer self call.')
          return
        }
        console.log('Answering player ')

        this._connectedPeersIds.push(peerId)

        navigator.mediaDevices
          .getUserMedia({ video: false, audio: true })
          .then((playerStream) => {
            this._playerStream = playerStream
            call.answer(this._playerStream)

            if (!this._peerVolumeMeterMap.get(this._peer.id)) {
              this._setupVoiceActivityMeter(this._peer.id, this._playerStream.clone())
            }
          })
          .catch((error) => {
            console.error('Failed to get local stream.', error)
          })

        call.on('stream', (remoteStream) => {
          console.log('Answered player ' + peerId)
          this._addStreamToHtml(peerId, remoteStream.clone())
          this._setupVoiceActivityMeter(peerId, remoteStream.clone())
        })

        call.on('error', (error) => {
          console.warn('Error with stream.', error)
          const indexOfPeer = this._connectedPeersIds.indexOf(peerId)

          if (indexOfPeer !== -1) this._connectedPeersIds.splice(indexOfPeer, 1)

          if (this._peerCallEnabled) {
            this._reconnectTimeout(peerId)
          }
        })
      } catch (error) {
        console.error('Error in peer.on(call)', error)
      }
    })
  }

  private _reconnectTimeout(peerId: string) {
    if (this._connectedPeersIds.indexOf(peerId) !== -1) {
      return
    }
    const lastTimeout = this._timeoutCountMap.get(peerId) || 3
    this._timeoutCountMap.set(peerId, lastTimeout + 5)
    if (lastTimeout > 30) {
      return
    }
    setTimeout(() => {
      this._callPeerById(peerId)
    }, lastTimeout * 1000)
  }

  private _callNextPeer = () => {
    if (this._queuedPeersIds.length <= 0) {
      return
    }

    const _nextPeerId = this._queuedPeersIds.shift()
    this._callPeerById(_nextPeerId)
  }

  private _callPeerById(peerId: string) {
    try {
      if (this._connectedPeersIds.indexOf(peerId) !== -1) {
        return
      }

      if (peerId === this._peer.id) {
        console.warn('Cannot self call.')
        return
      }

      console.log('Calling player ', peerId)
      const connect = this._peer.connect(peerId, { serialization: 'none' })

      connect.on('open', () => {
        this._peerConnectionMap.set(peerId, connect)
      })
      connect.on('error', (error) => {
        console.error('Error in peer data connection.', error)
      })

      const callOptions = {
        metadata: {
          mandatory: {
            OfferToReceiveAudio: true,
            OfferToReceiveVideo: false,
          },
          offerToReceiveAudio: 1,
          offerToReceiveVideo: 0,
        },
      }

      navigator.mediaDevices
        .getUserMedia({ video: false, audio: true })
        .then((playerStream) => {
          this._playerStream = playerStream
          const call = this._peer.call(peerId.toString(), this._playerStream, callOptions)

          call.on('stream', (remoteStream) => {
            if (!peerId) {
              return
            }
            console.log('Received stream')

            this._connectedPeersIds.push(peerId)

            this._addStreamToHtml(peerId.toString(), remoteStream.clone())

            this._setupVoiceActivityMeter(peerId.toString(), remoteStream.clone())
            this._callNextPeer()
          })

          if (!this._peerVolumeMeterMap.get(this._peer.id)) {
            this._setupVoiceActivityMeter(this._peer.id, this._playerStream.clone())
          }

          this._reconnectTimeout(peerId)
          if (this._attemptedPeersIds.indexOf(peerId) === -1) {
            this._attemptedPeersIds.push(peerId)
          }

          call.on('error', (error) => {
            console.warn('Error with stream.', error)
            const indexOfPeer = this._connectedPeersIds.indexOf(peerId)
            if (indexOfPeer !== -1) this._connectedPeersIds.splice(indexOfPeer, 1)

            if (this._peerCallEnabled) {
              this._reconnectTimeout(peerId)
            }
          })
        })
        .catch((error) => {
          console.error('Failed to get local stream.', error)
        })
    } catch (error) {
      console.error('Error in _callNextPeer.', error)
    }
  }

  private _setupVoiceActivityMeter(peerId: string, stream: MediaStream) {
    // Create an AudioNode from the stream.
    const mediaStreamSource = this._persistentNode.audioContext.createMediaStreamSource(stream)
    // Create a new volume meter and connect it.
    const meter = createAudioMeter(this._persistentNode.audioContext)
    mediaStreamSource.connect(meter)
    this._peerVolumeMeterMap.set(peerId, meter)
  }

  private _addStreamToHtml(peerId: string, remoteStream: MediaStream) {
    const splitStream = this._splitMediaStream(peerId, remoteStream)
    const mediaContainer = document.getElementById('media-container')
    let remoteVideo = document.getElementById('p' + peerId) as HTMLAudioElement
    let volumeControl = document.getElementById('v' + peerId) as HTMLAudioElement

    if (remoteVideo === null) {
      remoteVideo = document.createElement('audio')
      remoteVideo.id = 'p' + peerId
      remoteVideo.srcObject = remoteStream
      remoteVideo.autoplay = true
      remoteVideo.volume = 0
      remoteVideo.play()
      mediaContainer.appendChild(remoteVideo)
    } else {
      remoteVideo.srcObject = remoteStream
      remoteVideo.autoplay = true
      remoteVideo.volume = 0
      remoteVideo.play()
    }

    if (volumeControl === null) {
      volumeControl = document.createElement('audio')
      volumeControl.id = 'v' + peerId
      volumeControl.srcObject = splitStream
      volumeControl.autoplay = true
      volumeControl.volume = 1
      volumeControl.play()
      mediaContainer.appendChild(volumeControl)
    } else {
      volumeControl.srcObject = splitStream
      volumeControl.autoplay = true
      volumeControl.volume = 1
      volumeControl.play()
    }
  }

  private _splitMediaStream(peerId: string, stream: MediaStream) {
    try {
      const mediaStreamSource = this._persistentNode.audioContext.createMediaStreamSource(stream)
      const pannerNode = this._persistentNode.audioContext.createStereoPanner()
      const destination = this._persistentNode.audioContext.createMediaStreamDestination()

      mediaStreamSource.connect(pannerNode)
      pannerNode.connect(destination)

      this._mediaPannerMap.set(peerId, pannerNode)

      return destination.stream
    } catch (error) {
      console.warn('Could not split media stream.', error)
      return stream
    }
  }
}
