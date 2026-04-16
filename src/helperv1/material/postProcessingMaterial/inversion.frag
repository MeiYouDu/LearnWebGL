#version 300 es
precision highp float;
precision highp int;
precision highp sampler2DArray;

uniform sampler2D postProcessingTexture;
in vec2 outTexCoord;

out vec4 fragmentColor;

void main() {
	vec4 color = texture(postProcessingTexture, outTexCoord);
	fragmentColor = vec4(1.0 - color.xyz, 1.0);
}
