function SmashEyes(bodyHeight, pixelRow, addUnit, lFirst, rFirst, pixelSide) {

  THREE.Object3D.call(this);

  var geometry = new THREE.PlaneGeometry(pixelSide, pixelSide);
  var material = new THREE.MeshBasicMaterial({side: THREE.DoubleSide});
  //殺球槓
  var nowX = 0;
  var i;
  for (i = 0; i < Math.ceil(pixelRow * 0.5); i++){
    for (var j = 0; j < 2 && nowX < pixelRow; j++, nowX++) {
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(rFirst.clone().x + nowX * addUnit, rFirst.clone().y - i * addUnit, 1.1 + bodyHeight * 1 / 9);
      this.add(mesh);
			
      var mesh4 = mesh.clone();
      mesh4.position.y -= addUnit;
      this.add(mesh4);
			
      var mesh2 = mesh.clone();
      mesh2.position.set(lFirst.clone().x + (pixelRow - nowX) * addUnit, lFirst.clone().y - i * addUnit, 1.1 + bodyHeight * 1 / 9);
      this.add(mesh2);
			
      var mesh3 = mesh2.clone();
      mesh3.position.y -= addUnit;
      this.add(mesh3);
    }
  }
	
  //珠
  for (; i < pixelRow; i++) {
    var j = Math.floor(pixelRow * 0.7);
		
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(rFirst.clone().x + j * addUnit, rFirst.clone().y - i * addUnit, 1.1 + bodyHeight * 1 / 9);
		
    var mesh2 = new THREE.Mesh(geometry, material);
    mesh2.position.set(lFirst.clone().x + (pixelRow - j) * addUnit, lFirst.clone().y - i * addUnit, 1.1 + bodyHeight * 1 / 9);
		
    this.add(mesh);
    this.add(mesh2);
		
    j++;
		
    var end = pixelRow - j;
    for (j = 1; j < end; j++) {
      var mesh3 = mesh.clone();
      mesh3.position.x += addUnit * j;
      this.add(mesh3);
			
      var mesh4 = mesh2.clone();
      mesh4.position.x -= addUnit * j;
      this.add(mesh4);
    }
  }
}

SmashEyes.prototype = Object.create(THREE.Object3D.prototype);
SmashEyes.prototype.constructor = SmashEyes;

export { SmashEyes };
