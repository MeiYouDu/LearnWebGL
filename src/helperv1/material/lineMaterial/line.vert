#version 300 es

in vec3 position;
in vec3 normal;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

out vec3 outNormal;

void main() {
	gl_Position = projection * view * model * vec4(position, 1.0);
	outNormal = mat3(transpose(inverse(model))) * normal;
}
