import { NumberMaterial } from '../materials/NumberMaterial.js';

function ScoreboardCard(width, height) {

	THREE.Object3D.call(this);
	
	this.parameters = {
		width: width,
		height: height,
	};
	
	var plane = new THREE.Mesh(
		new THREE.PlaneGeometry(width, height),
		new NumberMaterial({ side: THREE.DoubleSide, numbers: 0 }));
	this.add(plane);
	
	this.plane = plane;
	this.textMesh = null;
}

ScoreboardCard.prototype = Object.assign(Object.create(THREE.Object3D.prototype), {

	constructor: ScoreboardCard,
	
	setText: function (text) {
		this.text = text;
		this.plane.material.setNumber(+text);
	},
	
});

export { ScoreboardCard };