varying vec2 vUv;
uniform int numbers[NUMBER_COUNT];
uniform vec2 boxMin;
uniform vec2 boxMax;
uniform vec2 lineSize;
uniform vec3 numberColor;
uniform vec3 backgroundColor;
int getNum(int index) {
	for (int i = 0; i < NUMBER_COUNT; i++)
		if (i == index)
			return numbers[i];
	return -1;
}
mat3 getMask(int num) {
	if (num == 0)
		return mat3(1, 1, 1, 1, 1, 1, 0, 0, 0);
	if (num == 1)
		return mat3(0, 0, 0, 0, 0, 0, 0, 1, 1);
	if (num == 2)
		return mat3(1, 1, 0, 1, 1, 0, 1, 0, 0);
	if (num == 3)
		return mat3(1, 1, 1, 1, 0, 0, 1, 0, 0);
	if (num == 4)
		return mat3(0, 1, 1, 0, 0, 1, 1, 0, 0);
	if (num == 5)
		return mat3(1, 0, 1, 1, 0, 1, 1, 0, 0);
	if (num == 6)
		return mat3(1, 0, 1, 1, 1, 1, 1, 0, 0);
	if (num == 7)
		return mat3(1, 1, 1, 0, 0, 0, 0, 0, 0);
	if (num == 8)
		return mat3(1, 1, 1, 1, 1, 1, 1, 0, 0);
	if (num == 9)
		return mat3(1, 1, 1, 1, 0, 1, 1, 0, 0);
	return mat3(0);
}
bool isInside(vec2 start, vec2 size, float minX, float maxX, float minY, float maxY, vec2 line) {
	return (vUv.x >= start.x + size.x * minX - line.x / 2.0 && vUv.x <= start.x + size.x * maxX + line.x / 2.0 &&
			vUv.y >= start.y + size.y * minY - line.y / 2.0 && vUv.y <= start.y + size.y * maxY + line.y / 2.0);
}
void main() {
	
	float width = 1.0 / float(NUMBER_COUNT);
	float numberIndex = floor(vUv.x / width);
	
	vec2 boxStart = vec2(width * numberIndex, 0.0);
	vec2 boxSize = vec2(width, 1.0);
	
	vec2 boxMid = (boxMin + boxMax) / 2.0;
	vec2 line = lineSize * boxSize;
	
	mat3 mask = getMask(getNum(int(numberIndex)));
	
	if ((mask[0][0] == 1.0 && isInside(boxStart, boxSize, boxMin.x, boxMax.x, boxMax.y, boxMax.y, line)) ||
		(mask[0][1] == 1.0 && isInside(boxStart, boxSize, boxMax.x, boxMax.x, boxMid.y, boxMax.y, line)) ||
		(mask[0][2] == 1.0 && isInside(boxStart, boxSize, boxMax.x, boxMax.x, boxMin.y, boxMid.y, line)) ||
		(mask[1][0] == 1.0 && isInside(boxStart, boxSize, boxMin.x, boxMax.x, boxMin.y, boxMin.y, line)) ||
		(mask[1][1] == 1.0 && isInside(boxStart, boxSize, boxMin.x, boxMin.x, boxMin.y, boxMid.y, line)) ||
		(mask[1][2] == 1.0 && isInside(boxStart, boxSize, boxMin.x, boxMin.x, boxMid.y, boxMax.y, line)) ||
		(mask[2][0] == 1.0 && isInside(boxStart, boxSize, boxMin.x, boxMax.x, boxMid.y, boxMid.y, line)) ||
		(mask[2][1] == 1.0 && isInside(boxStart, boxSize, boxMid.x, boxMid.x, boxMin.y, boxMid.y, line)) ||
		(mask[2][2] == 1.0 && isInside(boxStart, boxSize, boxMid.x, boxMid.x, boxMid.y, boxMax.y, line)))
		gl_FragColor = vec4(numberColor, 1.0);
	else
		gl_FragColor = vec4(backgroundColor, 1.0);
}