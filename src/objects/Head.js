function Head(bodyHeight) {

  THREE.Object3D.call(this);

  var sphere = new THREE.Mesh(
    new THREE.SphereGeometry(bodyHeight * 1 / 6, 32, 32, Math.PI * 2 / 3, Math.PI * 5 / 3), 
    new THREE.MeshBasicMaterial({ color: 0x220000, side: THREE.DoubleSide})
  );
  sphere.position.set(0, bodyHeight * 1 / 3, 0);
  sphere.rotation.z = Math.PI / 2;
console.log(this, this.add)
  this.add (sphere);

  var monitor = new THREE.Mesh(
    new THREE.BoxGeometry(bodyHeight * 2 / 9, bodyHeight * 1 / 8, 2),
    new THREE.MeshBasicMaterial({color: 0x000000})
  );
  monitor.position.set(0, bodyHeight * 1 / 3, bodyHeight * 1 / 9);
  this.add (monitor);
}

Head.prototype = Object.create(THREE.Object3D.prototype);
Head.prototype.constructor = Head;

export { Head };
