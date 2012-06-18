function createAuroraPlayer(url, DGPlayer){
    var player = Player.fromURL(url);
    
    DGPlayer.on('play', function(){
        player.play();
        DGPlayer.state = 'playing';
    });
    
    DGPlayer.on('pause', function(){
        player.pause();
        DGPlayer.state = 'paused';
    });
    
    DGPlayer.on('volume', function(value) {
        player.volume = value;
    });
    
    player.on('ready', function() {
        DGPlayer.duration = player.duration;
    });
    
    player.on('buffer', function(percent) {
        DGPlayer.bufferProgress = percent;
    });
    
    player.on('progress', function(time) {
        DGPlayer.seekTime = time;
    });
    
    player.volume = 50;
    player.preload();
    player.play();

    return player;
}
