function ScoreboardGeometry(width, height, depth) {
	
	THREE.Geometry.call(this);
	
	this.type = 'ScoreboardGeometry';
	
	var planeAngle = Math.atan((depth / 2) / height);
	var planeHeight = Math.sqrt(Math.pow(depth / 2, 2) + Math.pow(height, 2));
	
	this.parameters = {
		width: width,
		height: height,
		depth: depth,
		planeAngle: planeAngle,
		planeHeight: planeHeight,
	};
	
	var frontboard = new THREE.PlaneGeometry(width, planeHeight);
	this.merge(frontboard, new THREE.Matrix4().compose(
		new THREE.Vector3(0, height / 2, depth / 4),
		new THREE.Quaternion().setFromEuler(new THREE.Euler(-planeAngle, 0, 0, 'XYZ')),
		new THREE.Vector3(1, 1, 1)
	), 0);
	
	var backboard = new THREE.PlaneGeometry(width, planeHeight);
	this.merge(backboard, new THREE.Matrix4().compose(
		new THREE.Vector3(0, height / 2, -depth / 4),
		new THREE.Quaternion().setFromEuler(new THREE.Euler(planeAngle, Math.PI, 0, 'XYZ')),
		new THREE.Vector3(1, 1, 1)
	), 1);
	
	var bottomboard = new THREE.PlaneGeometry(width, depth);
	this.merge(bottomboard, new THREE.Matrix4().compose(
		new THREE.Vector3(0, 0, 0),
		new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0, 'XYZ')),
		new THREE.Vector3(1, 1, 1)
	), 2);
}

ScoreboardGeometry.prototype = Object.create(THREE.Geometry.prototype);
ScoreboardGeometry.prototype.constructor = ScoreboardGeometry;

export { ScoreboardGeometry };