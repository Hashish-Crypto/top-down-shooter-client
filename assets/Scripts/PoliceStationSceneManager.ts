import { _decorator, Collider2D } from 'cc'
import { GenericSceneManager } from './GenericSceneManager'

const { ccclass } = _decorator

@ccclass('PoliceStationSceneManager')
export class PoliceStationSceneManager extends GenericSceneManager {
  protected _onBeginContact(a: Collider2D, b: Collider2D) {
    if (b.node.uuid === this._currentPlayerUUID) {
      if (a.node.name === 'PoliceStationDoor') {
        this._playerControllerEnabled = false
        this._idleDown()
        this._room.send('clientRemovePlayer')
        this._persistentNode.connect('MoonBase')
      }
    }
  }
}
