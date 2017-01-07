function Shuttlecock(shuttlecockGeometry, material, corkMass, skirtMass) {
	
	THREE.Object3D.call(this);
	
	this.parameters = {
		mass: corkMass + skirtMass,
		corkMass: corkMass,
		skirtMass: skirtMass,
	};
	
	var flipFrame = new THREE.Object3D();
	this.add(flipFrame);
	
	var mesh = new THREE.Mesh(shuttlecockGeometry, material);
	flipFrame.add(mesh);
	
	this.flipFrame = flipFrame;
	this.mesh = mesh;
	
	this.dragCoefficient = 0.44;
	
	this.airDensity = 1.1839;
	this.gravity = new THREE.Vector3(0, -9.8, 0);
	
	this.toppleVelocity = 100;
	this.toppleAngularVelocity = Math.PI * 3;
	
	if (!this.mesh.geometry.boundingSphere)
		this.mesh.geometry.computeBoundingSphere();
	this.groundElapsed = 0;
	this.groundElapsedDelta = 0.5;
	this.groundRestitutionCoefficient = 0.05;
	
	this.init();
}

Shuttlecock.prototype = Object.defineProperties(Object.assign(Object.create(THREE.Object3D.prototype), {

	constructor: Shuttlecock,
	
	getStates: function () {
		return this.state.split(' ');
	},
	
	hasState: function (state) {
		return (this.getStates().indexOf(state) !== -1);
	},
	
	addState: function (state) {
		if (!this.hasState(state))
			this.state += ' ' + state;
	},
	
	replaceState: function (pattern, replacement) {
		var states = this.getStates();
		var index = states.indexOf(pattern);
		if (index !== -1)
			states[index] = replacement;
		this.state = states.join(' ');
	},
	
	init: function () {
		
		this.state = 'active';
		this.flipFrame.rotation.set(0, 0, 0);
		this.velocity = new THREE.Vector3(0, 0, 0);
		
		this.flipAngle = 0;
		this.flipAngularVelocity = 0;
		this.flipAxis = new THREE.Vector3(0, 0, 0);
		
		this.lastDelta = 0;
		this.impactCount = 0;
	},
	
	getYAxis: function () {
		this.flipFrame.updateMatrixWorld();
		return this.flipFrame.localToTarget(new THREE.Vector3(0, 1, 0), this.parent, 'direction').normalize();
	},
	
	impact: function (velocity, normal, restitutionCoefficient, isGround) {
		
		var vertical = this.velocity.clone().projectOnVector(normal);
		var horizontal = this.velocity.clone().projectOnPlane(normal);
		
		this.velocity.copy(velocity)
			.addScaledVector(horizontal, restitutionCoefficient)
			.addScaledVector(vertical, -restitutionCoefficient);
		
		var yAxis = this.getYAxis();
		
		this.updateActive(0);
		
		this.updateMatrixWorld();
		var flipAxis = this.parent.localToTarget(this.velocity.clone().cross(yAxis), this, 'direction').normalize();
		var flipAngle = this.velocity.angleTo(yAxis);
		
		this.flipAngle = flipAngle;
		this.flipAngularVelocity = 0;
		this.flipAxis = flipAxis;
		
		var flipMatrix = new THREE.Matrix4().makeRotationAxis(flipAxis, flipAngle);
		this.flipFrame.rotation.setFromRotationMatrix(flipMatrix);
		
		if (isGround !== true)
			this.impactCount++;
			
		this.onAfterImpact.apply(this, arguments);
	},
	
	update: function (delta) {
		if (this.hasState('active'))
			this.updateActive(delta);
		else if (this.hasState('toppling'))
			this.updateToppling(delta);
		this.lastDelta = delta;
	},
	
	updateActive: function (delta) {
		
		var rho = this.airDensity;
		var S = this.geometry.parameters.skirtCrossSectionalArea;
		var C_D = this.dragCoefficient;
		var U = this.velocity.length();
		
		var F_D = rho * S * C_D * U * U / 2;
		
		var Fv = this.velocity.clone().normalize().multiplyScalar(-F_D);
		var force = this.gravity.clone().multiplyScalar(this.parameters.mass).add(Fv);
		
		this.velocity.addScaledVector(force, delta / this.parameters.mass);
		this.position.addScaledVector(this.velocity, delta);
		
		var xAxis = this.velocity.clone().cross(this.gravity).normalize();
		if (xAxis.length() > 0) {
			var yAxis = this.velocity.clone().normalize();
			var zAxis = xAxis.clone().cross(yAxis).normalize();
			var matrix = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
			this.rotation.setFromRotationMatrix(matrix);
		}
		
		if (delta > 0) {
			
			var flipParams = [this.flipAngle, this.flipAngularVelocity];
			this.solveODE(flipParams, this.flipDerivative, delta);
			this.flipAngle = flipParams[0];
			this.flipAngularVelocity = flipParams[1];
			
			if (Math.abs(this.flipAngle) < Math.PI) {
				var flipMatrix = new THREE.Matrix4().makeRotationAxis(this.flipAxis, this.flipAngle);
				this.flipFrame.rotation.setFromRotationMatrix(flipMatrix);
			} else {
				this.flipFrame.rotation.set(0, 0, 0);
			}
		
			this.updateMatrixWorld();
			this.groundElapsed += delta;
			
			var centerY = this.mesh.localToTarget(this.mesh.geometry.boundingSphere.center.clone(), this.parent).y;
			var radius = this.mesh.geometry.boundingSphere.radius;
			
			if (centerY < radius) {
				
				if (this.groundElapsed > this.groundElapsedDelta) {
					this.groundElapsed = 0;
					this.impact(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), this.groundRestitutionCoefficient, true);
				}
				
				if (centerY + this.velocity.y * this.groundElapsedDelta < radius)
					this.replaceState('active', 'toppling');
			}
		}
	},
	
	updateToppling: function (delta) {
		
		this.rotation.setFromRotationMatrix(
			new THREE.Matrix4().makeRotationFromEuler(this.rotation).multiply(
				new THREE.Matrix4().makeRotationFromEuler(this.flipFrame.rotation)));
		this.flipFrame.rotation.set(0, 0, 0);
		this.flipAngle = 0;
		
		var yAxis = new THREE.Vector3(0, 1, 0);
		var yAxisNew = this.parent.localToTarget(this.velocity.clone().setY(0).normalize().setY(-Math.tan(this.geometry.parameters.corkAngle)), this, 'direction').normalize();
		
		var flipAxis = yAxis.clone().cross(yAxisNew).normalize();
		var flipAngle = Math.min(this.toppleAngularVelocity * delta, yAxis.angleTo(yAxisNew));
		
		this.rotateOnAxis(flipAxis, flipAngle);
		
		var corkTopY = this.localToTarget(new THREE.Vector3(0, this.geometry.parameters.massToCorkTopLength, 0), this.parent).y;
		this.position.y -= Math.sign(corkTopY) * Math.min(Math.abs(corkTopY), this.toppleVelocity * delta);
		
		if (Math.abs(flipAngle) < 5e-2 && Math.abs(corkTopY) < 1e-1)
			this.replaceState('toppling', 'toppled');
	},
	
	flipDerivative: function (params) {
		var phi = params[0];
		var phi_dot = params[1];
		var rho = this.airDensity;
		var C_D = this.dragCoefficient;
		var U = this.velocity.length();
		var M_B = this.parameters.skirtMass;
		var M_C = this.parameters.corkMass;
		var l_GC = this.geometry.parameters.massToCorkCenterLength;
		var S = this.geometry.parameters.skirtCrossSectionalArea;
		return [
			/* phi_dot     */ phi_dot,
			/* phi_dot_dot */ -(rho * S * C_D * U) / (2 * M_B * (1 + M_B / M_C)) * phi_dot - (rho * S * C_D * U * U) / (2 * (M_C + M_B) * l_GC) * Math.sin(phi)
		];
	},
	
	solveODE: function (params, derivative, dt) {
		// RK4
		var p_k1 = params.slice(0);
		var f_k1 = derivative.call(this, p_k1);
		
		var p_k2 = params.slice(0);
		for (var i = 0; i < params.length; i++)
			p_k2[i] += f_k1[i] * (dt / 2); 
		var f_k2 = derivative.call(this, p_k2);
		
		var p_k3 = params.slice(0);
		for (var i = 0; i < params.length; i++)
			p_k3[i] += f_k2[i] * (dt / 2); 
		var f_k3 = derivative.call(this, p_k3);
		
		var p_k4 = params.slice(0);
		for (var i = 0; i < params.length; i++)
			p_k4[i] += f_k3[i] * dt;
		var f_k4 = derivative.call(this, p_k4);
		
		for (var i = 0; i < params.length; i++) 
			params[i] += (f_k1[i] + 2 * f_k2[i] + 2 * f_k3[i] + f_k4[i]) / 6 * dt;
		return params;
	},
	
	copy: function (source) {
		
		THREE.Object3D.prototype.copy.call(this, source, false);
		
		this.state = source.state;
		
		this.flipFrame.rotation.copy(source.flipFrame.rotation);
		this.velocity.copy(source.velocity);
		
		this.flipAngle = source.flipAngle;
		this.flipAngularVelocity = source.flipAngularVelocity;
		this.flipAxis.copy(source.flipAxis);
		
		this.lastDelta = source.lastDelta;
		this.impactCount = source.impactCount;
		
		this.dragCoefficient = source.dragCoefficient;
		
		this.airDensity = source.airDensity;
		this.gravity.copy(source.gravity);
		
		this.toppleAngularVelocity = source.toppleAngularVelocity;
		
		return this;
	},
	
	clone: function () {
		return new this.constructor(this.geometry, this.material, this.parameters.corkMass, this.parameters.skirtMass).copy(this);
	},
	
	onAfterImpact: function () {},
	
}), {
	
	geometry: {
		get: function () {
			return this.mesh.geometry;
		},
		set: function (value) {
			this.mesh.geometry = value;
		},
	},
	
	material: {
		get: function () {
			return this.mesh.material;
		},
		set: function (value) {
			this.mesh.material = value;
		},
	},
	
});

export { Shuttlecock };