function Robot(bodyMesh, racketMesh) {

	THREE.Object3D.call(this);
	
	var bodyBox = new THREE.Box3().setFromLocalObject(bodyMesh);
	var bodySize = bodyBox.getSize();
	var bodyCenter = bodyBox.getCenter();
	
	var racketBox = new THREE.Box3().setFromLocalObject(racketMesh);
	var racketSize = racketBox.getSize();
	var racketCenter = racketBox.getCenter();
	
	var bodyWidth = bodySize.x;
	var bodyHeight = bodySize.y;
	var bodyDepth = bodySize.z;
	
	var racketLength = racketSize.y;
	var racketWidth = racketSize.x;
	var racketDepth = racketSize.z;
	
	this.parameters = {
		bodySize: bodySize,
		bodyCenter: bodyCenter,
		racketSize: racketSize,
		racketCenter: racketCenter,
		
		bodyWidth: bodyWidth,
		bodyHeight: bodyHeight, 
		bodyDepth: bodyDepth,
		racketLength: racketLength,
		racketWidth: racketWidth,
		racketDepth: racketDepth,
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

export { Robot };