import pixel_vertex_shader from '../shaders/pixel_vertex.glsl';
import pixel_fragment_shader from '../shaders/pixel_fragment.glsl';

function PixelMaterial(parameters){
	
	var params = {};
	
	for (var key in parameters)
		params[key] = parameters[key];
	
	params.uniforms = {
		texture: {
			value: parameters.map
		},
		size: {
			value: parameters.size
		},
		pixelSize: {
			value: parameters.pixelSize
		},
	};
	
	params.vertexShader = pixel_vertex_shader;
	params.fragmentShader = pixel_fragment_shader;
	
	delete params.map;
	delete params.size;
	delete params.pixelSize;
	
	THREE.ShaderMaterial.call(this, params);
}

PixelMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
PixelMaterial.prototype.constructor = PixelMaterial;

export { PixelMaterial };