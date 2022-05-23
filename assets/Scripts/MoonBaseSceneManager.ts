import { _decorator, Collider2D } from 'cc'
import { GenericSceneManager } from './GenericSceneManager'

const { ccclass } = _decorator

@ccclass('MoonBaseSceneManager')
export class MoonBaseSceneManager extends GenericSceneManager {
  protected _onBeginContact(a: Collider2D, b: Collider2D) {
    if (b.node.uuid === this._currentPlayerUUID) {
      if (a.node.name === 'PoliceStationDoor') {
        this._playerControllerEnabled = false
        this._idleUp()
        this._room.send('clientRemovePlayer')
        this._persistentNode.connect('PoliceStation')
      } else if (a.node.name === 'BarDoor') {
        this._playerControllerEnabled = false
        this._idleUp()
        this._room.send('clientRemovePlayer')
        this._persistentNode.connect('Bar')
      } else if (a.node.name === 'LoungeDoor') {
        this._playerControllerEnabled = false
        this._idleUp()
        this._room.send('clientRemovePlayer')
        this._persistentNode.connect('Lounge')
      }
    }
  }
}
