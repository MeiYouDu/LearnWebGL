#version 300 es
precision highp float;

in vec3 outNormal;

uniform vec3 color;
uniform bool useNormalColor;

out vec4 fragmentColor;

void main() {
	vec3 lineColor = useNormalColor ? normalize(outNormal) * 0.5 + 0.5 : color;
	fragmentColor = vec4(lineColor, 1.0);
}
