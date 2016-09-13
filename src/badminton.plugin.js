if (THREE.Object3D.prototype.directionLocalToWorld === undefined) {
	THREE.Object3D.prototype.directionLocalToWorld = function (direction) {
		var origin = this.localToWorld(new THREE.Vector3(0, 0, 0));
		return this.localToWorld(direction).sub(origin);
	}
}

if (THREE.Object3D.prototype.directionWorldToLocal === undefined) {
	THREE.Object3D.prototype.directionWorldToLocal = function (direction) {
		var origin = this.localToWorld(new THREE.Vector3(0, 0, 0));
		return this.worldToLocal(direction.add(origin));
	}
}

if (THREE.Object3D.prototype.localToTarget === undefined) {
	THREE.Object3D.prototype.localToTarget = function (vector, target) {
		return target.worldToLocal(this.localToWorld(vector));
	}
}