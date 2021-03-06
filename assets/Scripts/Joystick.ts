import { _decorator, Component, Node, EventTouch, Vec3, UITransform, Size } from 'cc'

const { ccclass, property } = _decorator

@ccclass('Joystick')
export class Joystick extends Component {
  @property({ type: Node })
  private ring: Node | null = null

  @property({ type: Node })
  private ball: Node | null = null

  @property
  private maxRadius: number = 100

  private _piDividedBy4 = Math.PI / 4
  public move: string = 'idleDown'

  onLoad() {
    if (!this.ring) {
      console.warn('Joystick Ring is null!')
      return
    }

    if (!this.ball) {
      console.warn('Joystick Dot is null!')
      return
    }

    const uiTransform = this.ring.getComponent(UITransform)
    const size = this.maxRadius * 2
    const ringSize = new Size(size, size)
    uiTransform.setContentSize(ringSize)
    this.ring.getChildByName('Background').getComponent(UITransform).setContentSize(ringSize)

    this.node.on(Node.EventType.TOUCH_START, this._touchStart, this)
    this.node.on(Node.EventType.TOUCH_MOVE, this._touchMove, this)
    this.node.on(Node.EventType.TOUCH_END, this._touchEnd, this)
    this.node.on(Node.EventType.TOUCH_CANCEL, this._touchEnd, this)
    // View.instance.setResizeCallback(() => {})
  }

  onDisable() {
    this.node.off(Node.EventType.TOUCH_START, this._touchStart, this)
    this.node.off(Node.EventType.TOUCH_MOVE, this._touchMove, this)
    this.node.off(Node.EventType.TOUCH_END, this._touchEnd, this)
    this.node.off(Node.EventType.TOUCH_CANCEL, this._touchEnd, this)
  }

  private _touchStart(event: EventTouch) {
    if (!this.ring || !this.ball) return

    const location = event.getUILocation()
    const touchPosition = new Vec3(location.x, location.y)
    const moveVector = touchPosition.subtract(this.ring.getPosition())
    const distance = moveVector.length()

    if (this.maxRadius > distance) {
      this.ball.setPosition(moveVector)
    }

    this._setMove(moveVector.normalize())
  }

  private _touchMove(event: EventTouch) {
    if (!this.ring || !this.ball) return

    const location = event.getTouches()[0].getUILocation()
    const touchPosition = new Vec3(location.x, location.y)
    const moveVector = touchPosition.subtract(this.ring.getPosition())
    const distance = moveVector.length()

    if (this.maxRadius > distance) {
      this.ball.setPosition(moveVector)
    } else {
      this.ball.setPosition(moveVector.normalize().multiplyScalar(this.maxRadius))
    }

    this._setMove(moveVector.normalize())
  }

  private _touchEnd(event: EventTouch) {
    if (!this.ring || !this.ball) return

    const location = event.getUILocation()
    const touchPosition = new Vec3(location.x, location.y)
    const moveVector = touchPosition.subtract(this.ring.getPosition())

    const vector = moveVector.normalize()
    if (vector.x < this._piDividedBy4 && vector.x > -this._piDividedBy4 && vector.y >= this._piDividedBy4) {
      this.move = 'idleUp'
    } else if (vector.x >= this._piDividedBy4 && vector.y < this._piDividedBy4 && vector.y > -this._piDividedBy4) {
      this.move = 'idleRight'
    } else if (vector.x < this._piDividedBy4 && vector.x > -this._piDividedBy4 && vector.y <= -this._piDividedBy4) {
      this.move = 'idleDown'
    } else if (vector.x <= -this._piDividedBy4 && vector.y < this._piDividedBy4 && vector.y > -this._piDividedBy4) {
      this.move = 'idleLeft'
    }

    this.ball.setPosition(new Vec3())
  }

  private _setMove(vector: Vec3) {
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
