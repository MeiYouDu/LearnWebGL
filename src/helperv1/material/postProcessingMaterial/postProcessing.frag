#version 300 es
precision highp float;
precision highp int;
precision highp sampler2DArray;

uniform sampler2D postProcessingTexture;
in vec2 outTexCoord;

out vec4 fragmentColor;

void main() {
	fragmentColor = vec4(texture(postProcessingTexture, outTexCoord).xyz, 1.0);
}
