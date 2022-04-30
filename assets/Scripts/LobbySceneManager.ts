import { _decorator, Component, Node, Button, find } from 'cc'
import { PersistentNode } from './PersistentNode'

const { ccclass, property } = _decorator

/**
 * Predefined variables
 * Name = LobbySceneManager
 * DateTime = Fri Apr 29 2022 19:05:40 GMT-0300 (Brasilia Standard Time)
 * Author = acquati
 * FileBasename = LobbySceneManager.ts
 * FileBasenameNoExtension = LobbySceneManager
 * URL = db://assets/Scripts/LobbySceneManager.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('LobbySceneManager')
export class LobbySceneManager extends Component {
  @property({ type: Node })
  private joinGameButton: Node | null = null

  @property({ type: Node })
  private loadingLabel: Node | null = null

  private _persistentNode: PersistentNode | null = null

  onLoad() {
    this._persistentNode = find('PersistRootNode').getComponent(PersistentNode)
    this.joinGameButton.on(Button.EventType.CLICK, this._joinGame, this)
  }

  onDestroy() {
    this.joinGameButton.off(Button.EventType.CLICK, this._joinGame, this)
  }

  private _joinGame() {
    this.joinGameButton.getComponent(Button).interactable = false
    this.loadingLabel.active = true
    this._persistentNode.connect()
  }
}
