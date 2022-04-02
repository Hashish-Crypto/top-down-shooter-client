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
    if (event.keyCode === KeyCode.KEY_W && !this._isMoving) {
      this._playerController.moveUp()
      this._isMoving = true
      this._currentKeyPressed = event.keyCode
    }
    if (event.keyCode === KeyCode.KEY_D && !this._isMoving) {
      this._playerController.moveRight()
      this._isMoving = true
      this._currentKeyPressed = event.keyCode
    }
    if (event.keyCode === KeyCode.KEY_S && !this._isMoving) {
      this._playerController.moveDown()
      this._isMoving = true
      this._currentKeyPressed = event.keyCode
    }
    if (event.keyCode === KeyCode.KEY_A && !this._isMoving) {
      this._playerController.moveLeft()
      this._isMoving = true
      this._currentKeyPressed = event.keyCode
    }
  }

  onKeyUp(event: EventKeyboard) {
    if (event.keyCode === KeyCode.KEY_W && this._isMoving && this._currentKeyPressed === event.keyCode) {
      this._playerController.idleUp()
      this._isMoving = false
    }
    if (event.keyCode === KeyCode.KEY_D && this._isMoving && this._currentKeyPressed === event.keyCode) {
      this._playerController.idleRight()
      this._isMoving = false
    }
    if (event.keyCode === KeyCode.KEY_S && this._isMoving && this._currentKeyPressed === event.keyCode) {
      this._playerController.idleDown()
      this._isMoving = false
    }
    if (event.keyCode === KeyCode.KEY_A && this._isMoving && this._currentKeyPressed === event.keyCode) {
      this._playerController.idleLeft()
      this._isMoving = false
    }
  }
}
