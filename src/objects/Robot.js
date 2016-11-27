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
	
	this.healthAttenuation = 0.99;
	
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
		return (time < -1e-2) ? null : this.shuttlecock.position.clone().addScaledVector(this.shuttlecock.velocity, time)
			.add(this.shuttlecock.position).divideScalar(2).setY(y);
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
		var robotPosition = this.responsibleArea.getCenter();
		
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
			
			this.shuttlecock.impact(normal.clone().multiplyScalar(impactSpeed * this.getRacketImpactLength()), normal, this.racketAttenuation);
			
			this.impactCount = this.shuttlecock.impactCount;
			this.healthPercent *= this.healthAttenuation;
			
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
	
	getImpactAngleAndSpeed: function (impactHeight, hitDist, targetDist) {
		hitDist = hitDist === undefined ? this.position.x : hitDist;
		targetDist = targetDist === undefined ? -this.position.x : targetDist;
		var as = this.angleAndSpeed(Math.abs(hitDist), Math.abs(targetDist));
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

export { Robot };
