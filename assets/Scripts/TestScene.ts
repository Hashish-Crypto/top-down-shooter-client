import { _decorator, Component } from 'cc'

const { ccclass } = _decorator

@ccclass('TestScene')
export class TestScene extends Component {
  onLoad() {
    console.log('TestScene')
  }
}
