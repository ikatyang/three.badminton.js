function Game(firstPlayer) {
	
	this.init(firstPlayer);
	
	this.scoreboard = null;
}

Game.prototype = {

	constructor: Game,
	
	init: function (firstPlayer) {
		this.nthScore = 0;
		this.score1 = 0;
		this.score2 = 0;
		this.lastWinner = (firstPlayer !== undefined) ? firstPlayer : 1;
	},
	
	get lastWinnerScore() {
		return this['score' + this.lastWinner];
	},
	set lastWinnerScore(value) {
		this['score' + this.lastWinner] = value;
	},
	
	nextScore: function () {
		this.nthScore++;
	},
	
	checkScore: function (shuttlecock, court) {
		if (this.nthScore !== this.score1 + this.score2) {
			if (shuttlecock.hasState('hung') || (shuttlecock.hasState('toppled') && shuttlecock.hasState('under-net'))) {
				if (shuttlecock.impactCount % 2 === 0) {
					this.lastWinner = this.lastWinner;
				} else {
					this.lastWinner = this.lastWinner % 2 + 1;
				}
				this.lastWinnerScore++;
				this.updateScoreboard();
				this.onScoreChange();
			} else if (shuttlecock.hasState('toppled')) {
				var area = (shuttlecock.impactCount <= 1) ?
					((this.lastWinner === 1) ?
						court.getArea('SingleFirst' + (this.score1 % 2 === 0 ? 'Right' : 'Left') + 'B') : 
						court.getArea('SingleFirst' + (this.score2 % 2 === 0 ? 'Right' : 'Left') + 'A')) :
					((this.lastWinner === 1) ?
						((shuttlecock.impactCount % 2 === 1) ?
							court.getAreaSingleB() :
							court.getAreaSingleA()) : 
						((shuttlecock.impactCount % 2 === 1) ?
							court.getAreaSingleA() :
							court.getAreaSingleB()));
				court.localToTarget(area, shuttlecock.parent);
				var position = shuttlecock.localToTarget(new THREE.Vector3(0, 0, 0), court);
				if (position.x >= area.min.x && position.x <= area.max.x &&
					position.z >= area.min.z && position.z <= area.max.z) {
					if (shuttlecock.impactCount % 2 === 1) {
						this.lastWinner = this.lastWinner;
					} else {
						this.lastWinner = this.lastWinner % 2 + 1;
					}
				} else {
					if (shuttlecock.impactCount % 2 === 0) {
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

export { Game };