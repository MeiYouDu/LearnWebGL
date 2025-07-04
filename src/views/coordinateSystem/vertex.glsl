#version 300 es

in vec3 position;
in vec2 texCoord;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

out vec2 outTexCoord;
out vec4 outColor;

void main() {
	gl_Position = projection * view * model * vec4(position, 1.0);
	outTexCoord = texCoord;
}
