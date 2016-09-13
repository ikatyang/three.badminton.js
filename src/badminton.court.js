function Court(meter2unit) {
	
	meter2unit = (meter2unit !== undefined) ? meter2unit : 1;
	
	this.parameters = {
		meter2unit: meter2unit,
	};
	
	var material = new THREE.LineBasicMaterial();
	var geometry = new THREE.Geometry();
	geometry.vertices.push(
		new THREE.Vector3( -6.70,    0, -3.05), new THREE.Vector3( -6.70,    0,  3.05),
		new THREE.Vector3( -5.94,    0, -3.05), new THREE.Vector3( -5.94,    0,  3.05),
		new THREE.Vector3( -1.98,    0, -3.05), new THREE.Vector3( -1.98,    0,  3.05),
		new THREE.Vector3(     0,    0, -3.05), new THREE.Vector3(     0,    0,  3.05),
		new THREE.Vector3(     0, 1.55, -3.05), new THREE.Vector3(     0, 1.55,  3.05),
		new THREE.Vector3(     0,    0, -3.05), new THREE.Vector3(     0,    0,  3.05),
		new THREE.Vector3(  1.98,    0, -3.05), new THREE.Vector3(  1.98,    0,  3.05),
		new THREE.Vector3(  5.94,    0, -3.05), new THREE.Vector3(  5.94,    0,  3.05),
		new THREE.Vector3(  6.70,    0, -3.05), new THREE.Vector3(  6.70,    0,  3.05),
		new THREE.Vector3( -6.70,    0, -3.05), new THREE.Vector3(  6.70,    0, -3.05),
		new THREE.Vector3( -6.70,    0, -2.59), new THREE.Vector3(  6.70,    0, -2.59),
		new THREE.Vector3( -6.70,    0,     0), new THREE.Vector3( -1.98,    0,     0),
		new THREE.Vector3(  6.70,    0,     0), new THREE.Vector3(  1.98,    0,     0),
		new THREE.Vector3( -6.70,    0,  2.59), new THREE.Vector3(  6.70,    0,  2.59),
		new THREE.Vector3( -6.70,    0,  3.05), new THREE.Vector3(  6.70,    0,  3.05),
		new THREE.Vector3(     0,    0, -3.05), new THREE.Vector3(     0, 1.55, -3.05),
		new THREE.Vector3(     0,    0, -2.59), new THREE.Vector3(     0, 1.55, -2.59),
		new THREE.Vector3(     0,    0,  2.59), new THREE.Vector3(     0, 1.55,  2.59),
		new THREE.Vector3(     0,    0,  3.05), new THREE.Vector3(     0, 1.55,  3.05));
	for (var i = 0; i < geometry.vertices.length; i++)
		geometry.vertices[i].multiplyScalar(meter2unit);
	
	THREE.LineSegments.call(this, geometry, material);
	
	this.shuttle = null;
}

Court.prototype = Object.assign(Object.create(THREE.LineSegments.prototype), {

	constructor: Court,
	
	update: function (delta) {
		var position = this.shuttle.localToTarget(new THREE.Vector3(0, 0, 0), this);
		var lastPosition = this.shuttle.localToTarget(this.shuttle.velocity.clone().multiplyScalar(-this.shuttle.lastDelta), this);
		var positionDelta = lastPosition.clone().sub(position);
		var mul = -position.x / positionDelta.x;
		var netPosition = position.clone().addScaledVector(positionDelta, mul);
		if ((Math.abs(mul) <= 1 || mul * this.lastUpdateMul < 0) &&
			netPosition.y >= 0 &&
			netPosition.y <= this.parameters.meter2unit * 1.55 &&
			netPosition.z >= this.parameters.meter2unit * -3.05 &&
			netPosition.z <= this.parameters.meter2unit * 3.05) {
			this.shuttle.state = 'stop-net';
			this.shuttle.position.copy(this.localToTarget(netPosition.clone(), this.shuttle.parent));
		}
	},
	
	getArea: function () {
		return {
			xMin: this.parameters.meter2unit * -6.70,
			xMax: this.parameters.meter2unit * 6.70,
			zMin: this.parameters.meter2unit * -2.59,
			zMax: this.parameters.meter2unit * 2.59,
		};
	},
	
	getArea1: function () {
		return {
			xMin: this.parameters.meter2unit * -6.70,
			xMax: this.parameters.meter2unit * 0,
			zMin: this.parameters.meter2unit * -2.59,
			zMax: this.parameters.meter2unit * 2.59,
		};
	},
	
	getArea2: function () {
		return {
			xMin: this.parameters.meter2unit * 0,
			xMax: this.parameters.meter2unit * 6.70,
			zMin: this.parameters.meter2unit * -2.59,
			zMax: this.parameters.meter2unit * 2.59,
		};
	},
	
	getFirstArea1: function (score) {
		return (score % 2 === 1) ? {
			xMin: this.parameters.meter2unit * -6.70,
			xMax: this.parameters.meter2unit * -1.98,
			zMin: this.parameters.meter2unit * -2.59,
			zMax: this.parameters.meter2unit * 0,
		} : {
			xMin: this.parameters.meter2unit * -6.70,
			xMax: this.parameters.meter2unit * -1.98,
			zMin: this.parameters.meter2unit * 0,
			zMax: this.parameters.meter2unit * 2.59,
		};
	},
	
	getFirstArea2: function (score) {
		return (score % 2 === 1) ? {
			xMin: this.parameters.meter2unit * 1.98,
			xMax: this.parameters.meter2unit * 6.70,
			zMin: this.parameters.meter2unit * 0,
			zMax: this.parameters.meter2unit * 2.59,
		} : {
			xMin: this.parameters.meter2unit * 1.98,
			xMax: this.parameters.meter2unit * 6.70,
			zMin: this.parameters.meter2unit * -2.59,
			zMax: this.parameters.meter2unit * 0,
		};
	},
	
});

export { Court };