import { _decorator, Component, RigidBody2D, Vec2, CCFloat, Animation } from 'cc'

const { ccclass, property } = _decorator

@ccclass('PlayerController')
export class PlayerController extends Component {
  @property({ type: CCFloat })
  private velocity: number = 4

  private _body: RigidBody2D | null = null
  private _animation: Animation | null = null

  onLoad() {
    this._body = this.node.getComponent(RigidBody2D)
    this._animation = this.node.getComponent(Animation)
  }

  moveUp() {
    this._body.linearVelocity = new Vec2(0, this.velocity)
    this._animation.play('walkUp')
  }

  moveRight() {
    this._body.linearVelocity = new Vec2(this.velocity, 0)
    this._animation.play('walkRight')
  }

  moveDown() {
    this._body.linearVelocity = new Vec2(0, -this.velocity)
    this._animation.play('walkDown')
  }

  moveLeft() {
    this._body.linearVelocity = new Vec2(-this.velocity, 0)
    this._animation.play('walkLeft')
  }

  idleUp() {
    this._body.linearVelocity = new Vec2(0, 0)
    this._animation.play('idleUp')
  }

  idleRight() {
    this._body.linearVelocity = new Vec2(0, 0)
    this._animation.play('idleRight')
  }

  idleDown() {
    this._body.linearVelocity = new Vec2(0, 0)
    this._animation.play('idleDown')
  }

  idleLeft() {
    this._body.linearVelocity = new Vec2(0, 0)
    this._animation.play('idleLeft')
  }
}
