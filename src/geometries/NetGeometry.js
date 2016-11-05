function NetGeometry(width, height, outerTube, innerTube, widthSegments, heightSegments) {
	
	THREE.Geometry.call(this);
	
	this.type = 'NetGeometry';
	
	innerTube = (innerTube !== undefined) ? innerTube : outerTube;
	widthSegments = (widthSegments !== undefined) ? widthSegments : 1;
	heightSegments = (heightSegments !== undefined) ? heightSegments : 1;
	
	this.parameters = {
		width: width,
		height: height,
		outerTube: outerTube,
		innerTube: innerTube,
		widthSegments: widthSegments,
		heightSegments: heightSegments,
	};
	
	var outerVerticalPlane = new THREE.PlaneGeometry(outerTube, height);
	var outerHorizontalPlane = new THREE.PlaneGeometry(width, outerTube);
	
	this.merge(outerVerticalPlane, new THREE.Matrix4().compose(
		new THREE.Vector3(-width / 2 + outerTube / 2, 0, 0),
		new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0, 'XYZ')),
		new THREE.Vector3(1, 1, 1)
	), 0);
	
	this.merge(outerVerticalPlane, new THREE.Matrix4().compose(
		new THREE.Vector3(width / 2 - outerTube / 2, 0, 0),
		new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0, 'XYZ')),
		new THREE.Vector3(1, 1, 1)
	), 0);
	
	this.merge(outerHorizontalPlane, new THREE.Matrix4().compose(
		new THREE.Vector3(0, height / 2 - outerTube / 2 , 0),
		new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0, 'XYZ')),
		new THREE.Vector3(1, 1, 1)
	), 0);
	
	this.merge(outerHorizontalPlane, new THREE.Matrix4().compose(
		new THREE.Vector3(0, -height / 2 + outerTube / 2, 0),
		new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0, 'XYZ')),
		new THREE.Vector3(1, 1, 1)
	), 0);
	
	var innerVerticalPlane = new THREE.PlaneGeometry(innerTube, height);
	var innerHorizontalPlane = new THREE.PlaneGeometry(width, innerTube);
	
	var innerWidth = width - outerTube * 2;
	var innerWidthDelta = (innerWidth - innerTube * (widthSegments - 1)) / widthSegments;
	var innerVerticalX = -width / 2 + outerTube + innerWidthDelta + innerTube / 2;
	for (var i = 0; i < widthSegments - 1; i++, innerVerticalX += innerWidthDelta + innerTube) {
		this.merge(innerVerticalPlane, new THREE.Matrix4().compose(
			new THREE.Vector3(innerVerticalX, 0, 0),
			new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0, 'XYZ')),
			new THREE.Vector3(1, 1, 1)
		), 1);
	}
	
	var innerHeight = height - outerTube * 2;
	var innerHeightDelta = (innerHeight - innerTube * (heightSegments - 1)) / heightSegments;
	var innerVerticalY = -height / 2 + outerTube + innerHeightDelta + innerTube / 2;
	for (var i = 0; i < heightSegments - 1; i++, innerVerticalY += innerHeightDelta + innerTube) {
		this.merge(innerHorizontalPlane, new THREE.Matrix4().compose(
			new THREE.Vector3(0, innerVerticalY, 0),
			new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0, 'XYZ')),
			new THREE.Vector3(1, 1, 1)
		), 1);
	}
}

NetGeometry.prototype = Object.create(THREE.Geometry.prototype);
NetGeometry.prototype.constructor = NetGeometry;

export { NetGeometry };