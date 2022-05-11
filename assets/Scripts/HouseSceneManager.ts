import { _decorator, Collider2D } from 'cc'
import { GenericSceneManager } from './GenericSceneManager'

const { ccclass } = _decorator

@ccclass('HouseSceneManager')
export class HouseSceneManager extends GenericSceneManager {
  protected _onBeginContact(a: Collider2D, b: Collider2D) {
    if (b.node.uuid === this._currentPlayerUUID) {
      if (a.node.name === 'HouseDoor') {
        this._playerControllerActive = false
        this._idleDown()
        this._room.send('clientRemovePlayer')
        this._persistentNode.connect('MoonBase')
      }
    }
  }
}
