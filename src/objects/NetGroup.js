function NetGroup(netMesh, postMesh) {
	
	THREE.Object3D.call(this);
	
	var netBox = new THREE.Box3().setFromLocalObject(netMesh);
	var netSize = netBox.getSize();
	var netCenter = netBox.getCenter();
	
	var postBox = new THREE.Box3().setFromLocalObject(postMesh);
	var postSize = postBox.getSize();
	var postCenter = postBox.getCenter();
	
	this.parameters = {
		netSize: netSize,
		netCenter: netCenter,
		postSize: postSize,
		postCenter: postCenter,
	};
	
	var net = netMesh.clone();
	net.position.set(-netCenter.x, -netCenter.y + postSize.y - netSize.y / 2, -netCenter.z);
	this.add(net);
	
	var postLeft = postMesh.clone();
	postLeft.position.set(-postCenter.z - postSize.z / 2 - netSize.x / 2, -postCenter.y + postSize.y / 2, -postCenter.x);
	postLeft.rotation.y = Math.PI / 2;
	this.add(postLeft);
	
	var postRight = postLeft.clone();
	postRight.position.x *= -1;
	postRight.rotation.y *= -1;
	this.add(postRight);
	
	this.net = net;
	this.postLeft = postLeft;
	this.postRight = postRight;
}

NetGroup.prototype = Object.assign(Object.create(THREE.Object3D.prototype), {
	
	constructor: NetGroup,
	
	checkCollision: function (shuttlecock) {
		
		var corkCenter = new THREE.Vector3(0, shuttlecock.geometry.parameters.massToCorkCenterLength, 0);
		var corkSphere = new THREE.Sphere(corkCenter, shuttlecock.geometry.parameters.corkRadius);
		
		var position = shuttlecock.localToTarget(corkCenter.clone(), shuttlecock.parent);
		var lastPosition = position.clone().addScaledVector(shuttlecock.velocity, -shuttlecock.lastDelta);
		
		shuttlecock.parent.localToTarget(position, this.net);
		shuttlecock.parent.localToTarget(lastPosition, this.net);
		
		if (position.z * lastPosition.z < 0) {
			
			var positionDelta = lastPosition.clone().sub(position);
			var ratio = -position.z / positionDelta.z;
			
			corkCenter.copy(position.clone().addScaledVector(positionDelta, ratio));
			
			var netBox = new THREE.Box3().setFromCenterAndSize(this.parameters.netCenter, this.parameters.netSize);
			if (netBox.intersectsSphere(corkSphere)) {
			
				shuttlecock.replaceState('active', 'hung');
				shuttlecock.position.copy(this.net.localToTarget(corkCenter.clone(), shuttlecock.parent));
				shuttlecock.flipFrame.rotation.set(0, 0, 0);
				
			} else if (corkCenter.y + corkSphere.radius < netBox.min.y) {
				
				shuttlecock.addState('under-net');
			}
		}
	},
	
});

export { NetGroup };