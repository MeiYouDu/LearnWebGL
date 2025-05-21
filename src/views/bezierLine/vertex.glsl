#version 300 es

in vec4 position;
in float t;

uniform vec4[4] points;

out vec4 colorToFragment;

/**
	* 贝塞尔曲线计算
	*/
vec4 bezier(vec4 p0, vec4 p1, vec4 p2, vec4 p3, float t) {
	float tt = t * t;
	float ttt = tt * t;
	float mt = 1.0 - t;
	float mt2 = mt * mt;
	float mt3 = mt2 * mt;
	return mt3 * p0 +
	3.0 * mt2 * t * p1 +
	3.0 * mt * tt * p2 +
	ttt * p3;
}

void main() {
	vec4 p0 = points[0], p1 = points[1], p2 = points[2], p3 = points[3];
	vec4 point = bezier(p0, p1, p2, p3, t);
	gl_Position = point;
}
