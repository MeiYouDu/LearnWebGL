#version 300 es
precision highp float;

in vec2 outTexCoord;

uniform sampler2D texture0;
uniform sampler2D texture1;
uniform vec2 resolution;
uniform float mixFactor;

out vec4 fragmentColor;

float pi = 3.1415;

void main() {
	float c = cos(pi);
	float s = sin(pi);
	fragmentColor =  mix(texture(texture1, outTexCoord), texture(texture0, outTexCoord) * 1.5, mixFactor);
}
