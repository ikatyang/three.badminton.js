function EyeBall(bodyHeight, pixelRow, addUnit, First, pixelSide) {

  THREE.Object3D.call(this);

  var geometry = new THREE.PlaneGeometry(pixelSide, pixelSide);
  var material = new THREE.MeshBasicMaterial({side: THREE.DoubleSide});

  var x = First.x;
  var y = First.y;
  for (var j = Math.floor(pixelRow * 0.3); j < Math.ceil(pixelRow * 0.9); j++) {
    for (var k = Math.floor(pixelRow * 0.35); k < Math.ceil(pixelRow * 0.65); k++) {
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(k * addUnit + x, y - j * addUnit, 1.1 + bodyHeight * 1 / 9);
      this.add(mesh);
    }
  }

}

EyeBall.prototype = Object.create(THREE.Object3D.prototype);
EyeBall.prototype.constructor = EyeBall;

export { EyeBall };
