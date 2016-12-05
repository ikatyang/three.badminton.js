(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.THREE = global.THREE || {}, global.THREE.Badminton = global.THREE.Badminton || {})));
}(this, (function (exports) { 'use strict';

window.performance = window.performance || Date;

if (THREE.Object3D.prototype.localToTarget === undefined) {
	THREE.Object3D.prototype.localToTarget = function (object, target, type) {
		if (object instanceof THREE.Vector3) {
			switch (type) {
				case 'direction':
					return this.localToTarget(object, target).sub(this.localToTarget(new THREE.Vector3(0, 0, 0), target));
				default:
					return target.worldToLocal(this.localToWorld(object));
			}
		} else if (object instanceof THREE.Box3) {
			var p1 = this.localToTarget(object.min.clone(), target);
			var p2 = this.localToTarget(object.max.clone(), target);
			return object.setFromPoints([p1, p2]);
		}
	}
}

if (THREE.Box3.prototype.setFromLocalObject === undefined) {
	THREE.Box3.prototype.setFromLocalObject = function (object) {
		var box = new THREE.Box3().setFromObject(object);
		var p1 = object.worldToLocal(box.min);
		var p2 = object.worldToLocal(box.max);
		return this.setFromPoints([p1, p2]);
	}
}

if (THREE.Box3.prototype.fromArray === undefined) {
	THREE.Box3.prototype.fromArray = function (array) {
		this.setFromArray(array);
		return this;
	}
}

if (THREE.Box3.prototype.toArray === undefined) {
	THREE.Box3.prototype.toArray = function () {
		return this.min.toArray().concat(this.max.toArray());
	}
}

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

var pixel_vertex_shader = "varying vec2 vUv;\r\nvoid main() {\r\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\r\n\tvUv = uv;\r\n}";

var pixel_fragment_shader = "uniform sampler2D texture;\r\nuniform vec2 size;\r\nuniform vec2 pixelSize;\r\nvarying vec2 vUv;\r\n\r\nvoid main() {\r\n\t\r\n\tvec2 pixelRatio = pixelSize / size;\r\n\tgl_FragColor = vec4(texture2D(texture, pixelRatio * floor(vUv / pixelRatio)).rgb, 1.0); \r\n}";

function PixelMaterial(parameters){
	
	var params = {};
	
	for (var key in parameters)
		params[key] = parameters[key];
	
	params.uniforms = {
		texture: {
			value: parameters.map
		},
		size: {
			value: parameters.size
		},
		pixelSize: {
			value: parameters.pixelSize
		},
	};
	
	params.vertexShader = pixel_vertex_shader;
	params.fragmentShader = pixel_fragment_shader;
	
	delete params.map;
	delete params.size;
	delete params.pixelSize;
	
	THREE.ShaderMaterial.call(this, params);
}

PixelMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
PixelMaterial.prototype.constructor = PixelMaterial;

var number_vertex_shader = "varying vec2 vUv;\r\nvoid main() {\r\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\r\n\tvUv = uv;\r\n}";

var number_fragment_shader = "varying vec2 vUv;\r\nuniform int numbers[NUMBER_COUNT];\r\nuniform vec2 boxMin;\r\nuniform vec2 boxMax;\r\nuniform vec2 lineSize;\r\nuniform vec3 numberColor;\r\nuniform vec3 backgroundColor;\r\nint getNum(int index) {\r\n\tfor (int i = 0; i < NUMBER_COUNT; i++)\r\n\t\tif (i == index)\r\n\t\t\treturn numbers[i];\r\n\treturn -1;\r\n}\r\nmat3 getMask(int num) {\r\n\tif (num == 0)\r\n\t\treturn mat3(1, 1, 1, 1, 1, 1, 0, 0, 0);\r\n\tif (num == 1)\r\n\t\treturn mat3(0, 0, 0, 0, 0, 0, 0, 1, 1);\r\n\tif (num == 2)\r\n\t\treturn mat3(1, 1, 0, 1, 1, 0, 1, 0, 0);\r\n\tif (num == 3)\r\n\t\treturn mat3(1, 1, 1, 1, 0, 0, 1, 0, 0);\r\n\tif (num == 4)\r\n\t\treturn mat3(0, 1, 1, 0, 0, 1, 1, 0, 0);\r\n\tif (num == 5)\r\n\t\treturn mat3(1, 0, 1, 1, 0, 1, 1, 0, 0);\r\n\tif (num == 6)\r\n\t\treturn mat3(1, 0, 1, 1, 1, 1, 1, 0, 0);\r\n\tif (num == 7)\r\n\t\treturn mat3(1, 1, 1, 0, 0, 0, 0, 0, 0);\r\n\tif (num == 8)\r\n\t\treturn mat3(1, 1, 1, 1, 1, 1, 1, 0, 0);\r\n\tif (num == 9)\r\n\t\treturn mat3(1, 1, 1, 1, 0, 1, 1, 0, 0);\r\n\treturn mat3(0);\r\n}\r\nbool isInside(vec2 start, vec2 size, float minX, float maxX, float minY, float maxY, vec2 line) {\r\n\treturn (vUv.x >= start.x + size.x * minX - line.x / 2.0 && vUv.x <= start.x + size.x * maxX + line.x / 2.0 &&\r\n\t\t\tvUv.y >= start.y + size.y * minY - line.y / 2.0 && vUv.y <= start.y + size.y * maxY + line.y / 2.0);\r\n}\r\nvoid main() {\r\n\t\r\n\tfloat width = 1.0 / float(NUMBER_COUNT);\r\n\tfloat numberIndex = floor(vUv.x / width);\r\n\t\r\n\tvec2 boxStart = vec2(width * numberIndex, 0.0);\r\n\tvec2 boxSize = vec2(width, 1.0);\r\n\t\r\n\tvec2 boxMid = (boxMin + boxMax) / 2.0;\r\n\tvec2 line = lineSize * boxSize;\r\n\t\r\n\tmat3 mask = getMask(getNum(int(numberIndex)));\r\n\t\r\n\tif ((mask[0][0] == 1.0 && isInside(boxStart, boxSize, boxMin.x, boxMax.x, boxMax.y, boxMax.y, line)) ||\r\n\t\t(mask[0][1] == 1.0 && isInside(boxStart, boxSize, boxMax.x, boxMax.x, boxMid.y, boxMax.y, line)) ||\r\n\t\t(mask[0][2] == 1.0 && isInside(boxStart, boxSize, boxMax.x, boxMax.x, boxMin.y, boxMid.y, line)) ||\r\n\t\t(mask[1][0] == 1.0 && isInside(boxStart, boxSize, boxMin.x, boxMax.x, boxMin.y, boxMin.y, line)) ||\r\n\t\t(mask[1][1] == 1.0 && isInside(boxStart, boxSize, boxMin.x, boxMin.x, boxMin.y, boxMid.y, line)) ||\r\n\t\t(mask[1][2] == 1.0 && isInside(boxStart, boxSize, boxMin.x, boxMin.x, boxMid.y, boxMax.y, line)) ||\r\n\t\t(mask[2][0] == 1.0 && isInside(boxStart, boxSize, boxMin.x, boxMax.x, boxMid.y, boxMid.y, line)) ||\r\n\t\t(mask[2][1] == 1.0 && isInside(boxStart, boxSize, boxMid.x, boxMid.x, boxMin.y, boxMid.y, line)) ||\r\n\t\t(mask[2][2] == 1.0 && isInside(boxStart, boxSize, boxMid.x, boxMid.x, boxMid.y, boxMax.y, line)))\r\n\t\tgl_FragColor = vec4(numberColor, 1.0);\r\n\telse\r\n\t\tgl_FragColor = vec4(backgroundColor, 1.0);\r\n}";

function NumberMaterial(parameters){
	
	parameters = parameters || {};
	
	var params = {};
	
	for (var key in parameters)
		params[key] = parameters[key];
	
	params.uniforms = {
		numbers: {},
		boxMin: {
			value: parameters.boxMin || new THREE.Vector2(0.2, 0.2)
		},
		boxMax: {
			value: parameters.boxMax || new THREE.Vector2(0.8, 0.8)
		},
		lineSize: {
			value: parameters.lineSize || new THREE.Vector2(0.1, 0.1)
		},
		numberColor: {
			value: (parameters.numberColor && new THREE.Color(parameters.numberColor)) || new THREE.Vector3(0, 0, 0)
		},
		backgroundColor: {
			value: (parameters.backgroundColor && new THREE.Color(parameters.backgroundColor)) || new THREE.Vector3(1, 1, 1)
		},
	};
	
	params.vertexShader = number_vertex_shader;
	
	if (parameters.number !== undefined)
		this.setNumber(parameters.number, params);
	else
		this.setNumbers(parameters.numbers, params);
	
	delete params.number;
	delete params.numbers;
	delete params.boxMin;
	delete params.boxMax;
	delete params.lineSize;
	delete params.numberColor;
	delete params.backgroundColor;
	
	THREE.ShaderMaterial.call(this, params);
}

NumberMaterial.prototype = Object.assign(Object.create(THREE.ShaderMaterial.prototype), {
	
	constructor: NumberMaterial,
	
	setNumber: function (number, params) {
		var temp = number;
		var numbers = [];
		do {
			numbers.unshift(temp % 10);
			temp = Math.floor(temp / 10);
		} while (temp > 0);
		this.setNumbers(numbers, params);
	},
	
	setNumbers: function (numbers, params) {
		params = params || this;
		params.uniforms.numbers.value = numbers;
		if (this.numberCount !== numbers.length) {
			this.numberCount = numbers.length;
			params.fragmentShader = '#define NUMBER_COUNT ' + this.numberCount + '\n' + number_fragment_shader;
			this.needsUpdate = true;
		}
	},
	
	getNumber: function () {
		var number = 0;
		var numbers = this.getNumbers();
		for (var i = 0; i < numbers.length; i++)
			number = number * 10 + numbers[i];
		return number;
	},
	
	getNumbers: function () {
		return this.uniforms.numbers.value;
	},
	
});

function Shuttlecock(shuttlecockGeometry, material, corkMass, skirtMass) {
	
	THREE.Object3D.call(this);
	
	this.parameters = {
		mass: corkMass + skirtMass,
		corkMass: corkMass,
		skirtMass: skirtMass,
	};
	
	var flipFrame = new THREE.Object3D();
	this.add(flipFrame);
	
	var mesh = new THREE.Mesh(shuttlecockGeometry, material);
	flipFrame.add(mesh);
	
	this.flipFrame = flipFrame;
	this.mesh = mesh;
	
	this.dragCoefficient = 0.44;
	
	this.airDensity = 1.1839;
	this.gravity = new THREE.Vector3(0, -9.8, 0);
	
	this.toppleAngularVelocity = Math.PI * 3;
	
	this.init();
}

Shuttlecock.prototype = Object.defineProperties(Object.assign(Object.create(THREE.Object3D.prototype), {

	constructor: Shuttlecock,
	
	getStates: function () {
		return this.state.split(' ');
	},
	
	hasState: function (state) {
		return (this.getStates().indexOf(state) !== -1);
	},
	
	addState: function (state) {
		if (!this.hasState(state))
			this.state += ' ' + state;
	},
	
	replaceState: function (pattern, replacement) {
		var states = this.getStates();
		var index = states.indexOf(pattern);
		if (index !== -1)
			states[index] = replacement;
		this.state = states.join(' ');
	},
	
	init: function () {
		
		this.state = 'active';
		this.flipFrame.rotation.set(0, 0, 0);
		this.velocity = new THREE.Vector3(0, 0, 0);
		
		this.flipAngle = 0;
		this.flipAngularVelocity = 0;
		this.flipAxis = new THREE.Vector3(0, 0, 0);
		
		this.lastDelta = 0;
		this.impactCount = 0;
	},
	
	getYAxis: function () {
		this.flipFrame.updateMatrixWorld();
		return this.flipFrame.localToTarget(new THREE.Vector3(0, 1, 0), this.parent, 'direction').normalize();
	},
	
	impact: function (velocity, normal, attenuation, isCount) {
	
		this.velocity.reflect(normal).multiplyScalar(1 - attenuation).add(velocity);
		var yAxis = this.getYAxis();
		
		this.updateActive(0);
		
		this.updateMatrixWorld();
		var flipAxis = this.parent.localToTarget(this.velocity.clone().cross(yAxis), this, 'direction').normalize();
		var flipAngle = this.velocity.angleTo(yAxis);
		
		this.flipAngle = flipAngle;
		this.flipAngularVelocity = 0;
		this.flipAxis = flipAxis;
		
		var flipMatrix = new THREE.Matrix4().makeRotationAxis(flipAxis, flipAngle);
		this.flipFrame.rotation.setFromRotationMatrix(flipMatrix);
		
		if (isCount !== false)
			this.impactCount++;
			
		this.onAfterImpact();
	},
	
	update: function (delta) {
		if (this.hasState('active'))
			this.updateActive(delta);
		else if (this.hasState('toppling'))
			this.updateToppling(delta);
		this.lastDelta = delta;
	},
	
	updateActive: function (delta) {
		
		var rho = this.airDensity;
		var S = this.geometry.parameters.skirtCrossSectionalArea;
		var C_D = this.dragCoefficient;
		var U = this.velocity.length();
		
		var F_D = rho * S * C_D * U * U / 2;
		
		var Fv = this.velocity.clone().normalize().multiplyScalar(-F_D);
		var force = this.gravity.clone().multiplyScalar(this.parameters.mass).add(Fv);
		
		this.velocity.addScaledVector(force, delta / this.parameters.mass);
		this.position.addScaledVector(this.velocity, delta);
		
		var xAxis = this.velocity.clone().cross(this.gravity).normalize();
		if (xAxis.length() > 0) {
			var yAxis = this.velocity.clone().normalize();
			var zAxis = xAxis.clone().cross(yAxis).normalize();
			var matrix = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
			this.rotation.setFromRotationMatrix(matrix);
		}
		
		if (delta > 0) {
			
			var flipParams = [this.flipAngle, this.flipAngularVelocity];
			this.solveODE(flipParams, this.flipDerivative, delta);
			this.flipAngle = flipParams[0];
			this.flipAngularVelocity = flipParams[1];
			
			if (Math.abs(this.flipAngle) < Math.PI) {
				var flipMatrix = new THREE.Matrix4().makeRotationAxis(this.flipAxis, this.flipAngle);
				this.flipFrame.rotation.setFromRotationMatrix(flipMatrix);
			} else {
				this.flipFrame.rotation.set(0, 0, 0);
			}
		}
		
		if (this.position.y < 0)
			this.replaceState('active', 'toppling');
	},
	
	updateToppling: function (delta) {
		
		this.rotation.setFromRotationMatrix(
			new THREE.Matrix4().makeRotationFromEuler(this.rotation).multiply(
				new THREE.Matrix4().makeRotationFromEuler(this.flipFrame.rotation)));
		this.flipFrame.rotation.set(0, 0, 0);
		this.flipAngle = 0;
		
		var yAxis = this.getYAxis();
		
		var velocityXZ = this.velocity.clone().setY(0).normalize();
		if (yAxis.clone().negate().angleTo(velocityXZ) > Math.PI / 2)
			velocityXZ.negate();
			
		var flipAxis = this.parent.localToTarget(yAxis.clone().negate().cross(velocityXZ), this, 'direction').normalize();
		var flipAngle = Math.min(this.toppleAngularVelocity * delta, 
			yAxis.clone().negate().angleTo(velocityXZ) - this.geometry.parameters.corkAngle);
		
		var flipMatrix = new THREE.Matrix4().makeRotationFromEuler(this.rotation);
		this.rotation.setFromRotationMatrix(flipMatrix.multiply(new THREE.Matrix4().makeRotationAxis(flipAxis, flipAngle)));
		
		this.position.y -= this.localToTarget(new THREE.Vector3(0, this.geometry.parameters.massToCorkTopLength, 0), this.parent).y;
		
		if (flipAngle < 1e-4)
			this.replaceState('toppling', 'toppled');
	},
	
	flipDerivative: function (params) {
		var phi = params[0];
		var phi_dot = params[1];
		var rho = this.airDensity;
		var C_D = this.dragCoefficient;
		var U = this.velocity.length();
		var M_B = this.parameters.skirtMass;
		var M_C = this.parameters.corkMass;
		var l_GC = this.geometry.parameters.massToCorkCenterLength;
		var S = this.geometry.parameters.skirtCrossSectionalArea;
		return [
			/* phi_dot     */ phi_dot,
			/* phi_dot_dot */ -(rho * S * C_D * U) / (2 * M_B * (1 + M_B / M_C)) * phi_dot - (rho * S * C_D * U * U) / (2 * (M_C + M_B) * l_GC) * Math.sin(phi)
		];
	},
	
	solveODE: function (params, derivative, dt) {
		// RK4
		var p_k1 = params.slice(0);
		var f_k1 = derivative.call(this, p_k1);
		
		var p_k2 = params.slice(0);
		for (var i = 0; i < params.length; i++)
			p_k2[i] += f_k1[i] * (dt / 2); 
		var f_k2 = derivative.call(this, p_k2);
		
		var p_k3 = params.slice(0);
		for (var i = 0; i < params.length; i++)
			p_k3[i] += f_k2[i] * (dt / 2); 
		var f_k3 = derivative.call(this, p_k3);
		
		var p_k4 = params.slice(0);
		for (var i = 0; i < params.length; i++)
			p_k4[i] += f_k3[i] * dt;
		var f_k4 = derivative.call(this, p_k4);
		
		for (var i = 0; i < params.length; i++) 
			params[i] += (f_k1[i] + 2 * f_k2[i] + 2 * f_k3[i] + f_k4[i]) / 6 * dt;
		return params;
	},
	
	copy: function (source) {
		
		THREE.Object3D.prototype.copy.call(this, source, false);
		
		this.state = source.state;
		
		this.flipFrame.rotation.copy(source.flipFrame.rotation);
		this.velocity.copy(source.velocity);
		
		this.flipAngle = source.flipAngle;
		this.flipAngularVelocity = source.flipAngularVelocity;
		this.flipAxis.copy(source.flipAxis);
		
		this.lastDelta = source.lastDelta;
		this.impactCount = source.impactCount;
		
		this.dragCoefficient = source.dragCoefficient;
		
		this.airDensity = source.airDensity;
		this.gravity.copy(source.gravity);
		
		this.toppleAngularVelocity = source.toppleAngularVelocity;
		
		return this;
	},
	
	clone: function () {
		return new this.constructor(this.geometry, this.material, this.parameters.corkMass, this.parameters.skirtMass).copy(this);
	},
	
	onAfterImpact: function () {},
	
}), {
	
	geometry: {
		get: function () {
			return this.mesh.geometry;
		},
		set: function (value) {
			this.mesh.geometry = value;
		},
	},
	
	material: {
		get: function () {
			return this.mesh.material;
		},
		set: function (value) {
			this.mesh.material = value;
		},
	},
	
});

function Robot(bodyMesh, racketMesh) {

	THREE.Object3D.call(this);
	
	var bodyBox = new THREE.Box3().setFromLocalObject(bodyMesh);
	var bodySize = bodyBox.getSize();
	var bodyCenter = bodyBox.getCenter();
	
	var racketBox = new THREE.Box3().setFromLocalObject(racketMesh);
	var racketSize = racketBox.getSize();
	var racketCenter = racketBox.getCenter();
	
	this.parameters = {
		bodySize: bodySize,
		bodyCenter: bodyCenter,
		racketSize: racketSize,
		racketCenter: racketCenter,
	};
	
	var body = bodyMesh.clone();
	body.position.set(-bodyCenter.x, -bodyCenter.y + bodySize.y / 2, -bodyCenter.z);
	this.add(body);
	
	function createLink(axes) {
	
		var link = new THREE.Object3D();
		var parent = link;
		
		for (var i = 0; i < axes.length; i++) {
			var axis = axes[i];
			var name = String.fromCharCode('A'.charCodeAt() + i);
			
			var frame = new THREE.Object3D();
			parent.add(frame);
			
			link['axis' + name] = axis;
			link['frame' + name] = frame;
			
			(function (frame, axis) {
				var _angle = 0;
				Object.defineProperty(link, 'angle' + name, {
					get: function () {
						return _angle;
					},
					set: function (angle) {
						_angle = angle;
						frame.quaternion.setFromAxisAngle(axis, angle);
					},
				});
			})(frame, axis);
			
			parent = frame;
		}
		
		var racket = racketMesh.clone();
		racket.position.set(-racketCenter.x, -racketCenter.y + racketSize.y / 2, -racketCenter.z);
		parent.add(racket);
		
		link.racket = racket;
		
		return link;
	}
	
	var topLink = createLink([
		new THREE.Vector3(1, 0, 0),
		new THREE.Vector3(-1, 0, 0),
	]);
	topLink.position.set(bodyCenter.x, bodyCenter.y + bodySize.y / 2, bodyCenter.z);
	body.add(topLink);
	
	var leftLink = createLink([
		new THREE.Vector3(0, -1, 0),
		new THREE.Vector3(-1, 0, 0),
	]);
	leftLink.rotation.z = -Math.PI / 2;
	leftLink.position.set(bodyCenter.x + bodySize.x / 2, bodyCenter.y, bodyCenter.z);
	body.add(leftLink);
	
	var rightLink = createLink([
		new THREE.Vector3(0, 1, 0),
		new THREE.Vector3(-1, 0, 0),
	]);
	rightLink.rotation.z = Math.PI / 2;
	rightLink.position.set(bodyCenter.x - bodySize.x / 2, bodyCenter.y, bodyCenter.z);
	body.add(rightLink);

	this.body = body;
	this.links = [
		this.topLink = topLink,
		this.leftLink = leftLink,
		this.rightLink = rightLink,
	];
	
	this.topImpactAngle = -Math.PI / 15;
	this.smashSpeed = Math.PI * 100;
	
	this.defaultImpactType = 'right';
	this.targetPosition = new THREE.Vector3(0, 0, 0);
	
	this.impactDelta = 1;
	
	this.responsibleArea = new THREE.Box3(
		new THREE.Vector3(0, 0, 0),
		new THREE.Vector3(0, 0, 0));
	
	this.shuttlecock = null;
	this.racketAttenuation = 0.9;
	
	this.bodySpeed = 1000;
	this.bodyAngularSpeed = Math.PI * 2;
	this.linkAngularSpeed = Math.PI * 2;
	
	this.netHeight = 1.55;
	this.netHeightDelta = 0.2;
	
	this.healthPercentRatio = 0.001;
	this.healthPercentMaxDecrease = 10;
	
	this.readyPosition = null;
	
	this.init();
}

Robot.prototype = Object.assign(Object.create(THREE.Object3D.prototype), {

	constructor: Robot,
	
	init: function () {
		this.impactType = this.defaultImpactType;
		this.impactCount = 0;
		this.impactElapsed = this.impactDelta;
		this.healthPercent = 100;
		this.topLink.angleA = this.topLink.angleB = 0;
		this.leftLink.angleA = this.leftLink.angleB = 0;
		this.rightLink.angleA = this.rightLink.angleB = 0;
	},
	
	setResponsibleArea: function (responsibleArea, resetPosition) {
		this.responsibleArea = responsibleArea;
		if (resetPosition)
			this.position.copy(responsibleArea.min.clone().add(responsibleArea.max).divideScalar(2));
	},
	
	predictFallingTime: function (y) {
		return (y - this.shuttlecock.position.y) / this.shuttlecock.velocity.y;
	},
	
	predictFallingPosition: function (y) {
		var time = this.predictFallingTime(y);		
		return (time < -1e-2) ? null : this.shuttlecock.position.clone().addScaledVector(this.shuttlecock.velocity, time).setY(y);
	},
	
	getRacketImpactLength: function () {
		return this.parameters.racketSize.y / 2 - this.parameters.racketCenter.y;
	},
	
	getRacketImpactPosition: function (link, impactAngle) {
		return link.localToTarget(new THREE.Vector3(0, this.getRacketImpactLength(), 0).applyAxisAngle(link.axisA, impactAngle), this);
	},
	
	getImpactParams: function () {
		switch (this.impactType) {
			case 'top':
				return this.getImpactParamsTop();
			case 'left':
				return this.getImpactParamsBottom(this.leftLink);
			case 'right':
				return this.getImpactParamsBottom(this.rightLink);
			case 'smash':
				return this.getImpactParamsSmash();
		}
	},
	
	getImpactParamsTop: function () {
		var link = this.topLink;
		var impactAngle = this.topImpactAngle;
		var racketImpactPosition = this.getRacketImpactPosition(link, impactAngle);
		var impactSpeed = this.getTopImpactSpeed(racketImpactPosition.y);
		var impactPosition = this.predictFallingPosition(racketImpactPosition.y);
		return {
			link: link,
			angle: impactAngle,
			speed: impactSpeed,
			position: impactPosition,
			racketPosition: racketImpactPosition,
		};
	},
	
	getImpactParamsBottom: function (link) {
		var racketImpactPosition = this.getRacketImpactPosition(link, 0);
		var impactAngleAndSpeed = this.getImpactAngleAndSpeed(racketImpactPosition.y);
		var impactAngle = impactAngleAndSpeed[0];
		var impactSpeed = impactAngleAndSpeed[1];
		var impactPosition = this.predictFallingPosition(racketImpactPosition.y);
		return {
			link: link,
			angle: impactAngle,
			speed: impactSpeed,
			position: impactPosition,
			racketPosition: racketImpactPosition,
		};
	},
	
	getImpactParamsSmash: function () {
		
		var p0 = this.targetPosition;
		var p1 = new THREE.Vector3(0, this.netHeight + this.netHeightDelta, 1);
		var p2 = new THREE.Vector3(0, this.netHeight + this.netHeightDelta, -1);
		var p0p1 = p1.clone().sub(p0);
		var p0p2 = p2.clone().sub(p0);
		var n = p0p1.clone().cross(p0p2);
		
		var l = this.shuttlecock.velocity;
		var l0 = this.shuttlecock.position;
		var d = p0.clone().sub(l0).dot(n) / l.clone().dot(n);
		var p = l.clone().multiplyScalar(d).add(l0);
		
		var link = this.topLink;
		var impactAngle = Math.PI / 2 - p.clone().sub(p0).angleTo(new THREE.Vector3(0, 1, 0));
		var impactSpeed = this.smashSpeed;
		var impactPosition = (d > -1e4) ? p : null;
		var racketImpactPosition = this.getRacketImpactPosition(link, impactAngle);
		
		return {
			link: link,
			angle: impactAngle,
			speed: impactSpeed,
			position: impactPosition,
			racketPosition: racketImpactPosition,
		};
	},
	
	update: function (delta) {
		
		this.onBeforeUpdate();
		
		var impactParams = this.getImpactParams();
		
		var link = impactParams.link;
		var impactSpeed = impactParams.speed;
		var impactPosition = impactParams.position;
		var racketImpactPosition = impactParams.racketPosition;
		
		for (var i = 0; i < this.links.length; i++)
			if (this.links[i] !== link)
				this.links[i].angleA = this.links[i].angleB = 0;
		
		var bodyAngle = 0;
		var impactAngle = 0;
		var rotationValue = 0;
		var robotPosition = this.readyPosition || this.responsibleArea.getCenter();
		
		if ((this.impactCount === 0 || this.impactCount + 2 === this.shuttlecock.impactCount + 1) &&
			this.shuttlecock.hasState('active') && impactPosition &&
			impactPosition.x >= this.responsibleArea.min.x &&
			impactPosition.x <= this.responsibleArea.max.x &&
			impactPosition.z >= this.responsibleArea.min.z &&
			impactPosition.z <= this.responsibleArea.max.z) {
			
			var bodyDirection = this.parent.localToTarget(this.targetPosition.clone().sub(impactPosition).setY(0), this, 'direction');
			bodyAngle = bodyDirection.angleTo(new THREE.Vector3(0, 0, 1)) * (bodyDirection.x < 0 ? -1 : 1);
			
			impactAngle = impactParams.angle;
			
			var racketPositionDelta = this.localToTarget(racketImpactPosition.clone(), this.parent, 'direction');
			robotPosition = impactPosition.clone().sub(racketPositionDelta);
			
			var fallingTime = this.predictFallingTime(racketImpactPosition.y);
			var impactTime = Math.PI / impactSpeed;
			
			rotationValue = (fallingTime < 0 || fallingTime > impactTime) ? 0 :
				(fallingTime < impactTime / 2) ? THREE.Math.clamp(fallingTime * impactSpeed, 0, Math.PI) :
				THREE.Math.clamp(Math.PI / 2 - (fallingTime - impactTime / 2) * impactSpeed, 0, Math.PI);
		}
		
		link.angleB = 0;
		link.updateMatrixWorld();
		
		this.impactElapsed += delta;
		if (this.checkIntersect(link.racket, this.shuttlecock) && this.impactElapsed > this.impactDelta) {
		
			var normal = link.racket.localToTarget(new THREE.Vector3(0, 0, 1), this.parent, 'direction');
			var strength = impactSpeed * this.getRacketImpactLength();
			
			this.shuttlecock.impact(normal.clone().multiplyScalar(strength), normal, this.racketAttenuation);
			
			this.impactCount = this.shuttlecock.impactCount;
			
			this.healthPercent = THREE.Math.clamp(this.healthPercent - Math.min(strength * this.healthPercentRatio, this.healthPercentMaxDecrease), 0, 100);
			
			this.impactElapsed = 0;
			
			this.onAfterImpact();
		}
		
		link.angleB = rotationValue;
		
		var attackAngleDeltaFull = impactAngle - link.angleA;
		var attackAngleDeltaPart = this.linkAngularSpeed * delta * (attackAngleDeltaFull < 0 ? -1 : 1);
		var attackAngleDelta = Math.abs(attackAngleDeltaFull) < Math.abs(attackAngleDeltaPart) ? attackAngleDeltaFull : attackAngleDeltaPart;
		link.angleA += attackAngleDelta;
		
		var positionDeltaFull = robotPosition.clone().sub(this.position);
		var positionDeltaPart = positionDeltaFull.clone().setLength(this.bodySpeed * delta * (this.healthPercent / 100));
		var positionDelta = positionDeltaFull.length() < positionDeltaPart.length() ? positionDeltaFull : positionDeltaPart;
		this.position.add(positionDelta);
		
		var bodyAngleDeltaFull = bodyAngle - this.body.rotation.y;
		var bodyAngleDeltaPart = this.bodyAngularSpeed * delta * (bodyAngleDeltaFull < 0 ? -1 : 1);
		var bodyAngleDelta = Math.abs(bodyAngleDeltaFull) < Math.abs(bodyAngleDeltaPart) ? bodyAngleDeltaFull : bodyAngleDeltaPart;
		this.body.rotation.y += bodyAngleDelta;
	},
	
	checkIntersect: function (racket, shuttlecock) {
			
		racket.updateMatrixWorld();
		shuttlecock.updateMatrixWorld();
		
		if (shuttlecock.geometry.boundingSphere === null)
			shuttlecock.geometry.computeBoundingSphere();
		
		if (racket.geometry.boundingBox === null)
			racket.geometry.computeBoundingBox();
			
		var box = racket.geometry.boundingBox;
		var sphere = shuttlecock.geometry.boundingSphere;
		
		var spherePosition = shuttlecock.localToTarget(sphere.center.clone(), this.parent);
		var lastSpherePosition = spherePosition.clone().addScaledVector(this.shuttlecock.velocity, -this.shuttlecock.lastDelta);
		
		this.parent.localToTarget(spherePosition, racket);
		this.parent.localToTarget(lastSpherePosition, racket);
		
		var isIntersect = false;
		
		var spherePositionDelta = lastSpherePosition.clone().sub(spherePosition);
		var mul = -spherePosition.z / spherePositionDelta.z;
		if (Math.abs(mul) <= 1 || mul * this.lastCheckMul < 0) {
			var circlePosition = spherePosition.clone().addScaledVector(spherePositionDelta, mul);
			isIntersect = this.checkIntersectRectAndCircle(box.clone().translate(circlePosition.clone().negate()), sphere.radius);
			this.lastCheckMul = mul;
		}
		return isIntersect;
	},
	
	checkIntersectRectAndCircle: function (r, rad) {
		if (r.max.x < 0) {
			// left
			if (r.max.y < 0) {
				// left-bottom
				return (r.max.x * r.max.x + r.max.y * r.max.y < rad * rad);
			} else if (r.min.y > 0) {
				// left-top
				return (r.max.x * r.max.x + r.min.y * r.min.y < rad * rad);
			} else {
				// left-center
				return (Math.abs(r.max.x) < rad);
			}
		} else if (r.min.x > 0) {
			// right
			if (r.max.y < 0) {
				// right-bottom
				return (r.min.x * r.min.x + r.max.y * r.max.y < rad * rad);
			} else if (r.min.y > 0) {
				// right-top
				return (r.min.x * r.min.x + r.min.y * r.min.y < rad * rad);
			} else {
				// right-center
				return (Math.abs(r.min.x) < rad);
			}
		} else {
			// center
			if (r.max.y < 0) {
				// center-bottom
				return (Math.abs(r.max.y) < rad);
			} else if (r.min.y > 0) {
				// center-top
				return (Math.abs(r.min.y) < rad);
			} else {
				// center-center
				return true;
			}
		}
	},
	
	getTopImpactSpeed: function (impactHeight) {
		var hit = this.shuttlecock.position.clone().setY(0);	//球現在的位置
		var move = this.targetPosition.clone().sub(hit);
		var x0 = move.clone().length();	//水平位移
		var index = Math.abs(hit.clone().distanceTo(move));	//擊球點到網子的距離(擊球方場地中的水平位移

		// 200->0, 300->1, 400->2, 500->3, 600->4, 670->5
		index = Math.ceil(index / 100) - 2;
		if(index < 0) index = 0;
		for( ; index < this.topForceTable.length; index++){
			if(this.topForceTable[index][0] > x0) break;	//找相應的水平位移
		}
		if(index !== 0) index--;
		return Math.PI * this.topForceTable[index][1];
	},
	
	getImpactAngleAndSpeed: function (impactHeight) {
		
		if (this.targetPosition.x * this.shuttlecock.position.x >= 0)
			return [0, 0];
		
		var offset = this.targetPosition.clone().sub(this.shuttlecock.position).setY(0);
		var hitDist = offset.clone().multiplyScalar(this.shuttlecock.position.x / offset.x).length();
		var targetDist = offset.length() - hitDist;
		
		var as = this.angleAndSpeed(hitDist, targetDist);
		var impactSpeed = as[0];
		var impactAngle = as[1];
		return [impactAngle, impactSpeed];
	},
	
	angleAndSpeed: function(hitDist, targetDist) {

		var ft = this.forceTable;
		var speed, angle;
		var tmpMin, tmpMax, nofound = false;
		var i, j, k;

		for(i = 0; i < ft.length; i++){
			if(ft[i][0] >= hitDist && i === 0){
				for(j = 1; j < ft[i].length; j++){
					if(ft[0][j][0] >= targetDist){
						return this.calculate(
							ft[0][j-1][0], ft[0][j][0],
							ft[0][j-1][1], ft[0][j][1],
							ft[0][j-1][2], ft[0][j][2],
							targetDist);
					}
				}
				return [ft[0][j-1][1], ft[0][j-1][2]];
			}
			else if(ft[i][0] >= hitDist){
				var index = i - 1;
				for(j = 1; j < ft[index].length; j++){
					if(ft[index][j][0] >= targetDist && j === 1){
						tmpMin = [ft[index][1][1], ft[index][1][2]];
					}
					else if(ft[index][j][0] >= targetDist){
						tmpMin = this.calculate(
							ft[index][j-1][0], ft[index][j][0],
							ft[index][j-1][1], ft[index][j][1],
							ft[index][j-1][2], ft[index][j][2],
							targetDist);
						break;
					}
				}
				if(j === ft[index].length){
					nofound = true;
					tmpMin = [ft[index][j-1][1], ft[index][j-1][2]];
				}

				for(k = 1; k < ft[i].length; k++){
					if(ft[i][k][0] >= targetDist && k === 1){
						tmpMax = [ft[i][1][1], ft[i][1][2]];
					}
					else if(ft[i][k][0] >= targetDist){
						tmpMax = this.calculate(
							ft[i][k-1][0], ft[i][k][0],
							ft[i][k-1][1], ft[i][k][1],
							ft[i][k-1][2], ft[i][k][2],
							targetDist);
						break;
					}
				}
				if(k === ft[i].length){
					return tmpMin;
				}
				else if(nofound){
					return tmpMax;
				}
				return this.calculate(
					ft[index][0], ft[i][0],	tmpMin[0], tmpMax[0],
					tmpMin[1], tmpMax[1], hitDist);
			}
		}
	},

	calculate: function(minD, maxD, minS, maxS, minA, maxA, targetDist){
		var percent = this.diff(minD, maxD, targetDist);
		var speed = (maxS - minS) * percent + minS;
		var angle = (maxA - minA) * percent + minA;
		return [speed, angle];
	},

	diff: function(min, max, point){
		return (point - min) / (max - min);
	},

	forceTable: [
		[
			50,
			[14, 23, 1.5],
			[18, 25, 1.5],
			[44, 25, 1.45],
			[55, 30, 1.45],
			[85, 30, 1.4],
		],
		[
			60,
			[ 42, 20, 1.4],
			[ 61, 20, 1.35],
			[ 83, 25, 1.35],
			[106, 25, 1.3],
			[130, 30, 1.3],
			[139, 30, 1.28],
		],
		[
			70,
			[ 31, 20, 1.4],
			[ 69, 20, 1.3],
			[ 96, 25, 1.3],
			[120, 30, 1.3],
			[144, 30, 1.25],
			[172, 30, 1.2],
		],
		[
			80,
			[ 41, 20, 1.35],
			[ 59, 20, 1.3],
			[ 76, 20, 1.25],
			[107, 25, 1.25],
			[127, 25, 1.2],
			[158, 30, 1.2],
			[185, 35, 1.2],
		],
		[
			90,
			[ 82, 20, 1.2],
			[117, 25, 1.2],
			[133, 25, 1.15],
			[168, 30, 1.15],
			[188, 30, 1.1],
			[220, 35, 1.1],
			[249, 40, 1.1],
			[270, 40, 1.05],
		],
		[
			100,
			[ 72, 20, 1.2],
			[107, 25, 1.2],
			[123, 25, 1.15],
			[158, 30, 1.15],
			[178, 30, 1.1],
			[210, 35, 1.1],
			[230, 35, 1.05],
			[247, 35, 1],
			[262, 35, 0.95],
			[297, 40, 0.95],
			[328, 45, 0.95],
			[356, 50, 0.95],
			[372, 50, 0.9],
			[400, 55, 0.9],
		],
		[
			200,
			[78, 30, 1.1],
			[94, 30, 1.05],
			[111, 30, 1],
			[124, 30, 0.95],
			[135, 30, 0.9],
			[144, 30, 0.85],
			[152, 30, 0.8],
			[196, 35, 0.8],
			[202, 35, 0.75],
			[208, 35, 0.7],
			[249, 40, 0.7],
			[252, 40, 0.65],
			[289, 45, 0.65],
			[290, 45, 0.6],
			[326, 50, 0.6],
			[359, 55, 0.6],
			[387, 60, 0.6],
			[390, 60, 0.55],
			[417, 65, 0.55],
			[443, 70, 0.55],
			[463, 75, 0.55],
			[487, 80, 0.55],
			[509, 85, 0.55],
			[527, 90, 0.55],
			[559, 100, 0.55],
			[592, 110, 0.55],
			[642, 130, 0.55],
		],
		[
			300,
			[ 75,  35, 0.9],
			[113,  40, 0.9],
			[124,  40, 0.85],
			[135,  40, 0.8],
			[142,  40, 0.75],
			[149,  40, 0.7],
			[185,  45, 0.7],
			[189,  45, 0.65],
			[223,  50, 0.65],
			[226,  50, 0.6],
			[259,  55, 0.6],
			[287,  60, 0.6],
			[290,  60, 0.55],
			[317,  65, 0.55],
			[343,  70, 0.55],
			[387,  80, 0.55],
			[426,  90, 0.55],
			[428,  90, 0.5],
			[462, 100, 0.5],
			[493, 110, 0.5],
			[521, 120, 0.5],
			[547, 130, 0.5],
			[568, 140, 0.5],
			[588, 150, 0.5],
			[608, 160, 0.5],
			[632, 175, 0.5],
			[634, 175, 0.45],
			[658, 190, 0.45],
		],
		[
			400,
			[ 48,  50, 0.97],
			[ 56,  50, 0.95],
			[ 72,  50, 0.9],
			[101,  50, 0.8],
			[118,  50, 0.7],
			[149,  55, 0.7],
			[159,  55, 0.6],
			[161,  55, 0.55],
			[190,  60, 0.55],
			[243,  70, 0.55],
			[287,  80, 0.55],
			[327,  90, 0.55],
			[359, 100, 0.55],
			[362, 100, 0.5],
			[392, 110, 0.5],
			[421, 120, 0.5],
			[447, 130, 0.5],
			[468, 140, 0.5],
			[488, 150, 0.5],
			[491, 150, 0.45],
			[510, 160, 0.45],
			[543, 180, 0.45],
			[570, 200, 0.45],
			[596, 220, 0.45],
			[616, 240, 0.45],
			[634, 260, 0.45],
			[649, 280, 0.45],
			[660, 300, 0.45],
			[662, 300, 0.4],
			[667, 310, 0.4],
		],
		[
			500,
			[ 42,  70, 0.95],
			[ 65,  70, 0.9],
			[ 99,  80, 0.9],
			[140,  80, 0.8],
			[167,  80, 0.7],
			[184,  80, 0.6],
			[187,  80, 0.5],
			[228,  90, 0.5],
			[262, 100, 0.5],
			[293, 110, 0.5],
			[321, 120, 0.5],
			[347, 130, 0.5],
			[368, 140, 0.5],
			[388, 150, 0.5],
			[391, 150, 0.45],
			[410, 160, 0.45],
			[443, 180, 0.45],
			[470, 200, 0.45],
			[496, 220, 0.45],
			[516, 240, 0.45],
			[534, 260, 0.45],
			[549, 280, 0.45],
			[560, 300, 0.45],
			[562, 300, 0.4],
			[579, 330, 0.4],
			[583, 340, 0.4],
			[589, 360, 0.4],
			[592, 370, 0.4],
			[595, 380, 0.4],
			[602, 400, 0.4],
		],
		[
			600,
			[ 49, 110, 0.95],
			[ 77, 110, 0.9],
			[126, 110, 0.8],
			[163, 110, 0.7],
			[186, 110, 0.6],
			[193, 110, 0.5],
			[221, 120, 0.5],
			[247, 130, 0.5],
			[288, 150, 0.5],
			[326, 170, 0.5],
			[367, 200, 0.5],
			[392, 220, 0.5],
			[421, 250, 0.5],
			[437, 270, 0.5],
			[443, 280, 0.5],
			[456, 300, 0.5],
			[462, 300, 0.4],
			[472, 320, 0.4],
			[479, 330, 0.4],
			[486, 350, 0.4],
			[495, 380, 0.4],
			[502, 400, 0.4],
		],
		[
			670,
			[ 43, 150, 0.95],
			[ 76, 150, 0.9],
			[137, 150, 0.8],
			[176, 150, 0.7],
			[206, 150, 0.6],
			[218, 150, 0.5],
			[256, 170, 0.5],
			[286, 190, 0.5],
			[297, 200, 0.5],
			[322, 220, 0.5],
			[341, 240, 0.5],
			[367, 270, 0.5],
			[386, 300, 0.5],
			[392, 300, 0.4],
			[409, 330, 0.4],
			[419, 360, 0.4],
			[432, 400, 0.4],
		]
	],

	topForceTable: [
		//水平距離, f
		[432.837, 12],	//200 start
		[508.317, 15],	//300 start
		[612.811, 20],	//400 start
		[697.075, 25],	//500 start
		[767.586, 30],
		[793.203, 32],	//600 start
		[829.480, 35],	//670 start
		[849.617, 37],
		[860.173, 38],	//200 end (870)
		[880.123, 40],
		[925.701, 45],
		[966.793, 50],	//300 end (970)
		[1002.280, 55],
		[1036.857, 60],
		[1064.451, 65],	//400 end (1070)
		[1091.885, 70],
		[1118.193, 75],
		[1140.245, 80],
		[1160.976, 85],	//500 end (1170)
		[1182.143, 90],
		[1200.124, 95],
		[1217.301, 100],
		[1233.056, 105],
		[1248.758, 110],
		[1261.102, 115],	//600 end (1270)
		[1274.775, 120],
		[1287.784, 125],
		[1298.189, 130],
		[1309.880, 135],
		[1321.354, 140],
		[1329.665, 145],
		[1333.054, 150],
	],

	topTableStart:[0, 1, 2, 3, 5, 6],	//和離網距離相應之最小力道在topForceTable中的index

	onAfterImpact: function () {},
	onBeforeUpdate: function () {},
	
});

function Court(courtGeometry, material) {
	
	THREE.Mesh.call(this, courtGeometry, material);
}

Court.prototype = Object.assign(Object.create(THREE.Mesh.prototype), {
	
	constructor: Court,
	
	inArea: function (name, point) {
		return this.getArea(name).containsPoint(point);
	},
	
	getArea: function (name) {
		return this['getArea' + name]();
	},
	
	getAreaAll: function () {
		return new THREE.Box3(
			new THREE.Vector3(-this.geometry.parameters.longLineSingle, -this.geometry.parameters.sidelineDouble, 0),
			new THREE.Vector3(this.geometry.parameters.longLineSingle, this.geometry.parameters.sidelineDouble, 0));
	},
	
	getAreaSingle: function () {
		return new THREE.Box3(
			new THREE.Vector3(-this.geometry.parameters.longLineSingle, -this.geometry.parameters.sidelineSingle, 0),
			new THREE.Vector3(this.geometry.parameters.longLineSingle, this.geometry.parameters.sidelineSingle, 0));
	},
	
	getAreaSingleA: function () {
		return new THREE.Box3(
			new THREE.Vector3(-this.geometry.parameters.longLineSingle, -this.geometry.parameters.sidelineSingle, 0),
			new THREE.Vector3(0, this.geometry.parameters.sidelineSingle, 0));
	},
	
	getAreaSingleFirstA: function () {
		return new THREE.Box3(
			new THREE.Vector3(-this.geometry.parameters.longLineSingle, -this.geometry.parameters.sidelineSingle, 0),
			new THREE.Vector3(-this.geometry.parameters.shortLine, this.geometry.parameters.sidelineSingle, 0));
	},
	
	getAreaSingleFirstLeftA: function () {
		return new THREE.Box3(
			new THREE.Vector3(-this.geometry.parameters.longLineSingle, 0, 0),
			new THREE.Vector3(-this.geometry.parameters.shortLine, this.geometry.parameters.sidelineSingle, 0));
	},
	
	getAreaSingleFirstRightA: function () {
		return new THREE.Box3(
			new THREE.Vector3(-this.geometry.parameters.longLineSingle, -this.geometry.parameters.sidelineSingle, 0),
			new THREE.Vector3(-this.geometry.parameters.shortLine, 0, 0));
	},
	
	getAreaSingleB: function () {
		return new THREE.Box3(
			new THREE.Vector3(0, -this.geometry.parameters.sidelineSingle, 0),
			new THREE.Vector3(this.geometry.parameters.longLineSingle, this.geometry.parameters.sidelineSingle, 0));
	},
	
	getAreaSingleFirstB: function () {
		return new THREE.Box3(
			new THREE.Vector3(this.geometry.parameters.shortLine, -this.geometry.parameters.sidelineSingle, 0),
			new THREE.Vector3(this.geometry.parameters.longLineSingle, this.geometry.parameters.sidelineSingle, 0));
	},
	
	getAreaSingleFirstLeftB: function () {
		return new THREE.Box3(
			new THREE.Vector3(this.geometry.parameters.shortLine, -this.geometry.parameters.sidelineSingle, 0),
			new THREE.Vector3(this.geometry.parameters.longLineSingle, 0, 0));
	},
	
	getAreaSingleFirstRightB: function () {
		return new THREE.Box3(
			new THREE.Vector3(this.geometry.parameters.shortLine, 0, 0),
			new THREE.Vector3(this.geometry.parameters.longLineSingle, this.geometry.parameters.sidelineSingle, 0));
	},
	
});

function ScoreboardCard(planeGeometry, numberMaterial) {

	THREE.Mesh.call(this, planeGeometry, numberMaterial);
}

ScoreboardCard.prototype = Object.defineProperties(Object.assign(Object.create(THREE.Mesh.prototype), {

	constructor: ScoreboardCard,
	
}), {
	
	number: {
		
		get: function () {
			return this.material.getNumber();
		},
		
		set: function (number) {
			this.material.setNumber(number);
		},
		
	},
	
});

function Scoreboard(scoreboardGeometry, material) {

	THREE.Mesh.call(this, scoreboardGeometry, material);
	
	this.actions = [];
	this.frontCards = [];
	this.backCards = [];
	this.transitionCards = [];
	
	this.speed = Math.PI * 2;
}

Scoreboard.prototype = Object.assign(Object.create(THREE.Mesh.prototype), {

	constructor: Scoreboard,
	
	init: function () {
		for (var i = 0; i < this.frontCards.length; i++) {
			this.frontCards[i].number = 0;
			this.transitionCards[i].number = this.backCards[i].number = 1;
			this.transitionCards[i].visible = false;
		}
	},
	
	addCard: function (width, height, position, numberMaterialParameters) {
		
		var parameters = {};
		for (var key in numberMaterialParameters)
			parameters[key] = numberMaterialParameters[key];
		parameters.number = parameters.number || 0;
		
		var frontCardFrame = new THREE.Object3D();
		frontCardFrame.position.set(position.x, this.geometry.parameters.height * 1.01, 0);
		frontCardFrame.rotation.set(Math.PI * 2 - this.geometry.parameters.planeAngle, 0, 0);
		this.add(frontCardFrame);
		
		var backCardFrame = frontCardFrame.clone();
		backCardFrame.rotation.x = this.geometry.parameters.planeAngle;
		this.add(backCardFrame);
		
		var transitionFrame = backCardFrame.clone();
		this.add(transitionFrame);
		
		var frontCard = new ScoreboardCard(
			new THREE.PlaneGeometry(width, height),
			new NumberMaterial(parameters));
		frontCard.position.set(0, -position.y - height / 2, 0);
		frontCardFrame.add(frontCard);
		this.frontCards.push(frontCard);
		
		parameters.number++;
		
		var backCard = new ScoreboardCard(
			new THREE.PlaneGeometry(width, height),
			new NumberMaterial(parameters));
		backCard.position.copy(frontCard.position);
		backCardFrame.add(backCard);
		this.backCards.push(backCard);
		
		var transitionCard = new ScoreboardCard(
			new THREE.PlaneGeometry(width, height),
			new NumberMaterial(parameters));
		transitionCard.position.copy(frontCard.position);
		transitionFrame.add(transitionCard);
		this.transitionCards.push(transitionCard);
		
		transitionCard.visible = false;
		
		this.actions.push(null);
	},
	
	addRings: function (ring, ringXs) {
		for (var i = 0; i < ringXs.length; i++) {
			var ringX = ringXs[i];
			var ringCloned = ring.clone();
			ringCloned.position.set(ringX, this.geometry.parameters.height, 0);
			this.add(ringCloned);
		}
	},
	
	setAction: function (index, number, direction) {
		var frontCard = this.frontCards[index];
		var backCard = this.backCards[index];
		var transitionCard = this.transitionCards[index];
		if (direction === 'next') {
			backCard.number = number + 1;
			transitionCard.number = number;
			transitionCard.parent.rotation.x = backCard.parent.rotation.x;
		} else {
			transitionCard.number = frontCard.number;
			transitionCard.parent.rotation.x = frontCard.parent.rotation.x;
			frontCard.number = number;
		}
		transitionCard.visible = true;
		this.actions[index] = {
			index: index,
			number: number,
			direction: direction,
		};
	},
	
	update: function (delta) {
		for (var i = 0; i < this.actions.length; i++)
			if (this.actions[i] !== null)
				this.updateCard(delta, this.actions[i]);
	},
	
	updateCard: function (delta, action) {
		var frontCard = this.frontCards[action.index];
		var backCard = this.backCards[action.index];
		var transitionCard = this.transitionCards[action.index];
		var targetCard = (action.direction === 'next') ? frontCard : backCard;
		
		var cardAngleDeltaFull = targetCard.parent.rotation.x - transitionCard.parent.rotation.x;
		var cardAngleDeltaPart = this.speed * delta * (cardAngleDeltaFull < 0 ? -1 : 1);
		var cardAngleDelta = Math.abs(cardAngleDeltaFull) < Math.abs(cardAngleDeltaPart) ? cardAngleDeltaFull : cardAngleDeltaPart;
		transitionCard.parent.rotation.x += cardAngleDelta;
		
		if (transitionCard.parent.rotation.x === targetCard.parent.rotation.x) {
			if (action.direction === 'next')
				frontCard.number = action.number;
			else
				backCard.number = transitionCard.number;
			transitionCard.visible = false;
			this.actions[action.index] = null;
		}
	},
	
});

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

function NetGroup(netMesh, postMesh) {
	
	THREE.Object3D.call(this);
	
	var netBox = new THREE.Box3().setFromLocalObject(netMesh);
	var netSize = netBox.getSize();
	var netCenter = netBox.getCenter();
	
	var postBox = new THREE.Box3().setFromLocalObject(postMesh);
	var postSize = postBox.getSize();
	var postCenter = postBox.getCenter();
	
	this.parameters = {
		netSize: netSize,
		netCenter: netCenter,
		postSize: postSize,
		postCenter: postCenter,
	};
	
	var net = netMesh.clone();
	net.position.set(-netCenter.x, -netCenter.y + postSize.y - netSize.y / 2, -netCenter.z);
	this.add(net);
	
	var postLeft = postMesh.clone();
	postLeft.position.set(-postCenter.z - postSize.z / 2 - netSize.x / 2, -postCenter.y + postSize.y / 2, -postCenter.x);
	postLeft.rotation.y = Math.PI / 2;
	this.add(postLeft);
	
	var postRight = postLeft.clone();
	postRight.position.x *= -1;
	postRight.rotation.y *= -1;
	this.add(postRight);
	
	this.net = net;
	this.postLeft = postLeft;
	this.postRight = postRight;
}

NetGroup.prototype = Object.assign(Object.create(THREE.Object3D.prototype), {
	
	constructor: NetGroup,
	
	checkCollision: function (shuttlecock) {
		
		var corkCenter = new THREE.Vector3(0, shuttlecock.geometry.parameters.massToCorkCenterLength, 0);
		var corkSphere = new THREE.Sphere(corkCenter, shuttlecock.geometry.parameters.corkRadius);
		
		var position = shuttlecock.localToTarget(corkCenter.clone(), shuttlecock.parent);
		var lastPosition = position.clone().addScaledVector(shuttlecock.velocity, -shuttlecock.lastDelta);
		
		shuttlecock.parent.localToTarget(position, this.net);
		shuttlecock.parent.localToTarget(lastPosition, this.net);
		
		if (position.z * lastPosition.z < 0) {
			
			var positionDelta = lastPosition.clone().sub(position);
			var ratio = -position.z / positionDelta.z;
			
			corkCenter.copy(position.clone().addScaledVector(positionDelta, ratio));
			
			var netBox = new THREE.Box3().setFromCenterAndSize(this.parameters.netCenter, this.parameters.netSize);
			if (netBox.intersectsSphere(corkSphere)) {
			
				shuttlecock.replaceState('active', 'hung');
				shuttlecock.position.copy(this.net.localToTarget(corkCenter.clone(), shuttlecock.parent));
				shuttlecock.flipFrame.rotation.set(0, 0, 0);
				
			} else if (corkCenter.y + corkSphere.radius < netBox.min.y) {
				
				shuttlecock.addState('under-net');
			}
		}
	},
	
});

function Game(firstPlayer) {
	
	this.init(firstPlayer);
}

Game.prototype = {

	constructor: Game,
	
	init: function (firstPlayer) {
		this.nthScore = 0;
		this.scoreA = 0;
		this.scoreB = 0;
		this.lastWinner = (firstPlayer !== undefined) ? firstPlayer : 'A';
	},
	
	nextScore: function (score) {
		this.nthScore = score || this.nthScore + 1;
	},
	
	getScore: function (player) {
		return this['score' + player];
	},
	
	setScore: function (player, score) {
		this['score' + player] = score;
	},
	
	getAnotherPlayer: function (player) {
		return (player === 'A') ? 'B' : 'A';
	},
	
	getToppledValidAreaName: function (firstPlayer, impactCount) {
		if (impactCount <= 1)
			return 'SingleFirst' + (this.getScore(firstPlayer) % 2 === 0 ? 'Right' : 'Left') + this.getAnotherPlayer(firstPlayer);
		else
			return 'Single' + (impactCount % 2 === 0 ? firstPlayer : this.getAnotherPlayer(firstPlayer));
	},
	
	initRobot: function (robot, court, player) {
		
		var isLastWinnerScoreEven = (this.getScore(this.lastWinner) % 2 === 0);
		var responsibleAreaName = 'SingleFirst' + (isLastWinnerScoreEven ? 'Right' : 'Left') + player;
		var responsibleArea = court.localToTarget(court.getArea(responsibleAreaName), robot.parent);
		
		robot.init();
		robot.setResponsibleArea(responsibleArea, true);
	},
	
	initShuttlecock: function (shuttlecock, initFunction) {
		
		shuttlecock.init();
		
		var initParameters = initFunction();
		for (var key in initParameters) {
		
			var value = initParameters[key];
			
			if (typeof value.copy === 'function')
				shuttlecock[key].copy(value);
			else
				shuttlecock[key] = value;
		}
			
		shuttlecock.updateActive(0);
	},
	
	checkScore: function (shuttlecock, court) {
		
		if (this.nthScore > this.scoreA + this.scoreB) {
			
			var isHung = shuttlecock.hasState('hung');
			var isToppled = shuttlecock.hasState('toppled');
			
			if (isHung || isToppled) {
				
				var isUnderNet = shuttlecock.hasState('under-net');
				var isSameHitter = (shuttlecock.impactCount % 2 === 1);
				
				var isSameWinner;
				
				if (isHung || (isToppled && isUnderNet)) {
					
					isSameWinner = !isSameHitter;
					
				} else {
					
					var validAreaName = this.getToppledValidAreaName(this.lastWinner, shuttlecock.impactCount);
					var validArea = court.getArea(validAreaName);
					
					var corkCenter = new THREE.Vector3(0, shuttlecock.geometry.parameters.massToCorkCenterLength, 0);
					var corkSphere = new THREE.Sphere(corkCenter, shuttlecock.geometry.parameters.corkRadius);
					
					shuttlecock.localToTarget(corkCenter, court).projectOnPlane(new THREE.Vector3(0, 0, 1));
					
					var isInValidArea = validArea.intersectsSphere(corkSphere);
					
					isSameWinner = (isInValidArea && isSameHitter) || (!isInValidArea && !isSameHitter);
				}
				
				var winner = isSameWinner ? this.lastWinner : this.getAnotherPlayer(this.lastWinner);
				var winnerScore = this.getScore(winner);
				
				this.setScore(winner, winnerScore + 1);
				this.lastWinner = winner;
					
				this.onScoreChange();
			}
		}
	},
	
	onScoreChange: function () {},
	
};

function Record(shuttlecock, robot1, robot2, data) {
	
	this.shuttlecock = shuttlecock;
	this.robot1 = robot1;
	this.robot2 = robot2;
	
	this.init(data);
}

Record.prototype = {

	constructor: Record,
	
	init: function (data) {
		
		this.counter = 0;
		this.playing = false;
		
		this.data = data || [];
		if (!data)
			this.record();
	},
	
	start: function (index) {
		if (index < 0)
			index = this.data.length - 1 + index;
		this.counter = THREE.Math.clamp(index || 0, 0, this.data.length - 1);
		if (this.counter < this.data.length) {
			this.setData(this.robot1, this.data[this.counter].robot1.init);
			this.setData(this.robot2, this.data[this.counter].robot2.init);
			this.setData(this.shuttlecock, this.data[this.counter].shuttlecock.init);
			this.next();
		}
	},
	
	next: function () {
		if (++this.counter < this.data.length) {
			this.setData(this.robot1, this.data[this.counter].robot1.play);
			this.setData(this.robot2, this.data[this.counter].robot2.play);
		}
		this.playing = (this.counter + 1 < this.data.length);
	},
	
	record: function () {
		this.data.push({
			robot1: {
				init: this.getData(this.robot1, this.KEYS_ROBOT_INIT),
				play: this.getData(this.robot1, this.KEYS_ROBOT_PLAY),
			},
			robot2: {
				init: this.getData(this.robot2, this.KEYS_ROBOT_INIT),
				play: this.getData(this.robot2, this.KEYS_ROBOT_PLAY),
			},
			shuttlecock: {
				init: this.getData(this.shuttlecock, this.KEYS_SHUTTLECOCK_INIT),
			},
		});
	},
	
	getValue: function (object) {
		switch (typeof object) {
			case 'object':
				if (typeof object.toArray === 'function')
					return object.toArray();
			default:
				return object;
		}
	},
	
	getData: function (object, keys) {
		var data = {};
		for (var i = 0; i < keys.length; i++) {
			var temp = object;
			var key = keys[i];
			key.split('.').forEach(function (name) {
				temp = temp[name];
			});
			data[key] = this.getValue(temp);
		}
		return data;
	},
	
	setData: function (object, data) {
		for (var key in data) {
			var temp = object;
			var value = data[key];
			key.split('.').forEach(function (name, index, array) {
				if (index < array.length - 1)
					temp = temp[name];
				else if (typeof temp[name].fromArray === 'function')
					temp[name].fromArray(value);
				else
					temp[name] = value;
			});
		}
	},
	
	KEYS_ROBOT_INIT: [
		'position',
		'rotation',
		'impactCount',
		'impactElapsed',
		'healthPercent',
		'body.rotation.y',
		'responsibleArea',
	],
	
	KEYS_ROBOT_PLAY: [
		'impactType',
		'targetPosition',
	],
	
	KEYS_SHUTTLECOCK_INIT: [
		'state',
		'position',
		'rotation',
		'velocity',
		'impactCount',
	],
	
};

exports.ShuttlecockGeometry = ShuttlecockGeometry;
exports.HyperbolaGeometry = HyperbolaGeometry;
exports.NetGeometry = NetGeometry;
exports.CourtGeometry = CourtGeometry;
exports.RacketGeometry = RacketGeometry;
exports.ScoreboardGeometry = ScoreboardGeometry;
exports.PixelMaterial = PixelMaterial;
exports.NumberMaterial = NumberMaterial;
exports.Shuttlecock = Shuttlecock;
exports.Robot = Robot;
exports.Court = Court;
exports.Scoreboard = Scoreboard;
exports.ScoreboardCard = ScoreboardCard;
exports.TargetPoint = TargetPoint;
exports.NetGroup = NetGroup;
exports.Game = Game;
exports.Record = Record;

Object.defineProperty(exports, '__esModule', { value: true });

})));