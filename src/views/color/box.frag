#version 300 es
precision highp float;

in vec2 outTexCoord;

uniform sampler2D texture0;
uniform sampler2D texture1;
uniform vec2 resolution;

out vec4 fragmentColor;


void main() {
	fragmentColor =  mix(texture(texture1, outTexCoord), texture(texture0, outTexCoord) * 1.5, 0.65);
}
