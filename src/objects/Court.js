function Court(courtGeometry, material) {
	
	THREE.Mesh.call(this, courtGeometry, material);
}

Court.prototype = Object.assign(Object.create(THREE.Mesh.prototype), {
	
	constructor: Court,
	
	inArea: function (name, point) {
		return this.getArea(name).containsPoint(point);
	},
	
	getArea: function (name) {
		return this['getArea' + name]();
	},
	
	getAreaAll: function () {
		return new THREE.Box3(
			new THREE.Vector3(-this.geometry.parameters.longLineSingle, -this.geometry.parameters.sidelineDouble, 0),
			new THREE.Vector3(this.geometry.parameters.longLineSingle, this.geometry.parameters.sidelineDouble, 0));
	},
	
	getAreaSingle: function () {
		return new THREE.Box3(
			new THREE.Vector3(-this.geometry.parameters.longLineSingle, -this.geometry.parameters.sidelineSingle, 0),
			new THREE.Vector3(this.geometry.parameters.longLineSingle, this.geometry.parameters.sidelineSingle, 0));
	},
	
	getAreaSingleA: function () {
		return new THREE.Box3(
			new THREE.Vector3(-this.geometry.parameters.longLineSingle, -this.geometry.parameters.sidelineSingle, 0),
			new THREE.Vector3(0, this.geometry.parameters.sidelineSingle, 0));
	},
	
	getAreaSingleFirstA: function () {
		return new THREE.Box3(
			new THREE.Vector3(-this.geometry.parameters.longLineSingle, -this.geometry.parameters.sidelineSingle, 0),
			new THREE.Vector3(-this.geometry.parameters.shortLine, this.geometry.parameters.sidelineSingle, 0));
	},
	
	getAreaSingleFirstLeftA: function () {
		return new THREE.Box3(
			new THREE.Vector3(-this.geometry.parameters.longLineSingle, 0, 0),
			new THREE.Vector3(-this.geometry.parameters.shortLine, this.geometry.parameters.sidelineSingle, 0));
	},
	
	getAreaSingleFirstRightA: function () {
		return new THREE.Box3(
			new THREE.Vector3(-this.geometry.parameters.longLineSingle, -this.geometry.parameters.sidelineSingle, 0),
			new THREE.Vector3(-this.geometry.parameters.shortLine, 0, 0));
	},
	
	getAreaSingleB: function () {
		return new THREE.Box3(
			new THREE.Vector3(0, -this.geometry.parameters.sidelineSingle, 0),
			new THREE.Vector3(this.geometry.parameters.longLineSingle, this.geometry.parameters.sidelineSingle, 0));
	},
	
	getAreaSingleFirstB: function () {
		return new THREE.Box3(
			new THREE.Vector3(this.geometry.parameters.shortLine, -this.geometry.parameters.sidelineSingle, 0),
			new THREE.Vector3(this.geometry.parameters.longLineSingle, this.geometry.parameters.sidelineSingle, 0));
	},
	
	getAreaSingleFirstLeftB: function () {
		return new THREE.Box3(
			new THREE.Vector3(this.geometry.parameters.shortLine, -this.geometry.parameters.sidelineSingle, 0),
			new THREE.Vector3(this.geometry.parameters.longLineSingle, 0, 0));
	},
	
	getAreaSingleFirstRightB: function () {
		return new THREE.Box3(
			new THREE.Vector3(this.geometry.parameters.shortLine, 0, 0),
			new THREE.Vector3(this.geometry.parameters.longLineSingle, this.geometry.parameters.sidelineSingle, 0));
	},
	
});

export { Court };