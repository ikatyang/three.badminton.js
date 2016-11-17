import number_vertex_shader from '../shaders/number_vertex.glsl';
import number_fragment_shader from '../shaders/number_fragment.glsl';

function NumberMaterial(parameters){
	
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
	this.setNumbers(parameters.numbers, params);
	
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
	
	setNumbers: function (numbers, params) {
		if (typeof numbers === 'number') {
			var temp = numbers;
			numbers = [];
			while (temp > 0) {
				numbers.unshift(temp % 10);
				temp = Math.floor(temp / 10);
			}
		}
		if (!numbers || numbers.length === 0)
			numbers = [0];
		(params || this).uniforms.numbers.value = numbers;
		(params || this).fragmentShader = '#define NUMBER_COUNT ' + numbers.length + '\n' + number_fragment_shader;
		this.needsUpdate = true;
	},
	
});

export { NumberMaterial };