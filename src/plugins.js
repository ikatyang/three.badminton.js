window.performance = window.performance || Date;

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
	THREE.Object3D.prototype.localToTarget = function (object, target) {
		if (object instanceof THREE.Vector3) {
			return target.worldToLocal(this.localToWorld(object));
		} else if (object instanceof THREE.Box3) {
			var p1 = this.localToTarget(object.min.clone(), target);
			var p2 = this.localToTarget(object.max.clone(), target);
			return object.setFromPoints([p1, p2]);
		}
	}
}

if (THREE.Box3.prototype.fromArray === undefined) {
	THREE.Box3.prototype.fromArray = function (array) {
		this.setFromArray(array);
		return this;
	}
}

if (THREE.Box3.prototype.toArray === undefined) {
	THREE.Box3.prototype.toArray = function () {
		return this.min.toArray().concat(this.max.toArray());
	}
}