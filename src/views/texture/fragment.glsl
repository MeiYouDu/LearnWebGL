#version 300 es
precision highp float;

in vec2 outTexCoord;
in vec4 outColor;

uniform vec2 resolution;
uniform sampler2D texture0;
uniform sampler2D texture1;

out vec4 fragmentColor;

void main() {
	fragmentColor =  mix(mix(texture(texture1, outTexCoord), texture(texture0, outTexCoord) * 1.5, 0.65), outColor, 0.3);
}
