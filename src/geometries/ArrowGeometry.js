function ArrowGeometry(width, height, widthRatio, heightRatio) {
	
	THREE.Geometry.call(this);
	
	this.type = 'ArrowGeometry';
	
	widthRatio = (widthRatio !== undefined) ? widthRatio : 1;
	heightRatio = (heightRatio !== undefined) ? heightRatio : 1;
	
	this.parameters = {
		width: width,
		height: height,
		widthRatio: widthRatio,
		heightRatio: heightRatio,
	};
	
	var halfWidth = width / 2;
	var halfHeight = height / 2;
	
	var topHeight = heightRatio / (heightRatio + 1) * height;
	var innerHalfWidth = 1 / (widthRatio + 1) * halfWidth;
	
	this.vertices.push(
		new THREE.Vector3(0, halfHeight, 0),
		new THREE.Vector3(-halfWidth, halfHeight - topHeight, 0),
		new THREE.Vector3(halfWidth, halfHeight - topHeight, 0),
		new THREE.Vector3(-innerHalfWidth, halfHeight - topHeight, 0),
		new THREE.Vector3(innerHalfWidth, halfHeight - topHeight, 0),
		new THREE.Vector3(-innerHalfWidth, -halfHeight, 0),
		new THREE.Vector3(innerHalfWidth, -halfHeight, 0));
		
	this.faces.push(
		new THREE.Face3(0, 1, 2),
		new THREE.Face3(6, 4, 3),
		new THREE.Face3(3, 5, 6));
	
	this.computeFaceNormals();
	this.computeVertexNormals();
}

ArrowGeometry.prototype = Object.create(THREE.Geometry.prototype);
ArrowGeometry.prototype.constructor = ArrowGeometry;

export { ArrowGeometry };