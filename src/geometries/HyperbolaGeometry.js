function HyperbolaGeometry(outerRadius, innerRadius, height, radiusSegments, heightSegments, openEnded, thetaStart, thetaLength){
	
	THREE.Geometry.call(this);
	
	this.type = 'HyperbolaGeometry';
	
	radiusSegments = (radiusSegments !== undefined) ? radiusSegments : 8;
	heightSegments = (heightSegments !== undefined) ? heightSegments : 8;
	openEnded = (openEnded !== undefined) ? openEnded : false;
	thetaStart = (thetaStart !== undefined) ? thetaStart : 0;
	thetaLength = (thetaLength !== undefined) ? thetaLength : 2 * Math.PI;
	
	this.parameters = {
		outerRadius: outerRadius,
		innerRadius: innerRadius,
		height: height,
		radiusSegments: radiusSegments,
		heightSegments: heightSegments,
		openEnded: openEnded,
		thetaStart: thetaStart,
		thetaLength: thetaLength,
	};
	
	var w = outerRadius * 2;
	var h = height;
	
	var a = innerRadius;
	var b = a * (h / 2) / Math.sqrt((w / 2) * (w / 2) - a * a);
	
	var heightDelta = height / heightSegments;
	var thetaDelta = thetaLength / radiusSegments;
	
	var uDelta = 1 / radiusSegments;
	var vDelta = 1 / heightSegments;
	
	var yMin = -h / 2;
	var yMax = h / 2;
	
	for (var i = 0, y = yMin, v = 0; i < heightSegments; i++, y += heightDelta, v += vDelta) {
	
		var vNext = v + vDelta;
		var yNext = y + heightDelta;
		
		var radius = a * Math.sqrt(y * y + b * b) / b;
		var radiusNext = a * Math.sqrt(yNext * yNext + b * b) / b;
		
		for (var j = 0, theta = thetaStart, u = 0; j < radiusSegments; j++, theta += thetaDelta, u += uDelta) {
			
			var uNext = u + uDelta;
			var thetaNext = theta + thetaDelta;
			var vertexIndex = this.vertices.length;
			
			this.vertices.push(
				new THREE.Vector3(Math.sin(theta)     * radius,     y,     Math.cos(theta)     * radius),
				new THREE.Vector3(Math.sin(thetaNext) * radius,     y,     Math.cos(thetaNext) * radius),
				new THREE.Vector3(Math.sin(theta)     * radiusNext, yNext, Math.cos(theta)     * radiusNext),
				new THREE.Vector3(Math.sin(thetaNext) * radiusNext, yNext, Math.cos(thetaNext) * radiusNext));
			
			this.faces.push(
				new THREE.Face3(vertexIndex + 0, vertexIndex + 3, vertexIndex + 2),
				new THREE.Face3(vertexIndex + 0, vertexIndex + 1, vertexIndex + 3));
			
			this.faceVertexUvs[0].push(
				[new THREE.Vector2(u, v), new THREE.Vector2(uNext, vNext), new THREE.Vector2(u,     vNext)],
				[new THREE.Vector2(u, v), new THREE.Vector2(uNext, v),     new THREE.Vector2(uNext, vNext)]);
		}
	}
	
	if (!openEnded) {
			
		for (var i = 0, theta = thetaStart; i < radiusSegments; i++, theta += thetaDelta) {
			
			var thetaNext = theta + thetaDelta;
			var vertexIndex = this.vertices.length;
			
			this.vertices.push(
				new THREE.Vector3(0, yMax, 0),
				new THREE.Vector3(Math.sin(theta)    * outerRadius, yMax, Math.cos(theta)     * outerRadius),
				new THREE.Vector3(Math.sin(thetaNext)* outerRadius, yMax, Math.cos(thetaNext) * outerRadius));
			
			this.faces.push(new THREE.Face3(vertexIndex + 0, vertexIndex + 1, vertexIndex + 2, null, null, 1));
			this.faceVertexUvs[0].push([
				new THREE.Vector2(0.5, 0.5),
				new THREE.Vector2(0.5 + Math.cos(theta)     * 0.5, 0.5 + Math.sin(theta)     * 0.5),
				new THREE.Vector2(0.5 + Math.cos(thetaNext) * 0.5, 0.5 + Math.sin(thetaNext) * 0.5)]);
			
			vertexIndex += 3;
			
			this.vertices.push(
				new THREE.Vector3(0, yMin, 0),
				new THREE.Vector3(Math.sin(theta)    * outerRadius, yMin, Math.cos(theta)     * outerRadius),
				new THREE.Vector3(Math.sin(thetaNext)* outerRadius, yMin, Math.cos(thetaNext) * outerRadius));
			
			this.faces.push(new THREE.Face3(vertexIndex + 0, vertexIndex + 2, vertexIndex + 1, null, null, 2));
			this.faceVertexUvs[0].push([
				new THREE.Vector2(0.5, 0.5),
				new THREE.Vector2(0.5 + Math.cos(thetaNext) * 0.5, 0.5 - Math.sin(thetaNext) * 0.5),
				new THREE.Vector2(0.5 + Math.cos(theta)     * 0.5, 0.5 - Math.sin(theta)     * 0.5)]);
		}
	}
	
	this.computeFaceNormals();
	this.computeVertexNormals();
}

HyperbolaGeometry.prototype = Object.create(THREE.Geometry.prototype);
HyperbolaGeometry.prototype.constructor = HyperbolaGeometry;

export { HyperbolaGeometry };