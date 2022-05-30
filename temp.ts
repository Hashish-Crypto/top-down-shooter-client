function init() {
  // TODO Move these two callbacks to socket_client.js
  this.socketClient.socket.on('new_peer_id', function (p_data) {
    this.peerChat.player_peer_map.set(p_data.id, p_data.pid)
    // console.log("Recieved new_peer_id %s ", JSON.stringify(p_data));
  })

  this.socketClient.socket.on('allpeers', function (p_all_peers) {
    this.peerChat.receive_all_peers(p_all_peers)
  })

  const send_peer_cb = () => {
    // console.log("send_peer_cb");
    this.socketClient.setPeerID(this.player_id, this.peerChat.peer.id)
  }

  this.peerChat.callback_on_connect = send_peer_cb
  if (this.peerChat.isAlive()) {
    send_peer_cb()
  } else {
    // Maybe peer needs re-creating?
    // this..peerChat.init_new_peer();
  }
}

// Socket
function init_new_socket() {
  this.setPeerID = function (p_player_id, p_peer_id) {
    this.socket.emit('set_peer_id', { player_id: p_player_id, peer_id: p_peer_id })
  }
}
socket.on('set_peer_id', async function (p_data) {})

function update(time, delta) {
  if (MainGame.COUNTER_DOM_UPDATE >= MainGame.INTERVAL_DOM_UPDATE) {
    MainGame.COUNTER_DOM_UPDATE = 0
    this.peerChat.handle_voice_proximity(this.current_player, this.playerMap)
  }

  this.peerChat.handle_talk_activity(this.playerMap)
}

if (Phaser.Input.Keyboard.JustDown(this.keys_arrows.space)) {
  let new_mute_state = this.peerChat.toggleMicMute()
  this.current_player.muted_mic_sprite.setVisible(new_mute_state)
  this.socketClient.sendMutedSelfState(this.player_id, new_mute_state)
}
