import { _decorator, Component, Node, input, Input, EventKeyboard, KeyCode } from 'cc'
import { PlayerController } from './PlayerController'

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
  @property({ type: Node })
  public player: Node | null = null

  private _playerController: PlayerController | null = null
  private _isMoving: boolean = false
  private _currentKeyPressed: number | null = null
  private _moveCommands: string[] = []

  onLoad() {
    this._playerController = this.player.getComponent(PlayerController)

    input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this)
    input.on(Input.EventType.KEY_UP, this.onKeyUp, this)
  }

  start() {}

  update(deltaTime: number) {}

  onDestroy() {
    input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this)
    input.off(Input.EventType.KEY_UP, this.onKeyUp, this)
  }

  onKeyDown(event: EventKeyboard) {
    if (event.keyCode === KeyCode.KEY_W && !this._moveCommands.includes('w')) {
      this._moveCommands.push('w')
      this.movePlayer()
    } else if (event.keyCode === KeyCode.KEY_D && !this._moveCommands.includes('d')) {
      this._moveCommands.push('d')
      this.movePlayer()
    } else if (event.keyCode === KeyCode.KEY_S && !this._moveCommands.includes('s')) {
      this._moveCommands.push('s')
      this.movePlayer()
    } else if (event.keyCode === KeyCode.KEY_A && !this._moveCommands.includes('a')) {
      this._moveCommands.push('a')
      this.movePlayer()
    }

    console.log(this._moveCommands)
  }

  onKeyUp(event: EventKeyboard) {
    if (event.keyCode === KeyCode.KEY_W) {
      this._moveCommands = this.removeItem(this._moveCommands, 'w')
      if (this._moveCommands.length === 0) {
        this._playerController.idleUp()
      }
    } else if (event.keyCode === KeyCode.KEY_D) {
      this._moveCommands = this.removeItem(this._moveCommands, 'd')
      if (this._moveCommands.length === 0) {
        this._playerController.idleRight()
      }
    } else if (event.keyCode === KeyCode.KEY_S) {
      this._moveCommands = this.removeItem(this._moveCommands, 's')
      if (this._moveCommands.length === 0) {
        this._playerController.idleDown()
      }
    } else if (event.keyCode === KeyCode.KEY_A) {
      this._moveCommands = this.removeItem(this._moveCommands, 'a')
      if (this._moveCommands.length === 0) {
        this._playerController.idleLeft()
      }
    }

    this.movePlayer()
  }

  movePlayer() {
    if (this._moveCommands.length === 1) {
      if (this._moveCommands[0] === 'w') {
        this._playerController.moveUp()
      } else if (this._moveCommands[0] === 'd') {
        this._playerController.moveRight()
      } else if (this._moveCommands[0] === 's') {
        this._playerController.moveDown()
      } else if (this._moveCommands[0] === 'a') {
        this._playerController.moveLeft()
      }
    }
  }

  removeItem(arr: string[], value: string) {
    return arr.filter((element) => element !== value)
  }
}
