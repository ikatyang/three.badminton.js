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
	this.smashSpeed = Math.PI * 125;
	this.maxFlyHeight = Infinity;
	
	this.defaultImpactType = 'right';
	this.targetPosition = new THREE.Vector3(0, 0, 0);
	
	this.impactDelta = 1;
	
	this.responsibleArea = new THREE.Box3(
		new THREE.Vector3(0, 0, 0),
		new THREE.Vector3(0, 0, 0));
	
	this.shuttlecock = null;
	this.racketRestitutionCoefficient = 0.1;
	
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
	
	canSmash: function (impactPosition) {
		impactPosition = impactPosition || this.getImpactParamsSmash().impactPosition;
		return (impactPosition && impactPosition.y - this.parameters.bodySize.y < this.maxFlyHeight);
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
			impactPosition.z <= this.responsibleArea.max.z &&
			(this.impactType !== 'smash' || (this.impactType === 'smash' && this.canSmash(impactPosition)))) {
			
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
			
			this.shuttlecock.impact(normal.clone().multiplyScalar(strength), normal, this.racketRestitutionCoefficient);
			
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

export { Robot };
