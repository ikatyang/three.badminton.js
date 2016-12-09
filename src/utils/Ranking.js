function Ranking(localStorage) {
	
	this.localStorage = localStorage;
	
	this.separaor = ',';
	this.namespace = 'three.badminton.js::ranking';
	this.maxCount = Infinity;
}

Ranking.prototype = {

	constructor: Ranking,
	
	getRanks: function () {
		var ranksString = this.localStorage.getItem(this.namespace);
		if (ranksString) {
			var ranks = ranksString.split(this.separaor);
			for (var i = 0; i < ranks.length; i++)
				ranks[i] = Number(ranks[i]);
			return ranks;
		} else {
			return [];
		}
	},
	
	addRank: function (rank) {
		var ranks = this.getRanks();
		ranks.push(rank);
		ranks.sort(function (a, b) {
			return b - a;
		});
		if (ranks.length > this.maxCount)
			ranks.length = this.maxCount;
		this.localStorage.setItem(this.namespace, ranks.join(this.separaor));
	},
	
	getBestRank: function () {
		var ranks = this.getRanks();
		return ranks[0] || 0;
	},
	
};

export { Ranking };