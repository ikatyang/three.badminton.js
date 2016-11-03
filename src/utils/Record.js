function Record(shuttlecock, robot1, robot2, game, scoreboard, targetPoint1, targetPoint2, data) {
	
	this.data = data || {
		init: {
			score1: game.score1,
			score2: game.score2,
			nthScore: game.nthScore,
			firstPlayer: game.lastWinner,
			shuttlecock: this.getShuttlecockData(shuttlecock),
			robot1: this.getRobotInitData(robot1),
			robot2: this.getRobotInitData(robot2),
		},
		next: [],
	};
	
	this.shuttlecock = shuttlecock;
	this.robot1 = robot1;
	this.robot2 = robot2;
	this.game = game;
	this.scoreboard = scoreboard;
	this.targetPoint1 = targetPoint1;
	this.targetPoint2 = targetPoint2;
	
	this.resetCounter();
	this.playing = false;
}

Record.prototype = {

	constructor: Record,
	
	recordRobot: function (robot) {
		this.data.next.push(this.getRobotData(robot));
	},
	
	resetCounter: function () {
		this.counter = 0;
	},
	
	play: function () {
		this.resetCounter();
		
		this.game.score1 = this.data.init.score1;
		this.game.score2 = this.data.init.score2;
		this.game.nthScore = this.data.init.nthScore;
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
			position: shuttlecock.position.toArray(),
			rotation: shuttlecock.rotation.toArray(),
			velocity: shuttlecock.velocity.toArray(),
			impactCount: shuttlecock.impactCount,
		};
	},
	
	setShuttlecock: function (shuttlecock, data) {
		shuttlecock.state = 'move';
		shuttlecock.position.fromArray(data.position);
		shuttlecock.rotation.fromArray(data.rotation);
		shuttlecock.velocity.fromArray(data.velocity);
		shuttlecock.impactCount = data.impactCount;
	},
	
	getRobotInitData: function (robot) {
		return {
			limits: robot.limits,
			impactCount: robot.impactCount,
			healthPercent: robot.healthPercent,
			bodyAngle: robot.body.rotation.y,
			position: robot.position.toArray(),
			rotation: robot.rotation.toArray(),
		};
	},
	
	setRobotInit: function (robot, data) {
		robot.limits = data.limits;
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

export { Record };