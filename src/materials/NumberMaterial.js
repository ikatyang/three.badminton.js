import number_vertex_shader from '../shaders/number_vertex.glsl';
import number_fragment_shader from '../shaders/number_fragment.glsl';

function NumberMaterial(parameters){
	
	parameters = parameters || {};
	
	var params = {};
	
	for (var key in parameters)
		params[key] = parameters[key];
	
	params.uniforms = {
		numbers: {},
		boxMin: {
			value: parameters.boxMin || new THREE.Vector2(0.2, 0.2)
		},
		boxMax: {
			value: parameters.boxMax || new THREE.Vector2(0.8, 0.8)
		},
		lineSize: {
			value: parameters.lineSize || new THREE.Vector2(0.1, 0.1)
		},
		numberColor: {
			value: (parameters.numberColor && new THREE.Color(parameters.numberColor)) || new THREE.Vector3(0, 0, 0)
		},
		backgroundColor: {
			value: (parameters.backgroundColor && new THREE.Color(parameters.backgroundColor)) || new THREE.Vector3(1, 1, 1)
		},
	};
	
	params.vertexShader = number_vertex_shader;
	
	if (parameters.number !== undefined)
		this.setNumber(parameters.number, params);
	else
		this.setNumbers(parameters.numbers, params);
	
	delete params.number;
	delete params.numbers;
	delete params.boxMin;
	delete params.boxMax;
	delete params.lineSize;
	delete params.numberColor;
	delete params.backgroundColor;
	
	THREE.ShaderMaterial.call(this, params);
}

NumberMaterial.prototype = Object.assign(Object.create(THREE.ShaderMaterial.prototype), {
	
	constructor: NumberMaterial,
	
	setNumber: function (number, params) {
		var temp = number;
		var numbers = [];
		do {
			numbers.unshift(temp % 10);
			temp = Math.floor(temp / 10);
		} while (temp > 0);
		this.setNumbers(numbers, params);
	},
	
	setNumbers: function (numbers, params) {
		params = params || this;
		params.uniforms.numbers.value = numbers;
		if (this.numberCount !== numbers.length) {
			this.numberCount = numbers.length;
			params.fragmentShader = '#define NUMBER_COUNT ' + this.numberCount + '\n' + number_fragment_shader;
			this.needsUpdate = true;
		}
	},
	
	getNumber: function () {
		var number = 0;
		var numbers = this.getNumbers();
		for (var i = 0; i < numbers.length; i++)
			number = number * 10 + numbers[i];
		return number;
	},
	
	getNumbers: function () {
		return this.uniforms.numbers.value;
	},
	
});

export { NumberMaterial };