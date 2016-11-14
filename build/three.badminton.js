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

function Shuttlecock(geometry, material, corkMass, skirtMass, corkAngle, massToCorkTopLength, massToCorkCenterLength, skirtCrossSectionalArea) {
	
	THREE.Object3D.call(this);
	
	if (geometry instanceof ShuttlecockGeometry) {
		corkAngle = geometry.parameters.corkAngle;
		massToCorkTopLength = geometry.parameters.massToCorkTopLength;
		massToCorkCenterLength = geometry.parameters.massToCorkCenterLength;
		skirtCrossSectionalArea = geometry.parameters.skirtCrossSectionalArea;
	}
	
	this.geometry = geometry;
	this.material = material;
	
	this.parameters = {
		mass: corkMass + skirtMass,
		corkMass: corkMass,
		skirtMass: skirtMass,
		corkAngle: corkAngle,
		massToCorkTopLength: massToCorkTopLength,
		massToCorkCenterLength: massToCorkCenterLength,
		skirtCrossSectionalArea: skirtCrossSectionalArea
	};
	
	var flipFrame = new THREE.Object3D();
	this.add(flipFrame);
	
	var mesh = new THREE.Mesh(geometry, material);
	flipFrame.add(mesh);
	
	this.flipFrame = flipFrame;
	this.mesh = mesh;
	
	this.dragCoefficient = 0.44;
	
	this.airDensity = 1.1839;
	this.gravity = new THREE.Vector3(0, -9.8, 0);
	
	this.toppleAngularVelocity = Math.PI * 3;
	
	this.init();
}

Shuttlecock.prototype = Object.assign(Object.create(THREE.Object3D.prototype), {

	constructor: Shuttlecock,
	
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
		if (this.state === 'active')
			this.updateActive(delta);
		else if (this.state === 'toppling')
			this.updateToppling(delta);
		this.lastDelta = delta;
	},
	
	updateActive: function (delta) {
		
		var rho = this.airDensity;
		var S = this.parameters.skirtCrossSectionalArea;
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
			this.state = 'toppling';
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
			yAxis.clone().negate().angleTo(velocityXZ) - this.parameters.corkAngle);
		
		var flipMatrix = new THREE.Matrix4().makeRotationFromEuler(this.rotation);
		this.rotation.setFromRotationMatrix(flipMatrix.multiply(new THREE.Matrix4().makeRotationAxis(flipAxis, flipAngle)));
		
		this.position.y -= this.localToTarget(new THREE.Vector3(0, this.parameters.massToCorkTopLength, 0), this.parent).y;
		
		if (flipAngle < 1e-4)
			this.state = 'toppled';
	},
	
	flipDerivative: function (params) {
		var phi = params[0];
		var phi_dot = params[1];
		var rho = this.airDensity;
		var C_D = this.dragCoefficient;
		var U = this.velocity.length();
		var M_B = this.parameters.skirtMass;
		var M_C = this.parameters.corkMass;
		var l_GC = this.parameters.massToCorkCenterLength;
		var S = this.parameters.skirtCrossSectionalArea;
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
	
	onAfterImpact: function () {},
	
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
		racket.position.y = racketSize.y / 2;
		parent.add(racket);
		
		link.racket = racket;
		
		return link;
	}
	
	var topLink = createLink([
		new THREE.Vector3(1, 0, 0),
		new THREE.Vector3(-1, 0, 0),
	]);
	topLink.position.set(0, bodyCenter.y + bodySize.y / 2, 0);
	body.add(topLink);
	
	var leftLink = createLink([
		new THREE.Vector3(0, -1, 0),
		new THREE.Vector3(-1, 0, 0),
	]);
	leftLink.rotation.z = -Math.PI / 2;
	leftLink.position.set(bodyCenter.x + bodySize.x / 2, bodyCenter.y, 0);
	body.add(leftLink);
	
	var rightLink = createLink([
		new THREE.Vector3(0, 1, 0),
		new THREE.Vector3(-1, 0, 0),
	]);
	rightLink.rotation.z = Math.PI / 2;
	rightLink.position.set(bodyCenter.x - bodySize.x / 2, bodyCenter.y, 0);
	body.add(rightLink);

	this.body = body;
	
	this.topLink = topLink;
	this.topImpactAngle = -Math.PI / 15;
	
	this.leftLink = leftLink;
	this.rightLink = rightLink;
	
	this.impactClock = new THREE.Clock();
	this.impactClock.start();
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
	
	this.targetPosition = new THREE.Vector3(0, 0, 0);
	
	this.impactType = 'right';
	this.smashSpeed = Math.PI * 100;
	
	this.healthAttenuation = 0.99;
	
	this.record = null;
	
	this.init();
}

Robot.prototype = Object.assign(Object.create(THREE.Object3D.prototype), {

	constructor: Robot,
	
	init: function () {
		this.impactCount = 0;
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
		return (time < -1e-2) ? null : this.shuttlecock.position.clone().addScaledVector(this.shuttlecock.velocity, time)
			.add(this.shuttlecock.position).divideScalar(2).setY(y);
	},
	
	getRacketImpactLength: function () {
		return this.parameters.racketSize.y / 2;
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
		
		var bodyAngle = 0;
		var impactAngle = 0;
		var rotationValue = 0;
		var robotPosition = this.responsibleArea.getCenter();
		
		if ((this.impactCount === 0 || this.impactCount + 2 === this.shuttlecock.impactCount + 1) &&
			this.shuttlecock.state === 'active' && impactPosition &&
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
		if (this.checkIntersect(link.racket, this.shuttlecock) && this.impactClock.getDelta() > this.impactDelta) {
		
			var normal = link.racket.localToTarget(new THREE.Vector3(0, 0, 1), this.parent, 'direction');
			
			this.shuttlecock.impact(normal.clone().multiplyScalar(impactSpeed * this.getRacketImpactLength()), normal, this.racketAttenuation);
			
			this.impactCount = this.shuttlecock.impactCount;
			this.healthPercent *= this.healthAttenuation;
			
			if (this.record) {
				if (this.record.playing)
					this.record.playRobot();
				else
					this.record.recordRobot(this);
			}
			
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
		var as = this.hitAngleSpeed(); //算力道角度
		var impactAngle = Math.atan((this.netHeight - impactHeight) / (as[0] * as[2])); //(網高 - 擊球高度)/離網的距離
		var impactSpeed = Math.PI * as[1]; //手臂旋轉角速度;
		return [impactAngle, impactSpeed * 2];
	},
	
	hitAngleSpeed: function() {
		var forceTable = this.forceTable;

		var i, j;
		var hit = this.shuttlecock.position.clone().setY(0);
		var x0 = this.targetPosition.clone().sub(hit).length(); //水平位移
		var startX = Math.abs(hit.x);

		for (i = 0; i < forceTable.length; i++) //找打擊方和網子距離(定角度)
			if (startX < forceTable[i][0])
				break;
		
		if (i !== 0)
			i--;

		for (j = 1; j < forceTable[i].length; j++) //找水平位移
			if (x0 < forceTable[i][j][0])
				break;

		var speed;

		if (j === 1) { //近距離 改查角度不同的表
			var near = this.searchNearTable(i, x0);
			return [forceTable[i][0], near[0], near[1]];
		}

		if (j === forceTable[i].length) {
			speed = forceTable[i][j - 1][1];
		} else {
			//直接線性內差,數字太大-> *0.8
			var ratio = 0.8 * (x0 - forceTable[i][j - 1][0]) / (forceTable[i][j][0] - forceTable[i][j - 1][0]);
			speed = forceTable[i][j - 1][1] + ratio * (forceTable[i][j][1] - forceTable[i][j - 1][1]);
		}
		return [forceTable[i][0], speed, 0.5]; //離網距離, 力道, 放大仰角
	},

    searchNearTable: function (i, x0) {
		var forceTable = this.forceTable;
		var nearForceTable = this.nearForceTable;

		for (var j = 0; j < nearForceTable[i].length; j++)
			if (x0 < nearForceTable[i][j][0])
				break;
		
		if (j !== nearForceTable[i].length && j !== 0) {
			var mae = x0 - nearForceTable[i][j - 1][0];
			var ushiro = nearForceTable[i][j][0] - x0;
			return (mae < ushiro) ? 
				[nearForceTable[i][j - 1][1], nearForceTable[i][j - 1][2]] :
				[nearForceTable[i][j][1], nearForceTable[i][j][2]]; //取較接近的
		}
		
		if (j !== 0)
			j--;
			
		return [nearForceTable[i][j][1], nearForceTable[i][j][2]]; //[force, 放大仰角]
    },
	
	forceTable: [
		[50, //打擊方x值
			[137.985, 4], //[球水平位移, link speed (n倍的PI)]
			[171.764, 5],
			[181.607, 5.5],
			[196.202, 6],
			[210.167, 6.5],
		],
		[60, //打擊方x值
			[199.854, 5],
			[227.500, 6],
			[257.592, 7],
			[287.615, 8],
		],
		[100, //打擊方x值
			[275.066, 5], //[球水平位移, link speed]
			[324.661, 6],
			[361.542, 7],
			[390.883, 8],
			[424.454, 9],
			[453.068, 10],
			[502.904, 12],
			[522.702, 13],
			[564.443, 15],
		],
		[200,
			[410.093, 6],
			[458.291, 7],
			[507.016, 8],
			[559.387, 9],
			[592.505, 10],
			[665.365, 12],
			[699.139, 13],
			[722.290, 14],
			[747.837, 15],
			[799.139, 17],
			[821.300, 18],
			[836.071, 19],
		],
		[300,
			[534.076, 8],
			[592.751, 9],
			[614.948, 10],
			[691.248, 12],
			[734.713, 13],
			[756.567, 14],
			[792.024, 15],
			[872.006, 18],
			[906.458, 20],
			[947.016, 22],
			[964.180, 23],
			[981.645, 24],
		],
		[400,
			[688.696, 12],
			[719.630, 13],
			[723.163, 14],
			[756.823, 15],
			[778.991, 16],
			[825.065, 18],
			[869.899, 20],
			[907.816, 22],
			[968.375, 25],
			[985.026, 28],
			[1026.356, 30],
			[1045.120, 32],
			[1082.599, 35],
		],
		[500,
			[799.488, 16],
			[841.450, 18],
			[887.547, 20],
			[910.274, 22],
			[952.236, 25],
			[993.630, 28],
			[1016.415, 30],
			[1043.966, 33],
			[1069.137, 35],
			[1084.272, 38],
			[1102.328, 45],
			[1125.554, 50],
		],
		[600,
			[832.078, 18],
			[870.521, 20],
			[918.200, 23],
			[945.298, 25],
			[1001.864, 30],
			[1047.207, 35],
			[1085.517, 40],
			[1120.521, 45],
			[1142.557, 50],
			[1159.886, 55],
			[1179.336, 60],
			[1183.502, 65],
		],
		[670,
			[919.055, 25],
			[976.644, 30],
			[1022.786, 35],
			[1060.423, 40],
			[1096.539, 45],
			[1126.575, 50],
			[1140.540, 55],
			[1155.065, 60],
			[1160.136, 65],
			[1165.340, 70],
			[1185.009, 75],
		]
	],

	nearForceTable: [
		//50
		[
			[116.170, 4, 0.5],
			[133.989, 4, 0.6],
		],
		//60
		[
			[110.709, 4, 0.4],
			[133.989, 4, 0.5],
			[155.276, 4, 0.6],
		],
		//100
		[
			[171.218, 4, 0.4],
			[197.541, 4, 0.5],
			[211.025, 5, 0.4],
			[220.771, 4, 0.6],
			[247.074, 5, 0.5],
			[274.574, 5, 0.6],
		],
		//200
		[
			[316.081, 5, 0.4],
			[361.806, 5, 0.6],
			[417.773, 6, 0.6],
		],
		//300
		[
			[417.841, 6, 0.4],
			[439.847, 6, 0.5],
			[473.036, 7, 0.4],
			[504.056, 7, 0.6],
		],
		//400
		[
			[551.695, 9, 0.4],
			[597.663, 10, 0.6],
			[633.222, 11, 0.6],
		],
		//500
		[
			[684.329, 12, 0.5],
			[706.157, 13, 0.6],
			[749.170, 14, 0.3],
			[762.856, 14, 0.5],
		],
		//600
		[
			[666.356, 12, 0.2],
			[730.342, 13, 0.4],
			[748.811, 14, 0.5],
		],
		//670 893
		[
			[838.084, 19, 0.4],
			[842.727, 20, 0.6],
			[860.917, 21, 0.6],
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

function ScoreboardCard(width, height, font) {

	THREE.Object3D.call(this);
	
	this.parameters = {
		width: width,
		height: height,
		font: font,
	};
	
	var plane = new THREE.Mesh(
		new THREE.PlaneGeometry(width, height),
		new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
	this.add(plane);
	
	this.plane = plane;
	this.textMesh = null;
}

ScoreboardCard.prototype = Object.assign(Object.create(THREE.Object3D.prototype), {

	constructor: ScoreboardCard,
	
	setText: function (text) {
		this.text = text;
		if (this.textMesh) {
			this.plane.remove(this.textMesh);
			this.textMesh = null;
		}
		if (text !== null) {
			var mesh = new THREE.Mesh(
				new THREE.TextGeometry(text, {
					font: this.parameters.font,
					height: 0.1,
				}),
				new THREE.MeshNormalMaterial());
				mesh.geometry.computeBoundingBox();
			var size = {
				x: mesh.geometry.boundingBox.max.x - mesh.geometry.boundingBox.min.x,
				y: mesh.geometry.boundingBox.max.y - mesh.geometry.boundingBox.min.y,
			};
			mesh.scale.set(this.parameters.width * 0.8 / size.x, this.parameters.height * 0.8 / size.y, 1);		
			mesh.position.x = -0.5 * this.parameters.width * 0.9;
			mesh.position.y = -0.5 * this.parameters.height * 0.9;
			mesh.position.z = 0.1;
			this.plane.add(mesh);
			this.textMesh = mesh;
		}
	},
	
});

function Scoreboard(width, height, depth, cardGap) {

	THREE.Object3D.call(this);
	
	this.parameters = {
		width: width,
		height: height,
		depth: depth,
		cardGap: cardGap,
	};
	
	var planeAngle = Math.atan((depth / 2) / height);
	var planeHeight = Math.sqrt(Math.pow(depth / 2, 2) + Math.pow(height, 2));
	
	var frontBoard = new THREE.Mesh(
		new THREE.PlaneGeometry(width, planeHeight),
		new THREE.MeshNormalMaterial({ side: THREE.DoubleSide }));
	frontBoard.position.y = height / 2;
	frontBoard.position.z = depth / 4;
	frontBoard.rotation.x = -planeAngle;
	this.add(frontBoard);
	
	var backBoard = new THREE.Mesh(
		new THREE.PlaneGeometry(width, planeHeight),
		new THREE.MeshNormalMaterial({ side: THREE.DoubleSide }));
	backBoard.position.y = height / 2;
	backBoard.position.z = -depth / 4;
	backBoard.rotation.x = planeAngle;
	this.add(backBoard);
	
	var bottomBoard = new THREE.Mesh(
		new THREE.PlaneGeometry(width, depth),
		new THREE.MeshNormalMaterial({ side: THREE.DoubleSide }));
	bottomBoard.rotation.x = Math.PI / 2;
	this.add(bottomBoard);
	
	var cardHeight = planeHeight - cardGap * 2;
	var cardWidth = (width - cardGap * 5) / 3;
	var cardDepth = 2;
	
	var ringRadius = 15;
	var ringTub = 1;
	var ringPos = 5;
	
	var cardRings = new THREE.Object3D();
	cardRings.position.y = height * 1.01;
	this.add(cardRings);
	
	var ringPositions = [
		-cardGap * 1.5 - cardWidth * 1.25,
		-cardGap * 1.5 - cardWidth * 1.00,
		-cardGap * 1.5 - cardWidth * 0.75,
		-cardGap * 0.5 - cardWidth * 0.25,
		+cardGap * 0.5 + cardWidth * 0.25,
		+cardGap * 1.5 + cardWidth * 0.75,
		+cardGap * 1.5 + cardWidth * 1.00,
		+cardGap * 1.5 + cardWidth * 1.25,
	];
	
	for (var i = 0; i < ringPositions.length; i++) {
		var ring = new THREE.Mesh(
			new THREE.TorusGeometry(ringRadius, ringTub, 16, 16),
			new THREE.MeshNormalMaterial({ side: THREE.DoubleSide }));
		ring.position.x = ringPositions[i];
		ring.rotation.y = Math.PI / 2;
		cardRings.add(ring);
	}
	
	var _this = this;
	
	var loader = new THREE.FontLoader();
	loader.load('https://ikatyang.github.io/three.badminton.js/fonts/gentilis_regular.typeface.json', function (font) {
		
		_this.frontCards = [
			_this.frontCard1 = createCard('0', 1.0, ringPositions[1], Math.PI * 2 - planeAngle, true),
			_this.frontSmallCard1 = createCard('0', 0.5, ringPositions[3], Math.PI * 2 - planeAngle, true),
			_this.frontSmallCard2 = createCard('0', 0.5, ringPositions[4], Math.PI * 2 - planeAngle, true),
			_this.frontCard2 = createCard('0', 1.0, ringPositions[6], Math.PI * 2 - planeAngle, true),
		];
		
		_this.backCards = [
			_this.backCard1 = createCard(null, 1.0, ringPositions[1], planeAngle, true),
			_this.backSmallCard1 = createCard(null, 0.5, ringPositions[3], planeAngle, true),
			_this.backSmallCard2 = createCard(null, 0.5, ringPositions[4], planeAngle, true),
			_this.backCard2 = createCard(null, 1.0, ringPositions[6], planeAngle, true),
		];
		
		_this.animateCards = [
			_this.animateCard1 = createCard(null, 1.0, ringPositions[1], 0, false),
			_this.animateSmallCard1 = createCard(null, 0.5, ringPositions[3], 0, false),
			_this.animateSmallCard2 = createCard(null, 0.5, ringPositions[4], 0, false),
			_this.animateCard2 = createCard(null, 1.0, ringPositions[6], 0, false),
		];
		
		function createCard(text, scale, posX, angle, visible) {
			var card = new ScoreboardCard(cardWidth * scale, cardHeight * scale, font);
			card.setText(text);
			card.position.x = posX;
			card.rotation.x = angle;
			card.visible = visible;
			card.plane.position.y = -cardHeight * scale / 2 - cardGap;
			cardRings.add(card);
			return card;
		}
	});
	
	this.speed = Math.PI * 2;
	this.actions = [null, null, null, null];
}

Scoreboard.prototype = Object.assign(Object.create(THREE.Object3D.prototype), {

	constructor: Scoreboard,
	
	setCardAction: function (cardNo, text, direction) {
		var frontCard = this.frontCards[cardNo];
		var backCard = this.backCards[cardNo];
		var animateCard = this.animateCards[cardNo];
		if (direction === 'next') {
			animateCard.setText(text);
			animateCard.rotation.x = backCard.rotation.x;
			animateCard.visible = true;
		} else {
			animateCard.setText(frontCard.text);
			animateCard.rotation.x = frontCard.rotation.x;
			animateCard.visible = true;
			frontCard.setText(text);
		}
		this.actions[cardNo] = {
			text: text,
			cardNo: cardNo,
			direction: direction,
			frontCard: frontCard,
			backCard: backCard,
			animateCard: animateCard,
		};
	},
	
	update: function (delta) {
		for (var i = 0; i < this.actions.length; i++)
			if (this.actions[i] !== null)
				this.updateCard(delta, this.actions[i]);
	},
	
	updateCard: function (delta, action) {
		var targetCard = (action.direction === 'next') ? action.frontCard : action.backCard;
		
		var cardAngleDeltaFull = targetCard.rotation.x - action.animateCard.rotation.x;
		var cardAngleDeltaPart = this.speed * delta * (cardAngleDeltaFull < 0 ? -1 : 1);
		var cardAngleDelta = Math.abs(cardAngleDeltaFull) < Math.abs(cardAngleDeltaPart) ? cardAngleDeltaFull : cardAngleDeltaPart;
		action.animateCard.rotation.x += cardAngleDelta;
		
		if (action.animateCard.rotation.x === targetCard.rotation.x) {
			if (action.direction === 'next')
				action.frontCard.setText(action.text);
			action.animateCard.visible = false;
			this.actions[action.cardNo] = null;
		}
	},
	
});

function TargetPoint(radius, tube) {
	
	THREE.Object3D.call(this);
	
	this.parameters = {
		radius: radius,
		tube: tube,
	};
	
	var ring = new THREE.Mesh(
		new THREE.TorusGeometry(radius, tube, 16, 12),
		new THREE.MeshNormalMaterial());
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
	
	var arrow = new THREE.Mesh(geometry, new THREE.MeshNormalMaterial());
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

function Game(court, shuttle, firstPlayer) {

	this.court = court;
	this.shuttle = shuttle;
	
	this.nthScore = 0;
	this.score1 = 0;
	this.score2 = 0;
	this.lastWinner = (firstPlayer !== undefined) ? firstPlayer : 1;
	
	this.scoreboard = null;
}

Game.prototype = {

	constructor: Game,
	
	get lastWinnerScore() {
		return this['score' + this.lastWinner];
	},
	set lastWinnerScore(value) {
		this['score' + this.lastWinner] = value;
	},
	
	nextScore: function () {
		this.nthScore++;
	},
	
	update: function (delta) {
		if (this.nthScore !== this.score1 + this.score2) {
			if (this.shuttle.state === 'hung') {
				if (this.shuttle.impactCount % 2 === 0) {
					this.lastWinner = this.lastWinner;
				} else {
					this.lastWinner = this.lastWinner % 2 + 1;
				}
				this.lastWinnerScore++;
				this.updateScoreboard();
				this.onScoreChange();
			} else if (this.shuttle.state === 'toppled') {
				var area = (this.shuttle.impactCount <= 1) ?
					((this.lastWinner === 1) ?
						this.court.getArea('SingleFirst' + (this.score1 % 2 === 0 ? 'Right' : 'Left') + 'B') : 
						this.court.getArea('SingleFirst' + (this.score2 % 2 === 0 ? 'Right' : 'Left') + 'A')) :
					((this.lastWinner === 1) ?
						((this.shuttle.impactCount % 2 === 1) ?
							this.court.getAreaSingleB() :
							this.court.getAreaSingleA()) : 
						((this.shuttle.impactCount % 2 === 1) ?
							this.court.getAreaSingleA() :
							this.court.getAreaSingleB()));
				this.court.localToTarget(area, this.shuttle.parent);
				var position = this.shuttle.localToTarget(new THREE.Vector3(0, 0, 0), this.court);
				if (position.x >= area.min.x && position.x <= area.max.x &&
					position.z >= area.min.z && position.z <= area.max.z) {
					if (this.shuttle.impactCount % 2 === 1) {
						this.lastWinner = this.lastWinner;
					} else {
						this.lastWinner = this.lastWinner % 2 + 1;
					}
				} else {
					if (this.shuttle.impactCount % 2 === 0) {
						this.lastWinner = this.lastWinner;
					} else {
						this.lastWinner = this.lastWinner % 2 + 1;
					}
				}
				this.lastWinnerScore++;
				this.updateScoreboard();
				this.onScoreChange();
			}
		}
	},
	
	updateScoreboard: function () {
		if (this.scoreboard) {
			if (this.lastWinner === 1) {
				this.scoreboard.setCardAction(0, this.score1.toString(), 'next');
			} else {
				this.scoreboard.setCardAction(3, this.score2.toString(), 'next');
			}
		}
	},
	
	onScoreChange: function () {},
	
};

function Record(shuttlecock, robot1, robot2, game, scoreboard, targetPoint1, targetPoint2, data) {
	
	this.shuttlecock = shuttlecock;
	this.robot1 = robot1;
	this.robot2 = robot2;
	this.game = game;
	this.scoreboard = scoreboard;
	this.targetPoint1 = targetPoint1;
	this.targetPoint2 = targetPoint2;
	
	this.resetCounter();
	this.playing = false;
	
	this.init(data);
}

Record.prototype = {

	constructor: Record,
	
	recordRobot: function (robot) {
		this.data.next.push(this.getRobotData(robot));
	},
	
	resetCounter: function () {
		this.counter = 0;
	},
	
	init: function (data) {
		this.data = data || {
			init: {
				score1: this.game.score1,
				score2: this.game.score2,
				nthScore: this.game.nthScore,
				firstPlayer: this.game.lastWinner,
				shuttlecock: this.getShuttlecockData(this.shuttlecock),
				robot1: this.getRobotInitData(this.robot1),
				robot2: this.getRobotInitData(this.robot2),
			},
			next: [],
		};
	},
	
	play: function () {
		this.resetCounter();
		
		this.game.score1 = this.data.init.score1;
		this.game.score2 = this.data.init.score2;
		this.game.nthScore = this.data.init.nthScore;
		this.game.lastWinner = this.data.init.firstPlayer;
		this.scoreboard.frontCard1.setText(this.game.score1.toString());
		this.scoreboard.frontCard2.setText(this.game.score2.toString());
		this.setRobotInit(this.robot1, this.data.init.robot1, this.targetPoint1);
		this.setRobotInit(this.robot2, this.data.init.robot2, this.targetPoint2);
		this.setShuttlecock(this.shuttlecock, this.data.init.shuttlecock);
		
		this.playRobot();
	},
	
	playRobot: function () {
		var data = this.data.next[this.counter];
		if (data) {
			var player = (this.counter % 2 === 0) ? this.data.init.firstPlayer : this.data.init.firstPlayer % 2 + 1;
			var robot = (player === 1) ? this.robot1 : this.robot2;
			this.setRobot(robot, data);
		}
		this.playing = (++this.counter < this.data.next.length);
	},
	
	getShuttlecockData: function (shuttlecock) {
		return {
			state: shuttlecock.state,
			position: shuttlecock.position.toArray(),
			rotation: shuttlecock.rotation.toArray(),
			velocity: shuttlecock.velocity.toArray(),
			impactCount: shuttlecock.impactCount,
		};
	},
	
	setShuttlecock: function (shuttlecock, data) {
		shuttlecock.state = data.state;
		shuttlecock.position.fromArray(data.position);
		shuttlecock.rotation.fromArray(data.rotation);
		shuttlecock.velocity.fromArray(data.velocity);
		shuttlecock.impactCount = data.impactCount;
	},
	
	getRobotInitData: function (robot) {
		return {
			responsibleArea: robot.responsibleArea.toArray(),
			impactCount: robot.impactCount,
			healthPercent: robot.healthPercent,
			bodyAngle: robot.body.rotation.y,
			position: robot.position.toArray(),
			rotation: robot.rotation.toArray(),
		};
	},
	
	setRobotInit: function (robot, data) {
		robot.responsibleArea.fromArray(data.responsibleArea);
		robot.impactCount = data.impactCount;
		robot.healthPercent = data.healthPercent;
		robot.body.rotation.y = data.bodyAngle;
		robot.position.fromArray(data.position);
		robot.rotation.fromArray(data.rotation);
	},
	
	getRobotData: function (robot) {
		return {
			impactType: robot.impactType,
			targetPosition: robot.targetPosition.toArray(),
		};
	},
	
	setRobot: function (robot, data) {
		robot.impactType = data.impactType;
		robot.targetPosition.fromArray(data.targetPosition);
		var targetPoint = (robot === this.robot1) ? this.targetPoint1 : this.targetPoint2;
		if (targetPoint)
			targetPoint.position.fromArray(data.targetPosition);
	},
	
};

exports.ShuttlecockGeometry = ShuttlecockGeometry;
exports.HyperbolaGeometry = HyperbolaGeometry;
exports.NetGeometry = NetGeometry;
exports.CourtGeometry = CourtGeometry;
exports.RacketGeometry = RacketGeometry;
exports.PixelMaterial = PixelMaterial;
exports.Shuttlecock = Shuttlecock;
exports.Robot = Robot;
exports.Court = Court;
exports.Scoreboard = Scoreboard;
exports.ScoreboardCard = ScoreboardCard;
exports.TargetPoint = TargetPoint;
exports.Game = Game;
exports.Record = Record;

Object.defineProperty(exports, '__esModule', { value: true });

})));