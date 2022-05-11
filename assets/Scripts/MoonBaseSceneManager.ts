import { _decorator, Collider2D } from 'cc'
import { GenericSceneManager } from './GenericSceneManager'

const { ccclass } = _decorator

/**
 * Predefined variables
 * Name = MoonBaseSceneManager
 * DateTime = Sat Apr 30 2022 03:55:47 GMT-0300 (Brasilia Standard Time)
 * Author = acquati
 * FileBasename = MoonBaseSceneManager.ts
 * FileBasenameNoExtension = MoonBaseSceneManager
 * URL = db://assets/Scripts/MoonBaseSceneManager.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('MoonBaseSceneManager')
export class MoonBaseSceneManager extends GenericSceneManager {
  protected _onBeginContact(a: Collider2D, b: Collider2D) {
    if (b.node.uuid === this._currentPlayerUUID) {
      if (a.node.name === 'PoliceStationDoor') {
        this._playerControllerActive = false
        this._idleUp()
        this._room.send('clientRemovePlayer')
        this._persistentNode.connect('PoliceStation')
      } else if (a.node.name === 'BarDoor') {
        this._playerControllerActive = false
        this._idleUp()
        this._room.send('clientRemovePlayer')
        this._persistentNode.connect('Bar')
      } else if (a.node.name === 'HouseDoor') {
        this._playerControllerActive = false
        this._idleUp()
        this._room.send('clientRemovePlayer')
        this._persistentNode.connect('House')
      }
    }
  }
}
