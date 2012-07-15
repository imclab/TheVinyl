var counter = 1;

var vinylPlayer;

var _sampleRate = (function() {
	var AudioContext = (window.AudioContext || window.webkitAudioContext);
	if (!AudioContext)
		return 44100;

	return new AudioContext().sampleRate;
}());

if (!unsupported) { //supports web audio api
	var vinylPlayer = function (file, type) {
		var MySource = EventEmitter.extend({
			start: function() {
				var source = this;
				source.stream = socket.createStream({file: file+"-"+_sampleRate+"."+type});
				source.stream.on('data', function(data){
					source.emit('data', new Buffer(new Uint8Array(data)));
				});
				  
				source.stream.on('end', function(){
					source.emit('end');
					console.log('File finished streaming.');
				});
			},

			pause: function() {
				source.stream.destroy();
			},

			reset: function() {}
		});

		// create a source, asset and player
		var source = new MySource();
		var asset = new Asset(source);
		this.player = new Player(asset);
	}

	vinylPlayer.prototype.play = function() {
		this.player.play();
	};

	vinylPlayer.prototype.pause = function() {
		this.player.pause();
	};

	vinylPlayer.prototype.volume = function(vol) {
		this.player.volume = vol;
	};

	vinylPlayer.prototype.destroy = function() {
		vinylPlayer = null;
	};
} else {
	counter = counter++;
	var newCounter = counter;
	var vinylPlayer = function (file, type) {
		$("body").append("<div id='jpId"+newCounter+"'></div>");
		$("#jpId"+newCounter).jPlayer( {
			ready: function () {
				$(this).jPlayer("setMedia", {
					mp3: "/media/"+file+".mp3"
				});
			},
			swfPath: "/js/swf"
		});
	}

	vinylPlayer.prototype.play = function() {
		$("#jpId"+newCounter).jPlayer("play");
	};

	vinylPlayer.prototype.pause = function() {
		$("#jpId"+newCounter).jPlayer("pause");
	};

	vinylPlayer.prototype.volume = function(vol) {
		$("#jpId"+newCounter).jPlayer("volume", vol/100);
	};

	vinylPlayer.prototype.destroy = function() {
		$("#jpId"+newCounter).remove();
		vinylPlayer = null;
	};
}