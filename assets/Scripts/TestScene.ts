import { _decorator, Component } from 'cc'

const { ccclass } = _decorator

/**
 * Predefined variables
 * Name = TestScene
 * DateTime = Sat Apr 30 2022 02:07:41 GMT-0300 (Brasilia Standard Time)
 * Author = acquati
 * FileBasename = TestScene.ts
 * FileBasenameNoExtension = TestScene
 * URL = db://assets/Scripts/TestScene.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('TestScene')
export class TestScene extends Component {
  onLoad() {
    console.log('TestScene')
  }
}
