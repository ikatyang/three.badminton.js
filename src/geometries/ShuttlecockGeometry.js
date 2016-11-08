function ShuttlecockGeometry(corkRadius, skirtRadius, beltHeight, skirtHeight, widthSegments, heightSegments, rachisRadius, rachisRatio, featherWidth, featherRatio, featherAngle, massRatio) {
	
	THREE.Geometry.call(this);
	
	this.type = 'ShuttlecockGeometry';
	
	var R = skirtRadius;
	var r = corkRadius;
	var h = skirtHeight;
	var b = beltHeight;
	
	var corkMassCenter = (5 * r * r + 12 * b * r + 6 * b * b) / (4 * (2 * r + 3 * b));
	var skirtMassCenter = (h / 4) * (r * r + 2 * R * r + 3 * R * R) / (r * r + R * r + R * R);
	
	var massCenter = (massRatio === undefined) ? corkRadius + beltHeight :
		(corkMassCenter * massRatio + skirtMassCenter) / (massRatio + 1);
	
	var corkAngle = Math.atan((R - r) / (b + h));
	var massToCorkTopLength = r / Math.tan(corkAngle);
	var massToCorkCenterLength = massCenter - corkMassCenter;
	
	var skirtCrossSectionalRadius = r + (R - r) * (skirtMassCenter / h);
	var skirtCrossSectionalArea = Math.PI * skirtCrossSectionalRadius * skirtCrossSectionalRadius;
	
	this.parameters = {
		corkRadius: corkRadius,
		skirtRadius: skirtRadius,
		beltHeight: beltHeight,
		skirtHeight: skirtHeight,
		widthSegments: widthSegments,
		heightSegments: heightSegments,
		rachisRadius: rachisRadius,
		rachisRatio: rachisRatio,
		featherWidth: featherWidth,
		featherRatio: featherRatio,
		featherAngle: featherAngle,
		massRatio: massRatio,
		massCenter: massCenter,
		corkMassCenter: corkMassCenter,
		skirtMassCenter: skirtMassCenter,
		corkAngle: corkAngle,
		massToCorkTopLength: massToCorkTopLength,
		massToCorkCenterLength: massToCorkCenterLength,
		skirtCrossSectionalArea: skirtCrossSectionalArea
	};
	
	var corkPositionY = -corkRadius + massCenter;
	var corkGeometry = new THREE.SphereGeometry(corkRadius, widthSegments, heightSegments, 0, Math.PI * 2, 0, Math.PI / 2);
	this.merge(corkGeometry, new THREE.Matrix4().compose(
		new THREE.Vector3(0, corkPositionY, 0),
		new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0, 'XYZ')),
		new THREE.Vector3(1, 1, 1)
	), 0);
	
	var beltPositionY = corkPositionY - beltHeight / 2;
	var beltGeometry = new THREE.CylinderGeometry(corkRadius, corkRadius, beltHeight, widthSegments, 1, true, 0, Math.PI * 2);
	this.merge(beltGeometry, new THREE.Matrix4().compose(
		new THREE.Vector3(0, beltPositionY, 0),
		new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0, 'XYZ')),
		new THREE.Vector3(1, 1, 1)
	), 1);
	
	var circlePositionY = beltPositionY - beltHeight / 2;
	var circleGeometry = new THREE.CircleGeometry(corkRadius, widthSegments, 0, Math.PI * 2);
	this.merge(circleGeometry, new THREE.Matrix4().compose(
		new THREE.Vector3(0, circlePositionY, 0),
		new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, -Math.PI / 2, 0, 'YXZ')),
		new THREE.Vector3(1, 1, 1)
	), 2);
	
	var corkInnerRadius = corkRadius - rachisRadius;
	
	var ringPositionY1 = circlePositionY - (skirtHeight * rachisRatio / (1 + rachisRatio));
	var ringRadius1 = corkInnerRadius + (skirtRadius - corkInnerRadius) * rachisRatio / (1 + rachisRatio);
	var ringGeometry1 = new THREE.TorusGeometry(ringRadius1, rachisRadius, heightSegments * 2, widthSegments, Math.PI * 2);
	this.merge(ringGeometry1, new THREE.Matrix4().compose(
		new THREE.Vector3(0, ringPositionY1, 0),
		new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, -Math.PI / 2, 0, 'YXZ')),
		new THREE.Vector3(1, 1, 1)
	), 3);
	
	var ringPositionY2 = (circlePositionY + ringPositionY1) / 2;
	var ringRadius2 = (corkInnerRadius + ringRadius1) / 2;
	var ringGeometry2 = new THREE.TorusGeometry(ringRadius2, rachisRadius, heightSegments * 2, widthSegments, Math.PI * 2);
	this.merge(ringGeometry2, new THREE.Matrix4().compose(
		new THREE.Vector3(0, ringPositionY2, 0),
		new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, -Math.PI / 2, 0, 'YXZ')),
		new THREE.Vector3(1, 1, 1)
	), 3);
	
	var rachisPositionRadius = (corkInnerRadius + skirtRadius) / 2;
	var rachisAngle = -Math.atan((skirtRadius - corkInnerRadius) / skirtHeight);
	var rachisHeight = skirtHeight / Math.cos(rachisAngle);
	var rachisPositionY = circlePositionY - (skirtHeight / 2);
	var rachisGeometry = new THREE.CylinderGeometry(rachisRadius, rachisRadius, rachisHeight, widthSegments, 1, false, 0, Math.PI * 2);
	for (var i = 0; i < rachisGeometry.faces.length; i++)
		rachisGeometry.faces[i].materialIndex = 0;
	
	var featherHeight = rachisHeight * (1 / (1 + rachisRatio));
	var featherGeometry = new THREE.Geometry();
	featherGeometry.vertices.push(
		new THREE.Vector3(0, 0, 0),
		new THREE.Vector3(featherWidth, -featherHeight * (featherRatio / (1 + featherRatio)), 0),
		new THREE.Vector3(-featherWidth, -featherHeight * (featherRatio / (1 + featherRatio)), 0),
		new THREE.Vector3(0, -featherHeight, 0)
	);
	featherGeometry.faces.push(
		new THREE.Face3(0, 2, 3),
		new THREE.Face3(0, 3, 1)
	);
	featherGeometry.faceVertexUvs[0].push(
		[new THREE.Vector2(0, 1), new THREE.Vector2(0, 0), new THREE.Vector2(1, 0)],
		[new THREE.Vector2(1, 1), new THREE.Vector2(0, 0), new THREE.Vector2(1, 0)]
	);
	featherGeometry.computeFaceNormals();
	featherGeometry.computeVertexNormals();
	
	for (var i = 0; i < widthSegments; i++) {
		var theta = Math.PI * 2 / widthSegments * i;
		var rachisPositionX = Math.sin(theta) * rachisPositionRadius;
		var rachisPositionZ = Math.cos(theta) * rachisPositionRadius;
		var rachisEuler = new THREE.Euler(rachisAngle, theta, 0, 'YXZ');
		this.merge(rachisGeometry, new THREE.Matrix4().compose(
			new THREE.Vector3(rachisPositionX, rachisPositionY, rachisPositionZ),
			new THREE.Quaternion().setFromEuler(rachisEuler),
			new THREE.Vector3(1, 1, 1)
		), 3);
		var featherPositionX = Math.sin(theta) * ringRadius1;
		var featherPositionZ = Math.cos(theta) * ringRadius1;
		var featherMatrix = new THREE.Matrix4().makeRotationFromEuler(rachisEuler)
			.multiply(new THREE.Matrix4().makeRotationY(featherAngle));
		this.merge(featherGeometry, new THREE.Matrix4().compose(
			new THREE.Vector3(featherPositionX, ringPositionY1, featherPositionZ),
			new THREE.Quaternion().setFromRotationMatrix(featherMatrix),
			new THREE.Vector3(1, 1, 1)
		), 4);
	}
}

ShuttlecockGeometry.prototype = Object.create(THREE.Geometry.prototype);
ShuttlecockGeometry.prototype.constructor = ShuttlecockGeometry;

export { ShuttlecockGeometry };