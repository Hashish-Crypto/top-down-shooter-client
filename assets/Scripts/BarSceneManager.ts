import { _decorator, Collider2D } from 'cc'
import { GenericSceneManager } from './GenericSceneManager'

const { ccclass } = _decorator

/**
 * Predefined variables
 * Name = BarSceneManager
 * DateTime = Sat Apr 30 2022 11:18:32 GMT-0300 (Brasilia Standard Time)
 * Author = acquati
 * FileBasename = BarSceneManager.ts
 * FileBasenameNoExtension = BarSceneManager
 * URL = db://assets/Scripts/BarSceneManager.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('BarSceneManager')
export class BarSceneManager extends GenericSceneManager {
  protected _onBeginContact(a: Collider2D, b: Collider2D) {
    if (b.node.uuid === this._currentPlayerUUID) {
      if (a.node.name === 'BarDoor') {
        this._playerControllerActive = false
        this._idleDown()
        console.log('MoonBase')
        this._room.send('clientRemovePlayer')
        this._persistentNode.connect('MoonBase')
      }
    }
  }
}
