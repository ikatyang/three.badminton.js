function ScoreboardCard(planeGeometry, numberMaterial) {

	THREE.Mesh.call(this, planeGeometry, numberMaterial);
}

ScoreboardCard.prototype = Object.defineProperties(Object.assign(Object.create(THREE.Mesh.prototype), {

	constructor: ScoreboardCard,
	
}), {
	
	number: {
		
		get: function () {
			return this.material.getNumber();
		},
		
		set: function (number) {
			this.material.setNumber(number);
		},
		
	},
	
});

export { ScoreboardCard };