function AudioChannel(audio) {
	
	this.audio = audio;
	
	var context = new AudioContext();
	
	var media = context.createMediaElementSource(audio);
	
	var leftGain = context.createGain();
	var rightGain = context.createGain();
	
	var splitter = context.createChannelSplitter(2);
	var merger = context.createChannelMerger(2);

	media.connect(splitter);
	
	splitter.connect(leftGain, 0);
	splitter.connect(rightGain, 1);
	
	leftGain.connect(merger, 0, 0);
	rightGain.connect(merger, 0, 1);
	
	merger.connect(context.destination);
	
	this.leftGain = leftGain;
	this.rightGain = rightGain;
	
	this._volume = 1;
	this._leftVolume = 1;
	this._rightVolume = 1;
	
	this.updateVolume();
}

AudioChannel.prototype = {

	constructor: AudioChannel,
	
	get volume() {
		return this._volume;
	},
	set volume(value) {
		this._volume = value;
		this.updateVolume();
	},
	
	get leftVolume() {
		return this._leftVolume;
	},
	set leftVolume(value) {
		this._leftVolume = value;
		this.updateVolume();
	},
	
	get rightVolume() {
		return this._rightVolume;
	},
	set rightVolume(value) {
		this._rightVolume = value;
		this.updateVolume();
	},
	
	updateVolume: function () {
		this.leftGain.gain.value = this.leftVolume * this.volume;
		this.rightGain.gain.value = this.rightVolume * this.volume;
	},
	
	setEqualizer: function (value) {
		this._leftVolume = (value < 0.5) ? 1 : (1 - value) / 0.5;
		this._rightVolume = (value > 0.5) ? 1 : (value - 0) / 0.5;
		this.updateVolume();
	},
	
};

export { AudioChannel };