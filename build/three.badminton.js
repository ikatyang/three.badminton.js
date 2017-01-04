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
	
	this.toppleVelocity = 100;
	this.toppleAngularVelocity = Math.PI * 3;
	
	if (!this.mesh.geometry.boundingSphere)
		this.mesh.geometry.computeBoundingSphere();
	this.groundAttenuation = 0.8;
	this.groundElapsed = 0;
	this.groundElapsedDelta = 0.5;
	
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
	
	impact: function (velocity, normal, attenuation, isGround) {
	
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
		
		if (isGround !== true)
			this.impactCount++;
			
		this.onAfterImpact.apply(this, arguments);
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
		
			this.updateMatrixWorld();
			this.groundElapsed += delta;
			
			var centerY = this.mesh.localToTarget(this.mesh.geometry.boundingSphere.center.clone(), this.parent).y;
			var radius = this.mesh.geometry.boundingSphere.radius;
			
			if (centerY < radius) {
				
				if (this.groundElapsed > this.groundElapsedDelta) {
					this.groundElapsed = 0;
					this.impact(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), this.groundAttenuation, true);
				}
				
				if (centerY + this.velocity.y * this.groundElapsedDelta < radius)
					this.replaceState('active', 'toppling');
			}
		}
	},
	
	updateToppling: function (delta) {
		
		this.rotation.setFromRotationMatrix(
			new THREE.Matrix4().makeRotationFromEuler(this.rotation).multiply(
				new THREE.Matrix4().makeRotationFromEuler(this.flipFrame.rotation)));
		this.flipFrame.rotation.set(0, 0, 0);
		this.flipAngle = 0;
		
		var yAxis = new THREE.Vector3(0, 1, 0);
		var yAxisNew = this.parent.localToTarget(this.velocity.clone().setY(0).normalize().setY(-Math.tan(this.geometry.parameters.corkAngle)), this, 'direction').normalize();
		
		var flipAxis = yAxis.clone().cross(yAxisNew).normalize();
		var flipAngle = Math.min(this.toppleAngularVelocity * delta, yAxis.angleTo(yAxisNew));
		
		this.rotateOnAxis(flipAxis, flipAngle);
		
		var corkTopY = this.localToTarget(new THREE.Vector3(0, this.geometry.parameters.massToCorkTopLength, 0), this.parent).y;
		this.position.y -= Math.sign(corkTopY) * Math.min(Math.abs(corkTopY), this.toppleVelocity * delta);
		
		if (Math.abs(flipAngle) < 5e-2 && Math.abs(corkTopY) < 1e-1)
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
	
	this.healthPercentDecrease = function (strength) {
		return strength * 0.001;
	};
	this.healthPercentDecreaseMax = function () {
		return 10;
	};
	this.healthPercentIncrease = function (delta) {
		return delta * 1;
	};
	this.healthPercentIncreaseMax = function () {
		return (100 - this.healthPercent) * (2 / 3);
	};
	
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
		if (this.checkIntersect(link.racket, this.shuttlecock.mesh) && this.impactElapsed > this.impactDelta) {
		
			var normal = link.racket.localToTarget(new THREE.Vector3(0, 0, 1), this.parent, 'direction');
			var strength = impactSpeed * this.getRacketImpactLength();
			
			this.shuttlecock.impact(normal.clone().multiplyScalar(strength), normal, this.racketAttenuation);
			
			this.impactCount = this.shuttlecock.impactCount;
			
			this.healthPercent = THREE.Math.clamp(this.healthPercent - Math.min(this.healthPercentDecrease(strength), this.healthPercentDecreaseMax()), 0, 100);
			
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
		
		if (positionDelta.length() === 0)
			this.healthPercent = THREE.Math.clamp(this.healthPercent + Math.min(this.healthPercentIncrease(delta), this.healthPercentIncreaseMax()), 0, 100);
		
		var bodyAngleDeltaFull = bodyAngle - this.body.rotation.y;
		var bodyAngleDeltaPart = this.bodyAngularSpeed * delta * (bodyAngleDeltaFull < 0 ? -1 : 1);
		var bodyAngleDelta = Math.abs(bodyAngleDeltaFull) < Math.abs(bodyAngleDeltaPart) ? bodyAngleDeltaFull : bodyAngleDeltaPart;
		this.body.rotation.y += bodyAngleDelta;
	},
	
	checkIntersect: function (racket, shuttlecock) {
			
		racket.updateMatrixWorld();
		shuttlecock.updateMatrixWorld();
		
		if (racket.geometry.boundingBox === null)
			racket.geometry.computeBoundingBox();
			
		var box = racket.geometry.boundingBox;
		
		var boxPlane = box.clone();
		boxPlane.min.z = boxPlane.max.z = 0;
		
		var corkRadius = shuttlecock.geometry.parameters.corkRadius;
		var corkCenter = shuttlecock.localToTarget(new THREE.Vector3(0, shuttlecock.geometry.parameters.massCenter - corkRadius, 0), racket);
		var cork = new THREE.Sphere(corkCenter, corkRadius);
		
		if (boxPlane.intersectsSphere(cork))
			return true;
		
		if (shuttlecock.geometry.boundingSphere === null)
			shuttlecock.geometry.computeBoundingSphere();
			
		var sphere = shuttlecock.geometry.boundingSphere;
		
		var spherePosition = shuttlecock.localToTarget(sphere.center.clone(), this.parent);
		var lastSpherePosition = spherePosition.clone().addScaledVector(this.shuttlecock.velocity, -this.shuttlecock.lastDelta);
		
		this.parent.localToTarget(spherePosition, racket);
		this.parent.localToTarget(lastSpherePosition, racket);
		
		var isIntersect = false;
		if (spherePosition.z * lastSpherePosition.z <= 0) {
			var spherePositionDelta = lastSpherePosition.clone().sub(spherePosition);
			var mul = -spherePosition.z / spherePositionDelta.z;
			var circlePosition = spherePosition.clone().addScaledVector(spherePositionDelta, mul);
			isIntersect = this.checkIntersectRectAndCircle(box.clone().translate(circlePosition.clone().negate()), sphere.radius);
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
		var distance = Math.abs(hit.clone().distanceTo(move));	//擊球點到網子的距離(擊球方場地中的水平位移

		// 200 -> 0, 300 -> 1, 400 -> 2, 500 -> 3, 600 -> 4, 670 -> 5
		var index = Math.ceil(distance / 100) - 2;
		
		if (index < 0)
			index = 0;
		
		for (; index < this.topForceTable.length; index++)
			if (this.topForceTable[index][0] > x0)
				break;	//找相應的水平位移
			
		if (index === 0) {
			return Math.PI * this.topForceTable[index][1];
		} else {
			var min = this.topForceTable[index - 1][0];
			var max = this.topForceTable[index][0];
			var percent = this.diff(min, max, x0);
			var speedRange = this.topForceTable[index][1] - this.topForceTable[index - 1][1];
			return Math.PI * (this.topForceTable[index - 1][1] + speedRange * percent);
		}
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
		var tmpMin, tmpMax, nofound = false;
		var i, j, k;

		for(i = 0; i < ft.length; i++){
			if(ft[i][0] >= hitDist && i === 0){
				for(j = 1; j < ft[i].length; j++){
					for(k = 1; k < ft[i][j].length; k++){
						if(ft[i][j][k][0] >= targetDist && k === 1) return [ft[i][j][k][1], ft[i][j][0]];
						else if(ft[i][j][k][0] >= targetDist)
							return [this.calculate(
								ft[i][j][k-1][0], ft[i][j][k][0],
								ft[i][j][k-1][1], ft[i][j][k][1],
								targetDist), ft[i][j][0]];

					}
				}
				return [ft[i][j-1][ft[i][j-1].length-1][1], ft[i][j-1][0]];
			}
			else if(ft[i][0] >= hitDist){
				var minJ = ft[i-1].length;
				var maxJ = ft[i].length;
				var j1 = 1, j2 = 1;
				var k1, k2;
				var data1;
				var oldData;

				while(ft[i-1][j1][0] > ft[i][j2][0]) j1++;
				for( ; j1 < minJ && j2 < maxJ; j1++, j2++){
					for(k1 = 1; k1 < ft[i-1][j1].length; k1++){
						if(ft[i-1][j1][k1][0] >= targetDist && k1 === 1){
							data1 = [ft[i-1][j1][k1][1], ft[i-1][j1][0]];
							break;
						}
						else if(ft[i-1][j1][k1][0] >= targetDist){
							data1 = [this.calculate(
								ft[i-1][j1][k1-1][0], ft[i-1][j1][k1][0],
								ft[i-1][j1][k1-1][1], ft[i-1][j1][k1][1],
								targetDist), ft[i-1][j1][0]];
							break;
						}
					}
					for(k2 = 1; k2 < ft[i][j2].length; k2++){
						if(ft[i][j2][k2][0] >= targetDist && k2 === 1){
							if(data1 === undefined){
								oldData = [ft[i][j2][k2][1], ft[i][j2][0]];
								break;
							}
							else {
								return [this.calculate(
									ft[i-1][0], ft[i][0],
									data1[0], ft[i][j2][k2][1],
									targetDist), data1[1]];
							}
						}
						else if(ft[i][j2][k2][0] >= targetDist){
							var data2 = this.calculate(
								ft[i][j2][k2-1][0], ft[i][j2][k2][0],
								ft[i][j2][k2-1][1], ft[i][j2][k2][1],
								targetDist);
							if(data1 === undefined){
								oldData = [data2, ft[i][j2][0]];
								break;
							}
							else
								return [this.calculate(
									ft[i-1][0], ft[i][0],
									data1[0], data2,
									hitDist), data1[1]];
							
						}
					}
					if(data1 !== undefined){
						oldData = data1;
						data1 = undefined;
					}

				}
				var len = ft[i].length - 1;
				var lenK = ft[i][len].length - 1;
				return oldData ? oldData : [ft[i][len][lenK][1], ft[i][len][0]];
			}

		}
		var jMax = ft[i-1].length - 1;
		var kMax = ft[i-1][jMax].length - 1;
		return [ft[i-1][jMax][kMax][1], ft[i-1][jMax][0]];

	},

	calculate: function(minD, maxD, minS, maxS, targetDist){
		var percent = this.diff(minD, maxD, targetDist);
		var speed = minS * (1 - percent) + maxS * percent;
		return speed;
	},

	diff: function(min, max, point){
		return (point - min) / (max - min);
	},

	forceTable: [
		[
			50,
			[
				1.43,
				[43.42, 20], [70.19, 30], [91.41, 40], [107.47, 50],
			],
			[
				1.4,
				[ 55.65, 20], [ 88.51, 30], [113.96, 40], [133.25, 50],
				[148.81, 60], [161.05, 70],
			],
		],
		///////////////////////////////////////////////////
		[
			100,
			[
				1.4,
				[38.51, 30], [63.96, 40], [83.25, 50], [98.81, 60],
			],
			[
				1.3,
				[ 45.31, 20], [95.07, 30], [133.89, 40], [163.39, 50],
				[185.91, 60],
			],
			[
				1.2,
				[ 79.30, 20], [144.44, 30], [194.13, 40], [233.14, 50],
				[262.99, 60],
			],
			[
				1.1,
				[108.26, 20], [185.34, 30], [245.82, 40], [292.09, 50],
				[328.79, 60],
			],
			[
				1,
				[216.99, 30], [287.38, 40], [341.44, 50], [384.46, 60],
				[419.77, 70], [450.58, 80], [476.44, 90], [498.25, 100],
			],
			[
				0.9,
				[318.21, 40], [379.59, 50], [428.26, 60], [468.87, 70],
				[502.53, 80], [532.33, 90], [557.45, 100], [580.05, 110], 
			],
		],
		///////////////////////////////////////////////////
		[
			200,
			[
				1.2,
				[ 44.44, 30], [ 94.13, 40], [133.14, 50], [163.81, 60],
				[189.01, 70], [209.24, 80],
			],
			[
				1.1,
				[ 85.34, 30], [145.82, 40], [192.09, 50], [229.86, 60],
				[261.00, 70], [286.02, 80], [307.82, 90], [327.16, 100],
			],
			[
				1,
				[116.99, 30], [187.38, 40], [241.44, 50], [284.19, 60],
				[321.01, 70], [350.58, 80], [376.44, 90], [398.25, 100],
			],
			[
				0.9,
				[143.63, 30], [218.22, 40], [279.59, 50], [328.26, 60],
				[368.62, 70], [402.53, 80], [432.33, 90], [457.45, 100],
			],
			[
				0.8,
				[158.26, 30], [240.35, 40], [306.23, 50], [360.50, 60],
				[405.40, 70], [443.36, 80], [474.98, 90], [503.30, 100],
			],
			[
				0.7,
				[251.39,  40], [322.86,  50], [379.58,  60], [429.38, 70],
				[471.02,  80], [505.89,  90], [537.25, 100], [563.52, 110],
				[589.46, 120], [611.24, 130],
			],
			[
				0.6,
				[256.65,  40], [333.25,  50], [390.98,  60], [444.93, 70],
				[487.23,  80], [525.14,  90], [559.35, 100], [587.90, 110],
				[613.94, 120], [637.81, 130], [659.78, 140], [677.87, 150],
			],
			[
				0.5,
				[389.42,  60], [443.85,  70], [489.17,  80], [530.00, 90],
				[563.83, 100], [594.63, 110], [622.84, 120], [648.79, 130],
				[669.90, 140], [692.18, 150], [710.19, 160], [726.92, 170],
			],
		],
		///////////////////////////////////////////////////
		[
			300,
			[
				1.1,
				[ 45.82, 40], [ 92.09, 50], [129.86,  60], [161, 70],
				[186.02, 80], [207.82, 90], [227.16, 100],
			],
			[
				1,
				[ 85.77, 40], [141.44, 50], [184.18,  60], [221.00,  70],
				[250.58, 80], [276.44, 90], [298.25, 100], [317.83, 110],
			],
			[
				0.9,
				[118.21, 40], [179.58, 50], [228.25, 60], [268.62, 70],
				[302.53, 80], [332.33, 90], [357.45, 100], [380.05, 110],
			],
			[
				0.8,
				[140.35,  40], [208.40,  50], [260.23,  60], [305.40, 70],
				[343.36,  80], [374.98,  90], [403.30, 100], [428.87, 110],
				[450.42, 120], [471.66, 130], [488.09, 140], [504.67, 150],
			],
			[
				0.7,
				[154.20,  40], [225.48,  50], [282.08,  60], [331.71, 70],
				[373.22,  80], [407.99,  90], [439.25, 100], [465.46, 100],
				[463.52, 110], [489.46, 120], [511.24, 130], [529.36, 140],
				[547.87, 150], [564.98, 160], [579.14, 170], [592.27, 180],
				[604.48, 190], [615.85, 200],
			],
			[
				0.6,
				[156.64,  40], [233.25,  50], [290.98,  60], [344.93, 70],
				[387.23,  80], [425.14,  90], [459.35, 100], [487.90, 110],
				[513.94, 120], [537.81, 130], [559.78, 140], [577.87, 150],
				[594.58, 160], [612.19, 170], [626.54, 180], [639.90, 190],
				[652.37, 200], [662.04, 210],
			],
			[
				0.5,
				[228.18,  50], [289.42,  60], [343.85,  70], [389.17, 80],
				[430.00,  90], [463.83, 100], [494.64, 110], [522.84, 120],
				[548.79, 130], [569.89, 140], [592.18, 150], [610.19, 160],
				[626.92, 170], [642.50, 180], [657.04, 190], [670.62, 200],
				[683.34, 210], [692.82, 220],
			],
		],
		///////////////////////////////////////////////////
		[
			400,
			[
				1,
				[84.19, 60], [121.00, 70], [151.71, 80], [176.44, 90],
			],
			[
				0.9,
				[ 79.59, 50], [128.26,  60], [168.62, 70], [203.97, 80],
				[232.33, 90], [257.45, 100],
			],
			[
				0.8,
				[108.40, 50], [160.23,  60], [205.40,  70], [243.14,  80],
				[274.98, 90], [303.30, 100], [328.87, 110], [350.42, 120],
			],
			[
				0.7,
				[125.49,  50], [182.09,  60], [231.71,  70], [273.22,  80],
				[305.89,  90], [337.25, 100], [363.52, 110], [389.46, 120],
				[411.24, 130], [429.36, 140],
			],
			[
				0.6,
				[133.25,  50], [190.98,  60], [244.93,  70], [287.23,  80],
				[325.14,  90], [359.35, 100], [387.89, 110], [413.94, 120],
				[437.81, 130], [459.78, 140], [477.87, 150], [494.58, 160],
				[512.19, 170], [526.54, 180],
			],
			[
				0.5,
				[189.42,  60], [243.85,  70], [289.16,  80], [329.99,  90],
				[363.83, 100], [394.64, 110], [422.84, 120], [448.79, 130],
				[469.90, 140], [492.18, 150], [510.19, 160], [526.92, 170],
				[542.50, 180], [557.04, 190], [570.62, 200], [583.34, 210],
				[592.82, 220], [604.05, 230], [612.20, 240], [622.16, 250],
				[631.52, 260], [638.02, 270], [644.03, 280], [651.90, 290],
			],
			[
				0.4,
				[230.95,  70], [279.01,  80], [318.59,  90], [354.57, 100],
				[387.50, 110], [417.77, 120], [442.11, 130], [468.12, 140],
				[488.87, 150], [508.13, 160], [526.08, 170], [542.83, 180],
				[558.51, 190], [570.00, 200], [583.84, 210], [296.85, 220],
				[606.00, 230], [617.58, 240], [625.47, 250], [635.80, 260],
				[642.59, 270], [648.87, 280], [657.65, 290], [663.02, 300],
				[667.96, 310], [675.42, 320], [679.59, 330], [683.39, 340],
			],
		],
		///////////////////////////////////////////////////
		[
			500,
			[
				0.9,
				[ 68.87,  70], [102.53,  80], [132.33,  90], [157.45, 100],
				[180.05, 110], [200.51, 120], [217.87, 130], [233.74, 140],
				[248.31, 150], [260.61, 160],
			],
			[
				0.8,
				[105.64,  70], [143.36,  80], [174.98,  90], [203.30, 100],
				[228.87, 110], [250.42, 120], [271.66, 130], [288.09, 140],
				[304.67, 150], [319.96, 160], [332.74, 170], [345.92, 180],
				[356.88, 190], [367.07, 200], [376.57, 210], [385.42, 220],
			],
			[
				0.7,
				[ 79.58,  60], [129.38,  70], [171.02,  80], [205.89,  90],
				[237.25, 100], [263.52, 110], [289.46, 120], [311.24, 130],
				[329.36, 140], [347.87, 150], [364.98, 160], [379.14, 170],
				[392.27, 180], [404.48, 190], [415.85, 200], [426.45, 210],
				[436.36, 220], [445.62, 230], [454.28, 240], [460.91, 250],
				[468.53, 260], [474.23, 270], [480.94, 280], [485.81, 290],
				[491.71, 300], [495.85, 310],
			],
			[
				0.6,
				[142.10,  70], [187.23,  80], [225.14,  90], [259.35, 100],
				[287.90, 110], [313.94, 120], [337.81, 130], [359.78, 140],
				[377.87, 150], [394.58, 160], [412.19, 170], [426.54, 180],
				[439.90, 190], [452.37, 200], [462.05, 210], [472.97, 220],
				[483.21, 230], [492.79, 240], [499.94, 250], [508.40, 260],
				[514.54, 270], [522.03, 280], [527.28, 290], [533.89, 300],
				[538.36, 310], [542.46, 320], [547.94, 330], [551.37, 340],
			],
			[
				0.5,
				[140.39,  70], [189.17,  80], [230.00,  90], [263.83, 100],
				[294.64, 110], [322.84, 120], [348.79, 130], [369.90, 140],
				[392.18, 150], [410.19, 160], [426.92, 170], [442.5 , 180],
				[457.04, 190], [470.62, 200], [483.34, 210], [492.82, 220],
				[540.05, 230], [512.20, 240], [522.16, 250], [531.51, 260],
				[538.02, 270], [544.03, 280], [551.90, 290], [557.04, 300],
				[564.03, 310], [568.38, 320], [572.36, 330], [576.00, 340],
			],
			[
				0.4,
				[179.01,  80], [218.59,  90], [254.57, 100], [287.50, 110],
				[317.77, 120], [342.11, 130], [368.12, 140], [388.87, 150],
				[408.13, 160], [426.08, 170], [442.83, 180], [458.51, 190],
				[470.00, 200], [483.84, 210], [496.85, 220], [506.00, 230],
				[517.58, 240], [525.47, 250], [535.80, 260], [542.59, 270],
				[548.87, 280], [557.65, 290], [563.02, 300], [567.96, 310],
				[575.42, 320], [579.59, 330], [583.39, 340], [586.84, 350],
			],
		],
		///////////////////////////////////////////////////
		[
			600,
			[
				0.9,
				[57.45, 100], [80.05, 110], [100.51, 120], [117.87, 130],
			],
			[
				0.8,
				[ 70.98,  90], [103.3,  100], [128.87, 110], [150.42, 120],
				[171.66, 130], [188.09, 140],
			],
			[
				0.7,
				[ 73.22,  80], [105.89,  90], [137.25, 100], [163.52, 110],
				[189.46, 120], [211.24, 130], [229.36, 140], [247.87, 150],
				[264.98, 160], [279.14, 170], [292.27, 180], [304.48, 190],
			],
			[
				0.6,
				[ 87.23,  80], [125.14,  90], [159.35, 100], [187.90, 110],
				[213.94, 120], [237.81, 130], [259.78, 140], [277.87, 150],
				[294.58, 160], [312.19, 170], [326.54, 180], [339.90, 190],
				[352.37, 200], [362.05, 210], [372.97, 220], [383.21, 230],
			],
			[
				0.5,
				[126.79,  90], [163.83, 100], [194.64, 110], [222.84, 120],
				[248.79, 130], [262.90, 140], [292.18, 150], [310.19, 160],
				[326.92, 170], [342.50, 180], [357.04, 190], [370.62, 200],
				[383.34, 210], [392.82, 220], [404.05, 230], [412.20, 240],
				[422.16, 250], [431.52, 260], [438.02, 270], [444.03, 280],
				[451.90, 290], [457.04, 300], [464.03, 310], [468.38, 320],
			],
			[
				0.4,
				[154.57, 100], [187.50, 110], [217.77, 120], [242.12, 130],
				[268.12, 140], [288.87, 150], [308.13, 160], [326.08, 170],
				[342.83, 180], [358.51, 190], [370.00, 200], [383.84, 210],
				[396.85, 220], [406.00, 230], [417.58, 240], [425.47, 250],
				[435.80, 260], [442.59, 270], [448.87, 280], [457.65, 290],
				[463.02, 300], [467.96, 310], [475.42, 320], [479.59, 330],
				[483.39, 340], [486.84, 350],
			],
		],
		///////////////////////////////////////////////////
		[
			670,
			[
				0.9,
				[30.51, 120], [ 47.87, 130], [63.74, 140], [78.32, 150],
				[90.61, 160], [103.06, 170],
			],
			[
				0.8,
				[ 58.87, 110], [ 80.42, 120], [101.66, 130], [118.09, 140],
				[134.67, 150], [149.96, 160], [162.74, 170], [175.92, 180],
				[186.88, 190], [197.07, 200], [206.57, 210], [215.42, 220],
			],
			[
				0.7,
				[ 67.25, 100], [ 93.52, 110], [119.46, 120], [141.24, 130],
				[159.36, 140], [177.87, 150], [194.98, 160], [209.14, 170],
				[222.27, 180], [234.48, 190], [245.85, 200], [256.45, 210],
			],
			[
				0.6,
				[ 86.85, 100], [117.90, 110], [143.94, 120], [167.81, 130],
				[189.78, 140], [207.87, 150], [224.58, 160], [242.19, 170],
				[256.54, 180], [269.90, 190], [282.37, 200], [292.05, 210],
				[302.97, 220], [313.21, 230], [322.79, 240], [329.94, 250],
				[338.40, 260], [344.54, 270], [352.03, 280], [357.28, 290],
			],
			[
				0.5,
				[124.76, 110], [152.84, 120], [178.79, 130], [199.90, 140],
				[222.18, 150], [240.19, 160], [256.92, 170], [272.50, 180],
				[284.04, 190], [300.62, 200], [313.34, 210], [322.82, 220],
				[334.05, 230], [342.20, 240], [352.16, 250], [361.52, 260],
				[368.02, 270], [374.03, 280], [381.90, 290], [387.04, 300],
				[394.03, 310], [398.38, 320], [402.36, 330], [406.00, 340],
				[411.50, 350], [414.48, 360],
			],
			[
				0.4,
				[147.77, 120], [172.11, 130], [198.12, 140], [218.87, 150],
				[238.13, 160], [256.08, 170], [272.83, 180], [288.51, 190],
				[300.00, 200], [313.84, 210], [326.85, 220], [336.00, 230],
				[347.58, 240], [355.47, 250], [365.80, 260], [372.59, 270],
				[378.87, 280], [387.65, 290], [393.02, 300], [397.96, 310],
				[405.42, 320], [409.59, 330], [413.39, 340], [416.84, 350],
				[422.81, 360], [425.60, 370],
			],
		],
	
	
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
		[1261.102, 115], //600 end (1270)
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

function Record(objects, maxLength) {
	
	this.objects = objects;
	this.maxLength = (maxLength !== undefined) ? maxLength : Infinity;
	
	this.init();
}

Record.prototype = {

	constructor: Record,
	
	init: function () {
		this.data = [];
		this.dataLength = 0;
		this.playing = false;
		this.elapsed = 0;
	},
	
	record: function (delta) {
		
		while (this.dataLength + delta > this.maxLength) {
			this.data.shift();
			this.dataLength -= this.data[0].delta;
		}
			
		
		var data = {
			delta: delta,
			objects: [],
		};
		
		for (var i = 0; i < this.objects.length; i++) {
			
			var object = this.objects[i];
			
			data.objects.push({
				position: object.position.clone(),
				quaternion: object.quaternion.clone(),
			});
		}
		
		this.data.push(data);
		
		if (this.data.length > 1)
			this.dataLength += delta;
	},
	
	start: function (time) {
		
		if (time < 0)
			time = this.dataLength + time;
		
		if (time < 0)
			time = 0;
		
		if (time > this.dataLength)
			return;
		
		this.elapsed = time;
		this.playing = true;
	},
	
	update: function (delta) {
		
		if (window.xxx)
			debugger;
		
		this.elapsed += delta;
		
		if (this.elapsed >= this.dataLength) {
			this.elapsed = this.dataLength;
			this.playing = false;
		}
		
		var data0 = null;
		var data1 = this.data[0];
		
		var elapsed = 0;
		for (var i = 1; i < this.data.length; i++) {
			
			data0 = data1;
			data1 = this.data[i];
			
			elapsed += this.data[i].delta;
			
			if (this.elapsed <= elapsed)
				break;
		}
		
		var ratio = 1 - (elapsed - this.elapsed) / data1.delta;
		
		for (var i = 0; i < this.objects.length; i++) {
			
			var object = this.objects[i];
			var objectData0 = data0.objects[i];
			var objectData1 = data1.objects[i];
			
			THREE.Quaternion.slerp(objectData0.quaternion, objectData1.quaternion, object.quaternion, ratio);
			object.position.lerpVectors(objectData0.position, objectData1.position, ratio);
		}
	},
	
};

function AudioChannel(audio) {
	
	this.audio = audio;
	
	var audioContext = this.constructor.support();
	var context = new audioContext();
	
	var media = context.createMediaElementSource(audio);
	
	var leftGain = context.createGain();
	var rightGain = context.createGain();
	
	var splitter = context.createChannelSplitter(2);
	var merger = context.createChannelMerger(2);

	media.connect(splitter);
	
	splitter.connect(leftGain, 0);
	splitter.connect(rightGain, 1);
	
	leftGain.connect(merger, 0, 0);
	rightGain.connect(merger, 0, 1);
	
	merger.connect(context.destination);
	
	this.leftGain = leftGain;
	this.rightGain = rightGain;
	
	this._volume = 1;
	this._leftVolume = 1;
	this._rightVolume = 1;
	
	this.updateVolume();
}

AudioChannel.prototype = {

	constructor: AudioChannel,
	
	get volume() {
		return this._volume;
	},
	set volume(value) {
		this._volume = value;
		this.updateVolume();
	},
	
	get leftVolume() {
		return this._leftVolume;
	},
	set leftVolume(value) {
		this._leftVolume = value;
		this.updateVolume();
	},
	
	get rightVolume() {
		return this._rightVolume;
	},
	set rightVolume(value) {
		this._rightVolume = value;
		this.updateVolume();
	},
	
	updateVolume: function () {
		this.leftGain.gain.value = this.leftVolume * this.volume;
		this.rightGain.gain.value = this.rightVolume * this.volume;
	},
	
	setEqualizer: function (value) {
		this._leftVolume = (value < 0.5) ? 1 : (1 - value) / 0.5;
		this._rightVolume = (value > 0.5) ? 1 : (value - 0) / 0.5;
		this.updateVolume();
	},
	
};

AudioChannel.support = function () {
	return window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext || false;
};

function Ranking(localStorage) {
	
	this.localStorage = localStorage;
	
	this.separaor = ',';
	this.namespace = 'three.badminton.js::ranking';
	this.maxCount = Infinity;
}

Ranking.prototype = {

	constructor: Ranking,
	
	getRanks: function () {
		var ranksString = this.localStorage.getItem(this.namespace);
		if (ranksString) {
			var ranks = ranksString.split(this.separaor);
			for (var i = 0; i < ranks.length; i++)
				ranks[i] = Number(ranks[i]);
			return ranks;
		} else {
			return [];
		}
	},
	
	addRank: function (rank) {
		var ranks = this.getRanks();
		ranks.push(rank);
		ranks.sort(function (a, b) {
			return b - a;
		});
		if (ranks.length > this.maxCount)
			ranks.length = this.maxCount;
		this.localStorage.setItem(this.namespace, ranks.join(this.separaor));
	},
	
	getBestRank: function () {
		var ranks = this.getRanks();
		return ranks[0] || 0;
	},
	
};

exports.ShuttlecockGeometry = ShuttlecockGeometry;
exports.HyperbolaGeometry = HyperbolaGeometry;
exports.NetGeometry = NetGeometry;
exports.CourtGeometry = CourtGeometry;
exports.RacketGeometry = RacketGeometry;
exports.ScoreboardGeometry = ScoreboardGeometry;
exports.ArrowGeometry = ArrowGeometry;
exports.PixelMaterial = PixelMaterial;
exports.NumberMaterial = NumberMaterial;
exports.Shuttlecock = Shuttlecock;
exports.Robot = Robot;
exports.Court = Court;
exports.Scoreboard = Scoreboard;
exports.ScoreboardCard = ScoreboardCard;
exports.NetGroup = NetGroup;
exports.Game = Game;
exports.Record = Record;
exports.AudioChannel = AudioChannel;
exports.Ranking = Ranking;

Object.defineProperty(exports, '__esModule', { value: true });

})));