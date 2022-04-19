import { _decorator, Component, RigidBody2D, Vec2, CCFloat, Animation } from 'cc'

const { ccclass, property } = _decorator

/**
 * Predefined variables
 * Name = PlayerController
 * DateTime = Sat Apr 02 2022 09:26:55 GMT-0300 (Brasilia Standard Time)
 * Author = acquati
 * FileBasename = PlayerController.ts
 * FileBasenameNoExtension = PlayerController
 * URL = db://assets/Scripts/PlayerController.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

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

  // start() {}

  // update(deltaTime: number) {}

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
