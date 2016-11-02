function Robot(bodyWidth, bodyHeight, bodyDepth, racketLength, racketWidth, racketDepth) {

	THREE.Object3D.call(this);
	
	bodyWidth = (bodyWidth !== undefined) ? bodyWidth : 50;
	bodyHeight = (bodyHeight !== undefined) ? bodyHeight : 160;
	bodyDepth = (bodyDepth !== undefined) ? bodyDepth : 50;
	
	racketLength = (racketLength !== undefined) ? racketLength : 50;
	racketWidth = (racketWidth !== undefined) ? racketWidth : 30;
	racketDepth = (racketDepth !== undefined) ? racketDepth : 1;
	
	this.parameters = {
		bodyWidth: bodyWidth,
		bodyHeight: bodyHeight, 
		bodyDepth: bodyDepth,
		racketLength: racketLength,
		racketWidth: racketWidth,
		racketDepth: racketDepth,
	};
	
	var body = new THREE.Mesh(
		new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyDepth),
		new THREE.MeshNormalMaterial({ wireframe: true }));
	body.position.set(0, bodyHeight / 2, 0);
	this.add(body);
	
	///////////////////////////////////////////////////////////
	var tubularSeg = 12;
	var radialSeg = 4;
	var bodyH = bodyHeight * 2 / 3;
	var radialAdd = bodyH / (radialSeg - 1);
	var tubularAdd = 2 * Math.PI / tubularSeg;
	var a = bodyWidth / 2.5;  //半實軸
	var b = bodyH / 2;  //半虛軸
	var center = new THREE.Vector3(0, b, 0);
	var geo = new THREE.Geometry();
	var positionObj = new THREE.Object3D();

	for (var h = 0; h <= bodyH; h += radialAdd) {
		var y = h;
		var x = Math.sqrt((((y - center.y) * (y - center.y) / (b * b) + 1) * a * a)) - center.x;

		for (var i = 0; i < 2 * Math.PI; i += tubularAdd) {
			positionObj.rotation.y = i;
			positionObj.updateMatrixWorld();
			geo.vertices.push(positionObj.localToWorld(new THREE.Vector3(x, y, 0)));
		}
	}
	
	var len = Math.floor(geo.vertices.length - tubularSeg);
	var modMax = tubularSeg - 1;
	
	for(var index = 0; index < len; index++) {
		var face = (index % tubularSeg === modMax) ?
			new THREE.Face3(index, index + 1 - tubularSeg, index + tubularSeg) :
			new THREE.Face3(index, index + 1, index + tubularSeg);
		face.materialIndex = 0;
		geo.faces.push(face);
		var y = Math.floor(index / tubularSeg) / (radialSeg - 1);
		var x = index % tubularSeg / tubularSeg;
		var p1 = new THREE.Vector2(x + 1/tubularSeg, y);
		var p2 = new THREE.Vector2(x, y + 1 / (radialSeg - 1));
		var p3 = new THREE.Vector2(x + 1/tubularSeg, y + 1 / (radialSeg - 1));
		geo.faceVertexUvs[0].push([new THREE.Vector2(x, y), p1, p2]);
		var face2 = (index % tubularSeg === modMax) ?
			new THREE.Face3(index + tubularSeg, index - modMax, index + 1) :
			new THREE.Face3(index + tubularSeg, index + 1, index + tubularSeg + 1);
		face.materialIndex = 0;
		geo.faces.push(face2);
		geo.faceVertexUvs[0].push([p2, p1, p3]); 
	}

	geo.computeBoundingSphere();
	geo.computeFaceNormals();
	geo.computeVertexNormals();

	var bodyMaterial = new THREE.MeshBasicMaterial({
		color: 0x000000,
		side: THREE.DoubleSide
	});
	var waist = new THREE.Mesh (geo, bodyMaterial);
	waist.position.set(0, -bodyHeight / 2, 0);
	body.add (waist);

	var headGeometry = new THREE.SphereGeometry(bodyHeight * 1 / 6, 32, 32);
	var sphere = new THREE.Mesh(headGeometry, new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide}));
	sphere.position.set(0, bodyHeight * 1 / 3, 0);
	body.add (sphere);
	//////////////////////////////////////////////////////////
	
	var leftLink = Object.defineProperties(new THREE.Object3D(), {
		angleA: {
			get: function () {
				return -this.rotation.x;
			},
			set: function (value) {
				this.rotation.x = -value;
			},
		},
		angleB: {
			get: function () {
				return this.rotation.y;
			},
			set: function (value) {
				this.rotation.y = value;
			},
		},
	});
	var leftRacket = new THREE.Mesh(
		new THREE.BoxGeometry(racketLength, racketWidth, racketDepth),
		new THREE.MeshNormalMaterial({ wireframe: true }));
	leftRacket.position.set(racketLength / 2, 0, 0);
	leftLink.add(leftRacket);
	leftLink.position.set(bodyWidth / 2, 0, 0);
	body.add(leftLink);
	
	var rightLink = Object.defineProperties(new THREE.Object3D(), {
		angleA: {
			get: function () {
				return -this.rotation.x;
			},
			set: function (value) {
				this.rotation.x = -value;
			},
		},
		angleB: {
			get: function () {
				return -this.rotation.y;
			},
			set: function (value) {
				this.rotation.y = -value;
			},
		},
	});
	var rightRacket = new THREE.Mesh(
		new THREE.BoxGeometry(racketLength, racketWidth, racketDepth),
		new THREE.MeshNormalMaterial({ wireframe: true }));
	rightRacket.position.set(-racketLength / 2, 0, 0);
	rightLink.add(rightRacket);
	rightLink.position.set(-bodyWidth / 2, 0, 0);
	body.add(rightLink);
	
	var topLink = Object.defineProperties(new THREE.Object3D(), {
		angleA: {
			get: function () {
				return this.rotation.x;
			},
			set: function (value) {
				this.rotation.x = value;
			},
		},
		angleB: {
			get: function () {
				return -this.frame.rotation.x;
			},
			set: function (value) {
				this.frame.rotation.x = -value;
			},
		},
	});
	var topLinkFrame = new THREE.Object3D();
	var topRacket = new THREE.Mesh(
		new THREE.BoxGeometry(racketWidth, racketLength, racketDepth),
		new THREE.MeshNormalMaterial({ wireframe: true }));
	topRacket.position.set(0, racketLength / 2, 0);
	topLinkFrame.add(topRacket);
	topLink.position.set(0, bodyHeight / 2, 0);
	topLink.frame = topLinkFrame;
	topLink.add(topLinkFrame);
	body.add(topLink);

	var pixelRow = 20;
	var space = 3;
	var side = bodyWidth * 0.3 < bodyHeight / 3 ? bodyWidth * 0.3 : bodyHeight / 3;  //眼睛範圍的方形邊長
	var eyeMidR = new THREE.Vector2(bodyWidth * 0.3 - bodyWidth/2, bodyHeight * 5 / 6 - bodyHeight / 2);  //眼睛中心點
	var eyeMidL = new THREE.Vector2(bodyWidth * 0.7 - bodyWidth/2, bodyHeight * 5 / 6 - bodyHeight / 2);
	var pixelSide = side / (pixelRow + space);
	var eyes = new THREE.Object3D();
	var leftEyeBall = new THREE.Object3D();
	var rightEyeBall = new THREE.Object3D();
	var smashEyes = new THREE.Object3D();
	var rFirst = new THREE.Vector3(eyeMidR.x - side / 2 + pixelSide / 2, eyeMidR.y + side / 2 - pixelSide / 2, bodyDepth / 2);
	var rLast = new THREE.Vector3(eyeMidR.x + side / 2 - pixelSide / 2, eyeMidR.y - side / 2 + pixelSide / 2, bodyDepth / 2) ;
	var lFirst = new THREE.Vector3(eyeMidL.x - side / 2 + pixelSide / 2, eyeMidL.y + side / 2 - pixelSide / 2, bodyDepth / 2);
	var lLast = new THREE.Vector3(eyeMidL.x + side / 2 - pixelSide / 2, eyeMidL.y - side / 2 + pixelSide / 2, bodyDepth / 2);
	
	//pixel格數 + 2格寬的中間間隙共 pixelRow + space 格，pixel中心點每次移動一格寬 + 一格間隙
	var addUnit = side / (pixelRow + space) + side * 2 / (pixelRow + space) / (pixelRow - 1);

	var geometry = new THREE.PlaneGeometry(pixelSide, pixelSide);
	var material = new THREE.MeshBasicMaterial({side: THREE.DoubleSide});
	
	//眼睛上方槓槓
	for (var i = 0; i < 2; i++) {
		var x = (i === 0) ? rFirst.x : lFirst.x;
		var y = (i === 0) ? rFirst.y : lFirst.y;
		for (var j = Math.floor(pixelRow * 0.2); j < Math.ceil(pixelRow * 0.3); j++) {
			for (var k = 0; k < pixelRow; k++) {
				var mesh = new THREE.Mesh(geometry, material);
				mesh.position.set(k * addUnit + x, y - j * addUnit, 0.1 + bodyDepth / 2);
				eyes.add(mesh);
			}
		}
	}
	
	//眼珠
	for (var i = 0; i < 2; i++) {
		var x = (i === 0) ? rFirst.x : lFirst.x;
		var y = (i === 0) ? rFirst.y : lFirst.y;
		for (var j = Math.floor(pixelRow * 0.3); j < Math.ceil(pixelRow * 0.9); j++) {
			for (var k = Math.floor(pixelRow * 0.35); k < Math.ceil(pixelRow * 0.65); k++) {
				var mesh = new THREE.Mesh(geometry, material);
				mesh.position.set(k * addUnit + x, y - j * addUnit, 0.1 + bodyDepth / 2);
				if (i === 0)
					rightEyeBall.add(mesh);
				else
					leftEyeBall.add(mesh);
			}
		}
	}
	eyes.add(rightEyeBall);
	eyes.add(leftEyeBall);
	body.add(eyes);

	//殺球槓
	var nowX = 0;
	var i;
	for (i = 0; i < Math.ceil(pixelRow * 0.5); i++){
		for (var j = 0; j < 2 && nowX < pixelRow; j++, nowX++) {
			var mesh = new THREE.Mesh(geometry, material);
			mesh.position.set(rFirst.clone().x + nowX * addUnit, rFirst.clone().y - i * addUnit, 0.1 + bodyDepth / 2);
			smashEyes.add(mesh);
			
			var mesh4 = mesh.clone();
			mesh4.position.y -= addUnit;
			smashEyes.add(mesh4);
			
			var mesh2 = mesh.clone();
			mesh2.position.set(lFirst.clone().x + (pixelRow - nowX) * addUnit, lFirst.clone().y - i * addUnit, 0.1 + bodyDepth / 2);
			smashEyes.add(mesh2);
			
			var mesh3 = mesh2.clone();
			mesh3.position.y -= addUnit;
			smashEyes.add(mesh3);
		}
	}
	
	//珠
	for (; i < pixelRow; i++) {
		var j = Math.floor(pixelRow * 0.7);
		
		var mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(rFirst.clone().x + j * addUnit, rFirst.clone().y - i * addUnit, 0.1 + bodyDepth / 2);
		
		var mesh2 = new THREE.Mesh(geometry, material);
		mesh2.position.set(lFirst.clone().x + (pixelRow - j) * addUnit, lFirst.clone().y - i * addUnit, 0.1 + bodyDepth / 2);
		
		smashEyes.add(mesh);
		smashEyes.add(mesh2);
		
		j++;
		
		var end = pixelRow - j;
		for (j = 1; j < end; j++) {
			var mesh3 = mesh.clone();
			mesh3.position.x += addUnit * j;
			smashEyes.add(mesh3);
			
			var mesh4 = mesh2.clone();
			mesh4.position.x -= addUnit * j;
			smashEyes.add(mesh4);
		}
	}

	this.body = body;
	this.waist = waist;
	
	this.leftLink = leftLink;
	this.leftRacket = leftRacket;
	this.leftImpactWidth = bodyWidth / 2 + racketLength / 2;
	this.leftImpactHeight = bodyHeight / 2;
	
	this.rightLink = rightLink;
	this.rightRacket = rightRacket;
	this.rightImpactWidth = bodyWidth / 2 + racketLength / 2;
	this.rightImpactHeight = bodyHeight / 2;
	
	this.topLink = topLink;
	this.topRacket = topRacket;
	this.topImpactWidth = 0;
	this.topImpactAngle = -Math.PI / 15;
	
	this.impactClock = new THREE.Clock();
	this.impactClock.start();
	this.impactDelta = 1;
	this.impactCount = 0;
	
	this.court = null;
	this.limits = {
		xMin: 0,
		xMax: 0,
		zMin: 0,
		zMax: 0,
	};
	this.limitEpsilon = 0.1;
	
	this.shuttle = null;
	this.racketAttenuation = 0.9;
	
	this.bodySpeed = 1000;
	this.bodyAngularSpeed = Math.PI * 2;
	this.linkAngularSpeed = Math.PI * 2;
	
	this._netHeight = 1.55;
	this._netHeightDelta = 0.2;
	
	this.targetPosition = new THREE.Vector3(0, 0, 0);
	
	this.impactType = 'right';
	this.smashSpeed = Math.PI * 100;
	
	this.healthPercent = 100;
	this.healthAttenuation = 0.99;

	this.side = side;
	this.addUnit = addUnit;
	this.rightEyePixelRange = {
		first: rFirst,
		last: rLast,
	};
	this.leftEyePixelRange = {
		first: lFirst,
		last: lLast,
	};
	this.eyes = eyes;
	this.leftEyeBall = leftEyeBall;
	this.rightEyeBall = rightEyeBall;
	this.smashEyes = smashEyes;
	this.eyeStatus = 'common';
}

Robot.prototype = Object.defineProperties(Object.assign(Object.create(THREE.Object3D.prototype), {

	constructor: Robot,
	
	reset: function () {
		this.topLink.rotation.set(0, 0, 0);
		this.leftLink.rotation.set(0, 0, 0);
		this.rightLink.rotation.set(0, 0, 0);
		this.impactCount = 0;
		this.healthPercent = 100;
	},
	
	setLimits: function (limits, resetPosition) {
		this.limits = limits;
		if (resetPosition === true)
			this.position.set((limits.xMin + limits.xMax) / 2, 0, (limits.zMin + limits.zMax) / 2);
	},
	
	predictFallingTime: function (y) {
		return (y - this.shuttle.position.y) / this.shuttle.velocity.y;
	},
	
	predictFallingPosition: function (y) {
		var time = this.predictFallingTime(y);		
		return (time < -1e-2) ? null : this.shuttle.position.clone().addScaledVector(this.shuttle.velocity, time)
			.add(this.shuttle.position).divideScalar(2).setY(y);
	},
	
	update: function (delta) {
		this.onBeforeUpdate();
		var robotPosition;
		var link;
		var racket;
		var impactAngle;
		var impactSpeed;
		var impactHeight;
		var impactLength;
		var impactPosition;
		var localImpactPosition;
		if (this.impactType === 'smash') {
			var p0 = this.targetPosition;
			var p1 = new THREE.Vector3(0, this.netHeight + this.netHeightDelta, 1);
			var p2 = new THREE.Vector3(0, this.netHeight + this.netHeightDelta, -1);
			var p0p1 = p1.clone().sub(p0);
			var p0p2 = p2.clone().sub(p0);
			var n = p0p1.clone().cross(p0p2);
			
			var l = this.shuttle.velocity;
			var l0 = this.shuttle.position;
			var d = p0.clone().sub(l0).dot(n) / l.clone().dot(n);
			var p = l.clone().multiplyScalar(d).add(l0);
			
			link = this.topLink;
			racket = this.topRacket;
			impactAngle = Math.PI / 2 - p.clone().sub(p0).angleTo(new THREE.Vector3(0, 1, 0));
			impactSpeed = this.smashSpeed;
			impactPosition = (d > -1e4) ? p : null;
			impactHeight = p.y;
			impactLength = this.parameters.racketLength / 2;
			localImpactPosition = new THREE.Vector3(0, this.parameters.bodyHeight + this.parameters.racketLength / 2 * Math.cos(impactAngle), this.parameters.racketLength / 2 * Math.sin(impactAngle));
			if (this.eyeStatus === 'common') {
				this.body.remove(this.eyes);
				this.body.add(this.smashEyes);
				this.eyeStatus = 'smash';
			}
		} else if (this.impactType === 'top') {
			link = this.topLink;
			racket = this.topRacket;
			impactAngle = this.topImpactAngle;
			impactLength = this.parameters.racketLength / 2;
			localImpactPosition = new THREE.Vector3(0, this.parameters.bodyHeight + this.parameters.racketLength / 2 * Math.cos(impactAngle), this.parameters.racketLength / 2 * Math.sin(impactAngle));
			impactHeight = localImpactPosition.y;
			impactSpeed = this.getTopImpactSpeed(impactHeight);
			impactPosition = this.predictFallingPosition(impactHeight);
		if (this.eyeStatus === 'smash') {
			this.body.remove(this.smashEyes);
			this.body.add(this.eyes);
			this.eyeStatus = 'common';
		}
    } else {
			if (this.impactType === 'left') {
				link = this.leftLink;
				racket = this.leftRacket;
				impactHeight = this.leftImpactHeight;
				impactLength = this.leftImpactWidth;
				localImpactPosition = new THREE.Vector3(this.leftImpactWidth, this.leftImpactHeight, 0);
			} else if (this.impactType === 'right') {
				link = this.rightLink;
				racket = this.rightRacket;
				impactHeight = this.rightImpactHeight;
				impactLength = this.rightImpactWidth;
				localImpactPosition = new THREE.Vector3(-this.rightImpactWidth, this.rightImpactHeight, 0);
			}
			var impactParams = this.getImpactParams(impactHeight);
			impactAngle = impactParams[0];
			impactSpeed = impactParams[1];
			impactPosition = this.predictFallingPosition(impactHeight);
			if (this.eyeStatus === 'smash') {
				this.body.remove(this.smashEyes);
				this.body.add(this.eyes);
				this.eyeStatus = 'common';
			}
		}

		if (this.eyeStatus === 'common') {
			var shuttlePos = this.body.worldToLocal(this.shuttle.localToWorld(new THREE.Vector3()));
			if (shuttlePos.x > 5) {
				this.leftEyeBall.position.x = this.side / 2 - this.side * 0.3 / 2;
				this.rightEyeBall.position.x = this.side / 2 - this.side * 0.3 / 2;
			} else if (shuttlePos.x < -5) {
				this.leftEyeBall.position.x = -(this.side / 2 - this.side * 0.3 / 2);
				this.rightEyeBall.position.x = -(this.side / 2 - this.side * 0.3 / 2);
			} else {
				this.leftEyeBall.position.x = 0;
				this.rightEyeBall.position.x = 0;
			}
		}
		
		var bodyAngle;
		var rotationValue;
		if ((this.impactCount !== 0 && this.shuttle.impactCount !== this.impactCount + 1) ||
			this.shuttle.state === 'stop-ground' || this.shuttle.state === 'stop-net' ||
			!impactPosition || 
			(this.limits.xMin === 0 && impactPosition.x < 0) ||
			(this.limits.xMax === 0 && impactPosition.x > 0) ||
			impactPosition.x < this.limits.xMin + (this.limits.xMin - this.limits.xMax) * this.limitEpsilon ||
			impactPosition.x > this.limits.xMax + (this.limits.xMax - this.limits.xMin) * this.limitEpsilon || 
			impactPosition.z < this.limits.zMin + (this.limits.zMin - this.limits.zMax) * this.limitEpsilon ||
			impactPosition.z > this.limits.zMax + (this.limits.zMax - this.limits.zMin) * this.limitEpsilon) {
			bodyAngle = 0;
			impactAngle = 0;
			rotationValue = 0;
			robotPosition = new THREE.Vector3((this.limits.xMin + this.limits.xMax) / 2, 0, (this.limits.zMin + this.limits.zMax) / 2);
		} else {
			
			var bodyDirection = this.directionWorldToLocal(this.targetPosition.clone().sub(impactPosition).setY(0));
			bodyAngle = bodyDirection.angleTo(new THREE.Vector3(0, 0, 1)) * (bodyDirection.x < 0 ? -1 : 1);
			
			var racketPositionDelta = this.body.directionLocalToWorld(localImpactPosition.clone());
			robotPosition = impactPosition.clone().sub(racketPositionDelta);
			
			var fallingTime = this.predictFallingTime(impactHeight);
			var impactTime = Math.PI / impactSpeed;
			
			rotationValue = (fallingTime < 0 || fallingTime > impactTime) ? 0 :
				(fallingTime < impactTime / 2) ? THREE.Math.clamp(fallingTime * impactSpeed, 0, Math.PI) :
				THREE.Math.clamp(Math.PI / 2 - (fallingTime - impactTime / 2) * impactSpeed, 0, Math.PI);
		}
		
		link.angleB = 0;
		
		link.updateMatrixWorld();
		if (this.checkIntersect(racket, this.shuttle) && 
			this.impactClock.getDelta() > this.impactDelta) {
			var normal = link.directionLocalToWorld(new THREE.Vector3(0, 0, 1)).normalize();
			this.shuttle.impact(normal.clone().multiplyScalar(impactSpeed * impactLength), normal, this.racketAttenuation);
			this.impactCount = this.shuttle.impactCount;
			this.healthPercent *= this.healthAttenuation;
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
		
		var spherePosition = shuttlecock.localToTarget(shuttlecock.geometry.boundingSphere.center.clone(), this.parent);
		var lastSpherePosition = spherePosition.clone().addScaledVector(this.shuttle.velocity, -this.shuttle.lastDelta);
		
		this.parent.localToTarget(spherePosition, racket);
		this.parent.localToTarget(lastSpherePosition, racket);
		
		var isIntersect = false;
		
		var spherePositionDelta = lastSpherePosition.clone().sub(spherePosition);
		var mul = -spherePosition.z / spherePositionDelta.z;
		if (Math.abs(mul) <= 1 || mul * this.lastCheckMul < 0) {
			var circlePosition = spherePosition.clone().addScaledVector(spherePositionDelta, mul);
			isIntersect = this.checkIntersectPlaneAndCircle({
				min: {
					x: racket.geometry.boundingBox.min.x - circlePosition.x,
					y: racket.geometry.boundingBox.min.y - circlePosition.y
				},
				max: {
					x: racket.geometry.boundingBox.max.x - circlePosition.x,
					y: racket.geometry.boundingBox.max.y - circlePosition.y
				},
			}, shuttlecock.geometry.boundingSphere.radius);
			this.lastCheckMul = mul;
		}
		return isIntersect;
	},
	
	checkIntersectPlaneAndCircle: function (r, rad) {
		if (r.max.x < 0) { // left
			if (r.max.y < 0) { // left-bottom
				return (r.max.x * r.max.x + r.max.y * r.max.y < rad * rad);
			} else if (r.min.y > 0) { // left-top
				return (r.max.x * r.max.x + r.min.y * r.min.y < rad * rad);
			} else { // left-center
				return (Math.abs(r.max.x) < rad);
			}
		} else if (r.min.x > 0) { // right
			if (r.max.y < 0) { // right-bottom
				return (r.min.x * r.min.x + r.max.y * r.max.y < rad * rad);
			} else if (r.min.y > 0) { // right-top
				return (r.min.x * r.min.x + r.min.y * r.min.y < rad * rad);
			} else { // right-center
				return (Math.abs(r.min.x) < rad);
			}
		} else { // center
			if (r.max.y < 0) { // center-bottom
				return (Math.abs(r.max.y) < rad);
			} else if (r.min.y > 0) { // center-top
				return (Math.abs(r.min.y) < rad);
			} else { // center-center
				return true;
			}
		}
	},
	
	getTopImpactSpeed: function (impactHeight) {
		var hit = this.shuttle.position.clone().setY(0);	//球現在的位置
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
	
	getImpactParams: function (impactHeight) {
		var as = this.hitAngleSpeed(); //算力道角度
		var impactAngle = Math.atan((this.netHeight - impactHeight) / (as[0] * as[2])); //(網高 - 擊球高度)/離網的距離
		var impactSpeed = Math.PI * as[1]; //手臂旋轉角速度;
		return [impactAngle, impactSpeed];
	},
	
	hitAngleSpeed: function() {
		var forceTable = this.forceTable;

		var i, j;
		var hit = this.shuttle.position.clone().setY(0);
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
	
}), {
	
	netHeight: {
		get: function () {
			return this._netHeight * this.shuttle.meter2unit;
		},
		set: function (value) {
			this._netHeight = value;
		},
	},
	
	netHeightDelta: {
		get: function () {
			return this._netHeightDelta * this.shuttle.meter2unit;
		},
		set: function (value) {
			this._netHeightDelta = value;
		},
	},
	
});

export { Robot };
