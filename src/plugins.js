window.performance = window.performance || Date;

if (THREE.Object3D.prototype.localToTarget === undefined) {
	THREE.Object3D.prototype.localToTarget = function (object, target, type) {
		if (object instanceof THREE.Vector3) {
			switch (type) {
				case 'direction':
					return this.localToTarget(object, target).sub(this.localToTarget(new THREE.Vector3(0, 0, 0), target));
				default:
					return target.worldToLocal(this.localToWorld(object));
			}
		} else if (object instanceof THREE.Box3) {
			var p1 = this.localToTarget(object.min.clone(), target);
			var p2 = this.localToTarget(object.max.clone(), target);
			return object.setFromPoints([p1, p2]);
		}
	}
}

if (THREE.Box3.prototype.setFromLocalObject === undefined) {
	THREE.Box3.prototype.setFromLocalObject = function (object) {
		var box = new THREE.Box3().setFromObject(object);
		var p1 = object.worldToLocal(box.min);
		var p2 = object.worldToLocal(box.max);
		return this.setFromPoints([p1, p2]);
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