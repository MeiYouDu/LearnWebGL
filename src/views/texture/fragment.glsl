#version 300 es
precision highp float;

in vec2 outTexCoord;
in vec4 outColor;

uniform vec2 resolution;
uniform sampler2D texture0;
uniform sampler2D texture1;
uniform float mixFactor;

out vec4 fragmentColor;

float pi = 3.1415;

void main() {
	float c = cos(pi);
	float s = sin(pi);
	mat2 rotate = mat2(
	c, -s,
	s, c
	);
	mat2 reflect = mat2(
	-1, 0,
	0, 1
	);
	fragmentColor =  mix(mix(texture(texture1, reflect * rotate * outTexCoord), texture(texture0, outTexCoord) * 1.5, 0.65), outColor, mixFactor);
}
