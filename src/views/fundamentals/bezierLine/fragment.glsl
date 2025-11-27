#version 300 es
precision highp float;

flat in int isControlPoint;

uniform vec4[4] points;
uniform vec2 resolution;

out vec4 fragmentColor;

void main() {
	vec3 baseColor = vec3(1.0, 0.0, 188.0/255.0);
	vec3 pointColor = vec3(1.0, 0.0, 0.0);
	if (isControlPoint == 1) {
		float minDist = 8.0;
		const int POINT_COUNT = 4;
		bool discardAble = false;
		// 计算到所有控制点的最小距离
		for (int i = 0; i < POINT_COUNT; i++) {
			vec2 pointPos = ((points[i].xy + 1.0) * resolution)/ 2.0;
			float dist = distance(gl_FragCoord.xy, pointPos);
			if (dist <= minDist && dist >= 6.0) {
				discardAble = false;
			} else {
				discardAble = true;
			}
		}
		if (discardAble) {
			discard;
		}
		//		float radius = 8.0;// 基于 NDC 的半径（约 5 像素）
		//		float edge = 2.0;
		//		float alpha = smoothstep(radius + edge, radius - edge, minDist);
		fragmentColor = vec4(pointColor, 1.0);
	} else {
		fragmentColor = vec4(baseColor, 1.0);
	}

}
