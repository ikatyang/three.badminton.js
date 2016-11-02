function Game(court, shuttle, firstPlayer) {

	this.court = court;
	this.shuttle = shuttle;
	
	this.nthScore = 0;
	this.score1 = 0;
	this.score2 = 0;
	this.lastWinner = (firstPlayer !== undefined) ? firstPlayer : 1;
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
		this.shuttle.impactCount = 0;
		this.shuttle.state = 'move';
	},
	
	update: function (delta) {
		if (this.nthScore !== this.score1 + this.score2) {
			if (this.shuttle.state === 'stop-net') {
				if (this.shuttle.impactCount % 2 === 0) {
					this.lastWinner = this.lastWinner;
				} else {
					this.lastWinner = this.lastWinner % 2 + 1;
				}
				this.lastWinnerScore++;
				this.onScoreChange();
			} else if (this.shuttle.state === 'stop-ground') {
				var area = (this.shuttle.impactCount <= 1) ?
					((this.lastWinner === 1) ?
						this.court.getFirstArea2(this.score1) : 
						this.court.getFirstArea1(this.score2)) :
					((this.lastWinner === 1) ?
						((this.shuttle.impactCount % 2 === 1) ?
							this.court.getArea2() :
							this.court.getArea1()) : 
						((this.shuttle.impactCount % 2 === 1) ?
							this.court.getArea1() :
							this.court.getArea2()));
				var position = this.shuttle.localToTarget(new THREE.Vector3(0, 0, 0), this.court);
				if (position.x >= area.xMin && position.x <= area.xMax &&
					position.z >= area.zMin && position.z <= area.zMax) {
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
				this.onScoreChange();
			}
		}
	},
	
	onScoreChange: function () {},
	
};

export { Game };