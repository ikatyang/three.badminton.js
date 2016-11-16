function Record(shuttlecock, robot1, robot2, data) {
	
	this.shuttlecock = shuttlecock;
	this.robot1 = robot1;
	this.robot2 = robot2;
	
	this.counter = 0;
	this.playing = false;
	
	this.init(data);
	
	if (!data)
		this.record();
}

Record.prototype = {

	constructor: Record,
	
	init: function (data) {
		this.data = data || [];
	},
	
	start: function (index) {
		if (index < 0)
			index = this.data.length - 1 + index;
		this.counter = THREE.Math.clamp(index || 0, 0, this.data.length - 1);
		if (this.counter < this.data.length) {
			this.setData(this.robot1, this.data[this.counter].robot1.init);
			this.setData(this.robot2, this.data[this.counter].robot2.init);
			this.setData(this.shuttlecock, this.data[this.counter].shuttlecock.init);
			this.next();
		}
	},
	
	next: function () {
		if (++this.counter < this.data.length) {
			this.setData(this.robot1, this.data[this.counter].robot1.play);
			this.setData(this.robot2, this.data[this.counter].robot2.play);
		}
		this.playing = (this.counter + 1 < this.data.length);
	},
	
	record: function () {
		this.data.push({
			robot1: {
				init: this.getData(this.robot1, this.KEYS_ROBOT_INIT),
				play: this.getData(this.robot1, this.KEYS_ROBOT_PLAY),
			},
			robot2: {
				init: this.getData(this.robot2, this.KEYS_ROBOT_INIT),
				play: this.getData(this.robot2, this.KEYS_ROBOT_PLAY),
			},
			shuttlecock: {
				init: this.getData(this.shuttlecock, this.KEYS_SHUTTLECOCK_INIT),
			},
		});
	},
	
	getValue: function (object) {
		switch (typeof object) {
			case 'object':
				if (typeof object.toArray === 'function')
					return object.toArray();
			default:
				return object;
		}
	},
	
	getData: function (object, keys) {
		var data = {};
		for (var i = 0; i < keys.length; i++) {
			var temp = object;
			var key = keys[i];
			key.split('.').forEach(function (name) {
				temp = temp[name];
			});
			data[key] = this.getValue(temp);
		}
		return data;
	},
	
	setData: function (object, data) {
		for (var key in data) {
			var temp = object;
			var value = data[key];
			key.split('.').forEach(function (name, index, array) {
				if (index < array.length - 1)
					temp = temp[name];
				else if (typeof temp[name].fromArray === 'function')
					temp[name].fromArray(value);
				else
					temp[name] = value;
			});
		}
	},
	
	KEYS_ROBOT_INIT: [
		'position',
		'rotation',
		'impactCount',
		'impactElapsed',
		'healthPercent',
		'body.rotation.y',
		'responsibleArea',
	],
	
	KEYS_ROBOT_PLAY: [
		'impactType',
		'targetPosition',
	],
	
	KEYS_SHUTTLECOCK_INIT: [
		'state',
		'position',
		'rotation',
		'velocity',
		'impactCount',
	],
	
};

export { Record };