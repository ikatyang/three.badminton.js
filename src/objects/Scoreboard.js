import { ScoreboardCard } from './ScoreboardCard.js';

function Scoreboard(width, height, depth, cardGap) {

	THREE.Object3D.call(this);
	
	this.parameters = {
		width: width,
		height: height,
		depth: depth,
		cardGap: cardGap,
	};
	
	var planeAngle = Math.atan((depth / 2) / height);
	var planeHeight = Math.sqrt(Math.pow(depth / 2, 2) + Math.pow(height, 2));
	
	var frontBoard = new THREE.Mesh(
		new THREE.PlaneGeometry(width, planeHeight),
		new THREE.MeshNormalMaterial({ side: THREE.DoubleSide }));
	frontBoard.position.y = height / 2;
	frontBoard.position.z = depth / 4;
	frontBoard.rotation.x = -planeAngle;
	this.add(frontBoard);
	
	var backBoard = new THREE.Mesh(
		new THREE.PlaneGeometry(width, planeHeight),
		new THREE.MeshNormalMaterial({ side: THREE.DoubleSide }));
	backBoard.position.y = height / 2;
	backBoard.position.z = -depth / 4;
	backBoard.rotation.x = planeAngle;
	this.add(backBoard);
	
	var bottomBoard = new THREE.Mesh(
		new THREE.PlaneGeometry(width, depth),
		new THREE.MeshNormalMaterial({ side: THREE.DoubleSide }));
	bottomBoard.rotation.x = Math.PI / 2;
	this.add(bottomBoard);
	
	var cardHeight = planeHeight - cardGap * 2;
	var cardWidth = (width - cardGap * 5) / 3;
	var cardDepth = 2;
	
	var ringRadius = 15;
	var ringTub = 1;
	var ringPos = 5;
	
	var cardRings = new THREE.Object3D();
	cardRings.position.y = height * 1.01;
	this.add(cardRings);
	
	var ringPositions = [
		-cardGap * 1.5 - cardWidth * 1.25,
		-cardGap * 1.5 - cardWidth * 1.00,
		-cardGap * 1.5 - cardWidth * 0.75,
		-cardGap * 0.5 - cardWidth * 0.25,
		+cardGap * 0.5 + cardWidth * 0.25,
		+cardGap * 1.5 + cardWidth * 0.75,
		+cardGap * 1.5 + cardWidth * 1.00,
		+cardGap * 1.5 + cardWidth * 1.25,
	];
	
	for (var i = 0; i < ringPositions.length; i++) {
		var ring = new THREE.Mesh(
			new THREE.TorusGeometry(ringRadius, ringTub, 16, 16),
			new THREE.MeshNormalMaterial({ side: THREE.DoubleSide }));
		ring.position.x = ringPositions[i];
		ring.rotation.y = Math.PI / 2;
		cardRings.add(ring);
	}
	
	this.frontCards = [
		this.frontCard1 = createCard('0', 1.0, ringPositions[1], Math.PI * 2 - planeAngle, true),
		this.frontSmallCard1 = createCard('0', 0.5, ringPositions[3], Math.PI * 2 - planeAngle, true),
		this.frontSmallCard2 = createCard('0', 0.5, ringPositions[4], Math.PI * 2 - planeAngle, true),
		this.frontCard2 = createCard('0', 1.0, ringPositions[6], Math.PI * 2 - planeAngle, true),
	];
	
	this.backCards = [
		this.backCard1 = createCard(null, 1.0, ringPositions[1], planeAngle, true),
		this.backSmallCard1 = createCard(null, 0.5, ringPositions[3], planeAngle, true),
		this.backSmallCard2 = createCard(null, 0.5, ringPositions[4], planeAngle, true),
		this.backCard2 = createCard(null, 1.0, ringPositions[6], planeAngle, true),
	];
	
	this.animateCards = [
		this.animateCard1 = createCard(null, 1.0, ringPositions[1], 0, false),
		this.animateSmallCard1 = createCard(null, 0.5, ringPositions[3], 0, false),
		this.animateSmallCard2 = createCard(null, 0.5, ringPositions[4], 0, false),
		this.animateCard2 = createCard(null, 1.0, ringPositions[6], 0, false),
	];
	
	function createCard(text, scale, posX, angle, visible) {
		var card = new ScoreboardCard(cardWidth * scale, cardHeight * scale);
		card.setText(text);
		card.position.x = posX;
		card.rotation.x = angle;
		card.visible = visible;
		card.plane.position.y = -cardHeight * scale / 2 - cardGap;
		cardRings.add(card);
		return card;
	}
	
	this.speed = Math.PI * 2;
	this.actions = [null, null, null, null];
}

Scoreboard.prototype = Object.assign(Object.create(THREE.Object3D.prototype), {

	constructor: Scoreboard,
	
	init: function () {
		var cards = [].concat(this.frontCards, this.backCards, this.animateCards);
		for (var i = 0; i < cards.length; i++)
			cards[i].setText('0');
	},
	
	setCardAction: function (cardNo, text, direction) {
		var frontCard = this.frontCards[cardNo];
		var backCard = this.backCards[cardNo];
		var animateCard = this.animateCards[cardNo];
		if (direction === 'next') {
			animateCard.setText(text);
			animateCard.rotation.x = backCard.rotation.x;
			animateCard.visible = true;
		} else {
			animateCard.setText(frontCard.text);
			animateCard.rotation.x = frontCard.rotation.x;
			animateCard.visible = true;
			frontCard.setText(text);
		}
		this.actions[cardNo] = {
			text: text,
			cardNo: cardNo,
			direction: direction,
			frontCard: frontCard,
			backCard: backCard,
			animateCard: animateCard,
		};
	},
	
	update: function (delta) {
		for (var i = 0; i < this.actions.length; i++)
			if (this.actions[i] !== null)
				this.updateCard(delta, this.actions[i]);
	},
	
	updateCard: function (delta, action) {
		var targetCard = (action.direction === 'next') ? action.frontCard : action.backCard;
		
		var cardAngleDeltaFull = targetCard.rotation.x - action.animateCard.rotation.x;
		var cardAngleDeltaPart = this.speed * delta * (cardAngleDeltaFull < 0 ? -1 : 1);
		var cardAngleDelta = Math.abs(cardAngleDeltaFull) < Math.abs(cardAngleDeltaPart) ? cardAngleDeltaFull : cardAngleDeltaPart;
		action.animateCard.rotation.x += cardAngleDelta;
		
		if (action.animateCard.rotation.x === targetCard.rotation.x) {
			if (action.direction === 'next')
				action.frontCard.setText(action.text);
			action.animateCard.visible = false;
			this.actions[action.cardNo] = null;
		}
	},
	
});

export { Scoreboard };