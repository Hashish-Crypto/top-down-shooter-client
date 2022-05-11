import { _decorator, Collider2D } from 'cc'
import { GenericSceneManager } from './GenericSceneManager'

const { ccclass } = _decorator

/**
 * Predefined variables
 * Name = PoliceStationSceneManager
 * DateTime = Mon May 02 2022 23:17:20 GMT-0300 (Brasilia Standard Time)
 * Author = acquati
 * FileBasename = PoliceStationSceneManager.ts
 * FileBasenameNoExtension = PoliceStationSceneManager
 * URL = db://assets/Scripts/PoliceStationSceneManager.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('PoliceStationSceneManager')
export class PoliceStationSceneManager extends GenericSceneManager {
  protected _onBeginContact(a: Collider2D, b: Collider2D) {
    if (b.node.uuid === this._currentPlayerUUID) {
      if (a.node.name === 'PoliceStationDoor') {
        this._playerControllerActive = false
        this._idleDown()
        this._room.send('clientRemovePlayer')
        this._persistentNode.connect('MoonBase')
      }
    }
  }
}
