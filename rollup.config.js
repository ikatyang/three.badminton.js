function glsl() {
	return {
		transform (code, id) {
			if (!/\.glsl$/.test(id)) return;
			var transformedCode = 'export default ' + JSON.stringify(
				code
					.replace(/[ \t]*\/\/.*\n/g, '')
					.replace(/[ \t]*\/\*[\s\S]*?\*\//g, '')
					.replace(/\n{2,}/g, '\n')
			) + ';';
			return {
				code: transformedCode,
				map: { mappings: '' }
			};
		}
	};
}


export default {
	entry: 'src/Badminton.js',
	dest: 'build/three.badminton.js',
	moduleName: 'THREE.Badminton',
	format: 'umd',
	plugins: [ glsl() ]
};