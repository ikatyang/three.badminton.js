function ScoreBoard(width, height, depth, cardGap) {

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
	
	var _this = this;
	
	var loader = new THREE.FontLoader();
	loader.load('http://threejs.org/examples/fonts/gentilis_regular.typeface.json', function (font) {
	
		_this.font = font;
		
		var card1 = _this._createCard('0', cardWidth, cardHeight);
		card1.position.x = ringPositions[1];
		card1.rotation.x = -planeAngle;
		cardRings.add(card1);
		
		var card2 = _this._createCard('0', cardWidth, cardHeight);
		card2.position.x = ringPositions[6];
		card2.rotation.x = -planeAngle;
		cardRings.add(card2);
		
		var smallCard1 = _this._createCard('0', cardWidth / 2, cardHeight / 2);
		smallCard1.position.x = ringPositions[3];
		smallCard1.rotation.x = -planeAngle;
		cardRings.add(smallCard1);
		
		var smallCard2 = _this._createCard('0', cardWidth / 2, cardHeight / 2);
		smallCard2.position.x = ringPositions[4];
		smallCard2.rotation.x = -planeAngle;
		cardRings.add(smallCard2);
	});
}

ScoreBoard.prototype = Object.defineProperties(Object.assign(Object.create(THREE.Object3D.prototype), {

	constructor: ScoreBoard,
	
	_createCard: function (text, width, height) {
		var card = new THREE.Object3D();
		var mesh = new THREE.Mesh(
			new THREE.PlaneGeometry(width, height),
			new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
		mesh.position.y = -height / 2 - this.parameters.cardGap;
		var text = new THREE.Mesh(
			new THREE.TextGeometry(text, {
				font: this.font,
				height: 0.01,
			}),
			new THREE.MeshNormalMaterial());
		text.geometry.computeBoundingBox();
		var size = {
			x: text.geometry.boundingBox.max.x - text.geometry.boundingBox.min.x,
			y: text.geometry.boundingBox.max.y - text.geometry.boundingBox.min.y,
		};
		text.scale.set(width * 0.8 / size.x, height * 0.8 / size.y, 1);		
		text.position.x = -0.5 * width * 0.9;
		text.position.y = -0.5 * height * 0.9;
		mesh.add(text);
		card.add(mesh);
		return card;
	},
	
}), {
	
	// TODO
	
});

export { ScoreBoard };