import { ShuttlecockGeometry } from '../geometries/ShuttlecockGeometry.js';

function Shuttlecock(geometry, material, corkMass, skirtMass, corkAngle, massToCorkTopLength, massToCorkCenterLength, skirtCrossSectionalArea) {
	
	THREE.Object3D.call(this);
	
	if (geometry instanceof ShuttlecockGeometry) {
		corkAngle = geometry.parameters.corkAngle;
		massToCorkTopLength = geometry.parameters.massToCorkTopLength;
		massToCorkCenterLength = geometry.parameters.massToCorkCenterLength;
		skirtCrossSectionalArea = geometry.parameters.skirtCrossSectionalArea;
	}
	
	this.geometry = geometry;
	this.material = material;
	
	this.parameters = {
		mass: corkMass + skirtMass,
		corkMass: corkMass,
		skirtMass: skirtMass,
		corkAngle: corkAngle,
		massToCorkTopLength: massToCorkTopLength,
		massToCorkCenterLength: massToCorkCenterLength,
		skirtCrossSectionalArea: skirtCrossSectionalArea
	};
	
	var flipFrame = new THREE.Object3D();
	this.add(flipFrame);
	
	var mesh = new THREE.Mesh(geometry, material);
	flipFrame.add(mesh);
	
	this.flipFrame = flipFrame;
	this.mesh = mesh;
	
	this.dragCoefficient = 0.44;
	this.groundAttenuation = 0.9;
	
	this.meter2unit = 1;
	this._airDensity = 1.1839;
	this._gravity = new THREE.Vector3(0, -9.8, 0);
	this.velocity = new THREE.Vector3(0, 0, 0);
	
	this.flipAngle = 0;
	this.flipAngularVelocity = 0;
	this.flipAxis = new THREE.Vector3(0, 0, 0);
	
	this.stopAngularVelocity = Math.PI * 3;
	this.state = 'move';
	
	this.lastDelta = 0;
	this.impactCount = 0;
}

Shuttlecock.prototype = Object.defineProperties(Object.assign(Object.create(THREE.Object3D.prototype), {

	constructor: Shuttlecock,
	
	getYAxis: function () {
		this.flipFrame.updateMatrixWorld();
		return this.flipFrame.directionLocalToWorld(new THREE.Vector3(0, 1, 0)).normalize();
	},
	
	impact: function (velocity, normal, attenuation, isCount) {
	
		this.velocity.reflect(normal).multiplyScalar(1 - attenuation).add(velocity);
		var yAxis = this.getYAxis();
		
		this.updateMove(0);
		
		this.updateMatrixWorld();
		var flipAxis = this.directionWorldToLocal(this.velocity.clone().cross(yAxis)).normalize();
		var flipAngle = this.velocity.angleTo(yAxis);
		
		this.flipAngle = flipAngle;
		this.flipAngularVelocity = 0;
		this.flipAxis = flipAxis;
		
		var flipMatrix = new THREE.Matrix4().makeRotationAxis(flipAxis, flipAngle);
		this.flipFrame.rotation.setFromRotationMatrix(flipMatrix);
		
		if (isCount !== false)
			this.impactCount++;
	},
	
	update: function (delta) {
		if (this.state === 'move') {
			this.updateMove(delta);
			if (this.position.y < 0) {
				this.impact(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), this.groundAttenuation, false);
				if (this.velocity.y < 0)
					this.state = 'topple';
			}
		} else if (this.state === 'topple')
			this.updateTopple(delta);
		this.lastDelta = delta;
	},
	
	updateMove: function (delta) {
		
		var rho = this.airDensity;
		var S = this.parameters.skirtCrossSectionalArea;
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
		}
	},
	
	updateTopple: function (delta) {
		
		this.rotation.setFromRotationMatrix(
			new THREE.Matrix4().makeRotationFromEuler(this.rotation).multiply(
				new THREE.Matrix4().makeRotationFromEuler(this.flipFrame.rotation)));
		this.flipFrame.rotation.set(0, 0, 0);
		this.flipAngle = 0;
		
		var yAxis = this.getYAxis();
		
		var velocityXZ = this.velocity.clone().setY(0).normalize();
		if (yAxis.clone().negate().angleTo(velocityXZ) > Math.PI / 2)
			velocityXZ.negate();
			
		var flipAxis = this.directionWorldToLocal(yAxis.clone().negate().cross(velocityXZ)).normalize();
		var flipAngle = Math.min(this.stopAngularVelocity * delta, 
			yAxis.clone().negate().angleTo(velocityXZ) - this.parameters.corkAngle);
		
		var flipMatrix = new THREE.Matrix4().makeRotationFromEuler(this.rotation);
		this.rotation.setFromRotationMatrix(flipMatrix.multiply(new THREE.Matrix4().makeRotationAxis(flipAxis, flipAngle)));
		
		this.position.y -= this.localToTarget(new THREE.Vector3(0, this.parameters.massToCorkTopLength, 0), this.parent).y;
		
		if (flipAngle < 1e-4)
			this.state = 'stop-ground';
	},
	
	flipDerivative: function (params) {
		var phi = params[0];
		var phi_dot = params[1];
		var rho = this.airDensity;
		var C_D = this.dragCoefficient;
		var U = this.velocity.length();
		var M_B = this.parameters.skirtMass;
		var M_C = this.parameters.corkMass;
		var l_GC = this.parameters.massToCorkCenterLength;
		var S = this.parameters.skirtCrossSectionalArea;
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
	
}), {

	airDensity: {
		get: function () {
			return this._airDensity / Math.pow(this.meter2unit, 3);
		},
		set: function (value) {
			this._airDensity = value;
		},
	},
	
	gravity: {
		get: function () {
			return this._gravity.clone().multiplyScalar(this.meter2unit);
		},
		set: function (value) {
			this._gravity = value;
		},
	},
	
});

export { Shuttlecock };