#version 300 es
precision highp float;

in vec2 outTexCoord;

uniform vec2 resolution;

out vec4 fragmentColor;

void main() {
	fragmentColor = vec4(1.0, 1.0, 1.0, 1.0);
}
