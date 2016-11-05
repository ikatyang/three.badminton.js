function CourtGeometry(shortLine, longLineSingle, longLineDouble, sidelineSingle, sidelineDouble, lineWidth) {
	
	THREE.Geometry.call(this);
	
	this.type = 'CourtGeometry';
	
	this.parameters = {
		shortLine: shortLine,
		longLineSingle: longLineSingle,
		longLineDouble: longLineDouble,
		sidelineSingle: sidelineSingle,
		sidelineDouble: sidelineDouble,
		lineWidth: lineWidth,
	};
	
	var verticalPlane = new THREE.PlaneGeometry(lineWidth, sidelineDouble * 2);
	var verticalPlaneXs = [shortLine + lineWidth / 2, longLineDouble - lineWidth / 2, longLineSingle - lineWidth / 2];
	for (var i = 0; i < verticalPlaneXs.length; i++) {
		for (var sign = -1; sign <= 1; sign += 2) {
			this.merge(verticalPlane, new THREE.Matrix4().compose(
				new THREE.Vector3(verticalPlaneXs[i] * sign, 0, 0),
				new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0, 'XYZ')),
				new THREE.Vector3(1, 1, 1)
			), 0);
		}
	}
	this.merge(verticalPlane, new THREE.Matrix4().compose(
		new THREE.Vector3(0, 0, 0),
		new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0, 'XYZ')),
		new THREE.Vector3(1, 1, 1)
	), 0);
	
	var horizontalPlane = new THREE.PlaneGeometry(longLineSingle * 2, lineWidth);
	var horizontalPlaneYs = [sidelineSingle - lineWidth / 2, sidelineDouble - lineWidth / 2];
	for (var i = 0; i < horizontalPlaneYs.length; i++) {
		for (var sign = -1; sign <= 1; sign += 2) {
			this.merge(horizontalPlane, new THREE.Matrix4().compose(
				new THREE.Vector3(0, horizontalPlaneYs[i] * sign, 0),
				new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0, 'XYZ')),
				new THREE.Vector3(1, 1, 1)
			), 0);
		}
	}
	
	var horizontalPlanePart = new THREE.PlaneGeometry(longLineSingle - shortLine, lineWidth);
	for (var sign = -1; sign <= 1; sign += 2) {
		this.merge(horizontalPlanePart, new THREE.Matrix4().compose(
			new THREE.Vector3((shortLine + longLineSingle) / 2 * sign, 0, 0),
			new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0, 'XYZ')),
			new THREE.Vector3(1, 1, 1)
		), 0);
	}
}

CourtGeometry.prototype = Object.create(THREE.Geometry.prototype);
CourtGeometry.prototype.constructor = CourtGeometry;

export { CourtGeometry };