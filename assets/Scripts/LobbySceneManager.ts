import { _decorator, Component, Node, Button, find } from 'cc'
import { PersistentNode } from './PersistentNode'

const { ccclass, property } = _decorator

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
    this._persistentNode.connect('MoonBase')
  }
}
