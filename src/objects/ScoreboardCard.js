function ScoreboardCard(width, height, font) {

	THREE.Object3D.call(this);
	
	this.parameters = {
		width: width,
		height: height,
		font: font,
	};
	
	var plane = new THREE.Mesh(
		new THREE.PlaneGeometry(width, height),
		new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
	this.add(plane);
	
	this.plane = plane;
	this.textMesh = null;
}

ScoreboardCard.prototype = Object.assign(Object.create(THREE.Object3D.prototype), {

	constructor: ScoreboardCard,
	
	setText: function (text) {
		this.text = text;
		if (this.textMesh) {
			this.plane.remove(this.textMesh);
			this.textMesh = null;
		}
		if (text !== null) {
			var mesh = new THREE.Mesh(
				new THREE.TextGeometry(text, {
					font: this.parameters.font,
					height: 0.1,
				}),
				new THREE.MeshNormalMaterial());
				mesh.geometry.computeBoundingBox();
			var size = {
				x: mesh.geometry.boundingBox.max.x - mesh.geometry.boundingBox.min.x,
				y: mesh.geometry.boundingBox.max.y - mesh.geometry.boundingBox.min.y,
			};
			mesh.scale.set(this.parameters.width * 0.8 / size.x, this.parameters.height * 0.8 / size.y, 1);		
			mesh.position.x = -0.5 * this.parameters.width * 0.9;
			mesh.position.y = -0.5 * this.parameters.height * 0.9;
			mesh.position.z = 0.1;
			this.plane.add(mesh);
			this.textMesh = mesh;
		}
	},
	
});

export { ScoreboardCard };