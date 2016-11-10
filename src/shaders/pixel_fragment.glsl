uniform sampler2D texture;
uniform vec2 size;
uniform vec2 pixelSize;
varying vec2 vUv;

void main() {
	
	vec2 pixelRatio = pixelSize / size;
	gl_FragColor = vec4(texture2D(texture, pixelRatio * floor(vUv / pixelRatio)).rgb, 1.0); 
}