function Record(objects, maxLength) {
	
	this.objects = objects;
	this.maxLength = (maxLength !== undefined) ? maxLength : Infinity;
	
	this.init();
}

Record.prototype = {

	constructor: Record,
	
	init: function () {
		this.data = [];
		this.dataLength = 0;
		this.playing = false;
		this.elapsed = 0;
	},
	
	record: function (delta) {
		
		while (this.dataLength + delta > this.maxLength) {
			this.data.shift();
			this.dataLength -= this.data[0].delta;
		}
			
		
		var data = {
			delta: delta,
			objects: [],
		};
		
		for (var i = 0; i < this.objects.length; i++) {
			
			var object = this.objects[i];
			
			data.objects.push({
				position: object.position.clone(),
				quaternion: object.quaternion.clone(),
			});
		}
		
		this.data.push(data);
		
		if (this.data.length > 1)
			this.dataLength += delta;
	},
	
	start: function (time) {
		
		if (time < 0)
			time = this.dataLength + time;
		
		if (time < 0)
			time = 0;
		
		if (time > this.dataLength)
			return;
		
		this.elapsed = time;
		this.playing = true;
	},
	
	update: function (delta) {
		
		if (window.xxx)
			debugger;
		
		this.elapsed += delta;
		
		if (this.elapsed >= this.dataLength) {
			this.elapsed = this.dataLength;
			this.playing = false;
		}
		
		var data0 = null;
		var data1 = this.data[0];
		
		var elapsed = 0;
		for (var i = 1; i < this.data.length; i++) {
			
			data0 = data1;
			data1 = this.data[i];
			
			elapsed += this.data[i].delta;
			
			if (this.elapsed <= elapsed)
				break;
		}
		
		var ratio = 1 - (elapsed - this.elapsed) / data1.delta;
		
		for (var i = 0; i < this.objects.length; i++) {
			
			var object = this.objects[i];
			var objectData0 = data0.objects[i];
			var objectData1 = data1.objects[i];
			
			THREE.Quaternion.slerp(objectData0.quaternion, objectData1.quaternion, object.quaternion, ratio);
			object.position.lerpVectors(objectData0.position, objectData1.position, ratio);
		}
	},
	
};

export { Record };