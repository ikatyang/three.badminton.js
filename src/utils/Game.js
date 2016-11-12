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

export { Game };