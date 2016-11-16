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
		
		if (this.nthScore !== this.scoreA + this.scoreB) {
			
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

export { Game };