#version 300 es
precision highp float;

uniform vec4[4] points;

in vec4 colorToFragment;
out vec4 fragmentColor;

void main() {
	fragmentColor = vec4(1, 0, 188.0/255.0, 1);
	for (int i = 0; i < 4; i++) {
		float dis = distance(gl_FragCoord, points[i]);
		if (dis <= 5.0) {
			fragmentColor = vec4(1, 0, 0, 1);
		}
	}
}
