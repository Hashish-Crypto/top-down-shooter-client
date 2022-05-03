import { _decorator, Collider2D } from 'cc'
import { GenericSceneManager } from './GenericSceneManager'

const { ccclass } = _decorator

/**
 * Predefined variables
 * Name = HouseSceneManager
 * DateTime = Mon May 02 2022 23:17:54 GMT-0300 (Brasilia Standard Time)
 * Author = acquati
 * FileBasename = HouseSceneManager.ts
 * FileBasenameNoExtension = HouseSceneManager
 * URL = db://assets/Scripts/HouseSceneManager.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('HouseSceneManager')
export class HouseSceneManager extends GenericSceneManager {
  protected _onBeginContact(a: Collider2D, b: Collider2D) {
    if (b.node.uuid === this._currentPlayerUUID) {
      if (a.node.name === 'HouseDoor') {
        this._playerControllerActive = false
        this._idleDown()
        console.log('MoonBase')
        this._room.send('clientRemovePlayer')
        this._persistentNode.connect('MoonBase')
      }
    }
  }
}
