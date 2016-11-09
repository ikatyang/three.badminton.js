function RacketGeometry(width, height, tube, lineWidth, widthSegments, heightSegments, radialSegments, tubularSegments){
	
	THREE.Geometry.call(this);
	
	this.type = 'RacketGeometry';
	
	radialSegments = (radialSegments !== undefined) ? radialSegments : 16;
	tubularSegments = (tubularSegments !== undefined) ? tubularSegments : 16;
	
	this.parameters = {
		width: width,
		height: height,
		tube: tube,
		lineWidth: lineWidth,
		widthSegments: widthSegments,
		heightSegments: heightSegments,
		radialSegments: radialSegments,
		tubularSegments: tubularSegments,
	};
	
	var a = width / 2 - tube;
	var b = height / 2 - tube;
	var vertexCount = radialSegments * tubularSegments;
	
	for (var i = 0; i < radialSegments; i++) {
		
		for (var j = 0; j < tubularSegments; j++) {
			
			var u = i / tubularSegments * Math.PI * 2;
			var v = j / radialSegments * Math.PI * 2;
			
			var vertexIndex = this.vertices.length;
			
			this.vertices.push(new THREE.Vector3(
				(a + tube * Math.cos(v)) * Math.cos(u),
				(b + tube * Math.cos(v)) * Math.sin(u),
				tube * Math.sin(v)));
			
			var face0 = vertexIndex + 0;
			var face1 = vertexIndex + 1;
			
			if (j === tubularSegments - 1)
				face1 -= tubularSegments;
			
			var faceNext0 = (face0 + tubularSegments) % vertexCount;
			var faceNext1 = (face1 + tubularSegments) % vertexCount;
			
			this.faces.push(
				new THREE.Face3(face0, faceNext0, faceNext1),
				new THREE.Face3(face0, faceNext1, face1));
			
			// TODO
			this.faceVertexUvs[0].push(
				[new THREE.Vector2(0, 1), new THREE.Vector2(0, 0), new THREE.Vector2(1, 0)],
				[new THREE.Vector2(1, 1), new THREE.Vector2(0, 0), new THREE.Vector2(1, 0)]);
		}
	}
	
	var innerWidth = 2 * (a - tube);
	var innerWidthDelta = lineWidth + (innerWidth - lineWidth * (widthSegments - 1)) / widthSegments;
	
	for (var i = 0, x = -innerWidth / 2 - lineWidth / 2 + innerWidthDelta; i < widthSegments - 1; i++, x += innerWidthDelta) {
		
		var planeHeight = 2 * b * Math.sin(Math.acos(x / a));
		var verticalPlane = new THREE.PlaneGeometry(lineWidth, planeHeight);
		
		this.merge(verticalPlane, new THREE.Matrix4().compose(
			new THREE.Vector3(x, 0, 0),
			new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0, 'XYZ')),
			new THREE.Vector3(1, 1, 1)
		), 1);
	}
	
	var innerHeight = 2 * (b - tube);
	var innerHeightDelta = lineWidth + (innerHeight - lineWidth * (heightSegments - 1)) / heightSegments;
	
	for (var i = 0, y = -innerHeight / 2 - lineWidth / 2 + innerHeightDelta; i < heightSegments - 1; i++, y += innerHeightDelta) {
		
		var planeWidth = 2 * a * Math.cos(Math.asin(y / b));
		var horizontalPlane = new THREE.PlaneGeometry(planeWidth, lineWidth);
		
		this.merge(horizontalPlane, new THREE.Matrix4().compose(
			new THREE.Vector3(0, y, 0),
			new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0, 'XYZ')),
			new THREE.Vector3(1, 1, 1)
		), 1);
	}
	
	this.computeFaceNormals();
	this.computeVertexNormals();
}

RacketGeometry.prototype = Object.create(THREE.Geometry.prototype);
RacketGeometry.prototype.constructor = RacketGeometry;

export { RacketGeometry };