import { _decorator, Component, Node, EventTouch, Vec3, Vec2 } from 'cc'

const { ccclass, property } = _decorator

/**
 * Predefined variables
 * Name = Joystick
 * DateTime = Mon Apr 18 2022 19:33:30 GMT-0300 (Brasilia Standard Time)
 * Author = acquati
 * FileBasename = Joystick.ts
 * FileBasenameNoExtension = Joystick
 * URL = db://assets/Scripts/Joystick.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('Joystick')
export class Joystick extends Component {
  @property({ type: Node })
  private joystickBall: Node | null = null

  private _maxLength: number = 100
  private _piDividedBy4 = Math.PI / 4
  public move: string = 'idleDown'

  onLoad() {
    this.node.on(Node.EventType.TOUCH_START, this.touchStart, this)
    this.node.on(Node.EventType.TOUCH_MOVE, this.touchMove, this)
    this.node.on(Node.EventType.TOUCH_END, this.touchEnd, this)
    this.node.on(Node.EventType.TOUCH_CANCEL, this.touchEnd, this)
  }

  // start() {}

  // update(deltaTime: number) {}

  onDisable() {
    this.node.off(Node.EventType.TOUCH_START, this.touchStart, this)
    this.node.off(Node.EventType.TOUCH_MOVE, this.touchMove, this)
    this.node.off(Node.EventType.TOUCH_END, this.touchEnd, this)
    this.node.off(Node.EventType.TOUCH_CANCEL, this.touchEnd, this)
  }

  touchStart(event: EventTouch) {
    const touchPosition = event.getLocation()
    const localTouchPosition = new Vec3(touchPosition.x - 120, touchPosition.y - 120, 0)
    this.limitJoystickVector(localTouchPosition)
    this.setJoystickBallPosition(localTouchPosition)

    this.setMove(localTouchPosition.normalize())
  }

  touchMove(event: EventTouch) {
    const touchPosition = event.getTouches()[0].getLocation()
    const localTouchPosition = new Vec3(touchPosition.x - 120, touchPosition.y - 120, 0)
    this.limitJoystickVector(localTouchPosition)
    this.setJoystickBallPosition(localTouchPosition)

    this.setMove(localTouchPosition.normalize())
  }

  touchEnd(event: EventTouch) {
    const touchPosition = event.getLocation()
    const localTouchPosition = new Vec3(touchPosition.x - 120, touchPosition.y - 120, 0)

    const vector = localTouchPosition.normalize()
    if (vector.x < this._piDividedBy4 && vector.x > -this._piDividedBy4 && vector.y >= this._piDividedBy4) {
      this.move = 'idleUp'
    } else if (vector.x >= this._piDividedBy4 && vector.y < this._piDividedBy4 && vector.y > -this._piDividedBy4) {
      this.move = 'idleRight'
    } else if (vector.x < this._piDividedBy4 && vector.x > -this._piDividedBy4 && vector.y <= -this._piDividedBy4) {
      this.move = 'idleDown'
    } else if (vector.x <= -this._piDividedBy4 && vector.y < this._piDividedBy4 && vector.y > -this._piDividedBy4) {
      this.move = 'idleLeft'
    }

    this.setJoystickBallPosition(new Vec3())
  }

  setJoystickBallPosition(position: Vec3) {
    this.joystickBall.setPosition(position)
  }

  limitJoystickVector(joystickVector: Vec3) {
    const inputLength = joystickVector.length()
    if (inputLength > this._maxLength) {
      joystickVector.multiplyScalar(this._maxLength / inputLength)
    }
  }

  setMove(vector: Vec3) {
    if (vector.x < this._piDividedBy4 && vector.x > -this._piDividedBy4 && vector.y >= this._piDividedBy4) {
      this.move = 'moveUp'
    } else if (vector.x >= this._piDividedBy4 && vector.y < this._piDividedBy4 && vector.y > -this._piDividedBy4) {
      this.move = 'moveRight'
    } else if (vector.x < this._piDividedBy4 && vector.x > -this._piDividedBy4 && vector.y <= -this._piDividedBy4) {
      this.move = 'moveDown'
    } else if (vector.x <= -this._piDividedBy4 && vector.y < this._piDividedBy4 && vector.y > -this._piDividedBy4) {
      this.move = 'moveLeft'
    }
  }
}
