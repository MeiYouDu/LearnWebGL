#version 300 es
precision highp float;
precision highp int;
precision highp sampler2DArray;

uniform sampler2D postProcessingTexture;
in vec2 outTexCoord;

out vec4 fragmentColor;

void main() {
	vec4 color = texture(postProcessingTexture, outTexCoord);
	float average = (color.x + color.y + color.z) / 3.0;
	fragmentColor = vec4(average, average, average, 1.0);
}
