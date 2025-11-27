#version 300 es

in vec4 position;
in vec4 color;
in vec2 texCoord;

out vec2 outTexCoord;
out vec4 outColor;

void main() {
	gl_Position = position;
	outTexCoord = texCoord;
	outColor = color;
}
