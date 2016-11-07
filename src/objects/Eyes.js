function Eyes(bodyHeight, pixelRow, addUnit, lFirst, rFirst, pixelSide) {

	THREE.Object3D.call(this);

	var geometry = new THREE.PlaneGeometry(pixelSide, pixelSide);
	var material = new THREE.MeshBasicMaterial({side: THREE.DoubleSide});

	for (var i = 0; i < 2; i++) {
		var x = (i === 0) ? rFirst.x : lFirst.x;
		var y = (i === 0) ? rFirst.y : lFirst.y;
		for (var j = Math.floor(pixelRow * 0.2); j < Math.ceil(pixelRow * 0.3); j++) {
			for (var k = 0; k < pixelRow; k++) {
				var mesh = new THREE.Mesh(geometry, material);
				mesh.position.set(k * addUnit + x, y - j * addUnit, 1.1 + bodyHeight * 1 / 9);
				this.add(mesh);
			}
		}
	}
}

Eyes.prototype = Object.create(THREE.Object3D.prototype);
Eyes.prototype.constructor = Eyes;

export { Eyes };
