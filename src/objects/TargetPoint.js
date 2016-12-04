function TargetPoint(radius, tube, torusMaterial, arrowMaterial) {
	
	THREE.Object3D.call(this);
	
	this.parameters = {
		radius: radius,
		tube: tube,
	};
	
	var ring = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 16, 12), torusMaterial);
	ring.rotation.x = Math.PI / 2;
	
	this.add(ring);
	
	var geometry = new THREE.Geometry();
	geometry.vertices.push(
		new THREE.Vector3(-0.5, 2, 0),
		new THREE.Vector3(0.5, 2, 0),
		new THREE.Vector3(-0.5, 1, 0),
		new THREE.Vector3(0.5, 1, 0),
		new THREE.Vector3(-1, 1, 0),
		new THREE.Vector3(1, 1, 0),
		new THREE.Vector3(0, 0, 0));
	geometry.faces.push(
		new THREE.Face3(3, 0, 2),
		new THREE.Face3(3, 1, 0),
		new THREE.Face3(6, 5, 4));
	geometry.computeBoundingSphere();
	geometry.computeFaceNormals();
	geometry.computeVertexNormals();
	
	var arrow = new THREE.Mesh(geometry, arrowMaterial);
	arrow.scale.set(radius, radius, radius);
	arrow.position.y = radius * 1.5;
	this.add(arrow);
	
	this.ring = ring;
	this.arrow = arrow;
	
	this.arrowDir = -1;
	this.arrowMinY = radius;
	this.arrowMaxY = radius * 2;
	this.arrowSpeed = radius * 2;
}

TargetPoint.prototype = Object.assign(Object.create(THREE.Object3D.prototype), {

	constructor: TargetPoint,
	
	update: function (delta, camera) {
		this.lookAt(camera.position.clone().setY(this.localToWorld(new THREE.Vector3(0, 0, 0)).y));
		if (this.arrowDir > 0) {
			this.arrow.position.y += this.arrowSpeed * delta;
			if (this.arrow.position.y > this.arrowMaxY) {
				this.arrow.position.y = this.arrowMaxY;
				this.arrowDir *= -1;
			}
		} else {
			this.arrow.position.y -= this.arrowSpeed * delta;
			if (this.arrow.position.y < this.arrowMinY) {
				this.arrow.position.y = this.arrowMinY;
				this.arrowDir *= -1;
			}
		}
	},
	
});

export { TargetPoint };