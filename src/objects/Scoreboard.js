import { ScoreboardCard } from './ScoreboardCard.js'
import { NumberMaterial } from '../materials/NumberMaterial.js';

function Scoreboard(scoreboardGeometry, material) {

	THREE.Mesh.call(this, scoreboardGeometry, material);
	
	this.actions = [];
	this.frontCards = [];
	this.backCards = [];
	this.transitionCards = [];
	
	this.speed = Math.PI * 2;
}

Scoreboard.prototype = Object.assign(Object.create(THREE.Mesh.prototype), {

	constructor: Scoreboard,
	
	init: function () {
		for (var i = 0; i < this.frontCards.length; i++) {
			this.frontCards[i].number = 0;
			this.transitionCards[i].number = this.backCards[i].number = 1;
			this.transitionCards[i].visible = false;
		}
	},
	
	addCard: function (width, height, position, numberMaterialParameters) {
		
		var parameters = {};
		for (var key in numberMaterialParameters)
			parameters[key] = numberMaterialParameters[key];
		parameters.number = parameters.number || 0;
		
		var frontCardFrame = new THREE.Object3D();
		frontCardFrame.position.set(position.x, this.geometry.parameters.height * 1.01, 0);
		frontCardFrame.rotation.set(Math.PI * 2 - this.geometry.parameters.planeAngle, 0, 0);
		this.add(frontCardFrame);
		
		var backCardFrame = frontCardFrame.clone();
		backCardFrame.rotation.x = this.geometry.parameters.planeAngle;
		this.add(backCardFrame);
		
		var transitionFrame = backCardFrame.clone();
		this.add(transitionFrame);
		
		var frontCard = new ScoreboardCard(
			new THREE.PlaneGeometry(width, height),
			new NumberMaterial(parameters));
		frontCard.position.set(0, -position.y - height / 2, 0);
		frontCardFrame.add(frontCard);
		this.frontCards.push(frontCard);
		
		parameters.number++;
		
		var backCard = new ScoreboardCard(
			new THREE.PlaneGeometry(width, height),
			new NumberMaterial(parameters));
		backCard.position.copy(frontCard.position);
		backCardFrame.add(backCard);
		this.backCards.push(backCard);
		
		var transitionCard = new ScoreboardCard(
			new THREE.PlaneGeometry(width, height),
			new NumberMaterial(parameters));
		transitionCard.position.copy(frontCard.position);
		transitionFrame.add(transitionCard);
		this.transitionCards.push(transitionCard);
		
		transitionCard.visible = false;
		
		this.actions.push(null);
	},
	
	addRings: function (ring, ringXs) {
		for (var i = 0; i < ringXs.length; i++) {
			var ringX = ringXs[i];
			var ringCloned = ring.clone();
			ringCloned.position.set(ringX, this.geometry.parameters.height, 0);
			this.add(ringCloned);
		}
	},
	
	setAction: function (index, number, direction) {
		var frontCard = this.frontCards[index];
		var backCard = this.backCards[index];
		var transitionCard = this.transitionCards[index];
		if (direction === 'next') {
			backCard.number = number + 1;
			transitionCard.number = number;
			transitionCard.parent.rotation.x = backCard.parent.rotation.x;
		} else {
			transitionCard.number = frontCard.number;
			transitionCard.parent.rotation.x = frontCard.parent.rotation.x;
			frontCard.number = number;
		}
		transitionCard.visible = true;
		this.actions[index] = {
			index: index,
			number: number,
			direction: direction,
		};
	},
	
	update: function (delta) {
		for (var i = 0; i < this.actions.length; i++)
			if (this.actions[i] !== null)
				this.updateCard(delta, this.actions[i]);
	},
	
	updateCard: function (delta, action) {
		var frontCard = this.frontCards[action.index];
		var backCard = this.backCards[action.index];
		var transitionCard = this.transitionCards[action.index];
		var targetCard = (action.direction === 'next') ? frontCard : backCard;
		
		var cardAngleDeltaFull = targetCard.parent.rotation.x - transitionCard.parent.rotation.x;
		var cardAngleDeltaPart = this.speed * delta * (cardAngleDeltaFull < 0 ? -1 : 1);
		var cardAngleDelta = Math.abs(cardAngleDeltaFull) < Math.abs(cardAngleDeltaPart) ? cardAngleDeltaFull : cardAngleDeltaPart;
		transitionCard.parent.rotation.x += cardAngleDelta;
		
		if (transitionCard.parent.rotation.x === targetCard.parent.rotation.x) {
			if (action.direction === 'next')
				frontCard.number = action.number;
			else
				backCard.number = transitionCard.number;
			transitionCard.visible = false;
			this.actions[action.index] = null;
		}
	},
	
});

export { Scoreboard };