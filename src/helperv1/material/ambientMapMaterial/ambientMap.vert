#version 300 es

precision highp float;

in vec3 position;
in vec3 normal;

uniform mat4 view;
uniform mat4 model;
uniform mat4 projection;

out vec3 vPosition;
out vec3 vNormal;

void main() {
	vec4 pos = model * vec4(position, 1.0);
	mat3 m3 = mat3(model);
	vNormal = inverse(transpose(m3)) * normal;
	vPosition = vec3(pos);
	gl_Position = projection * view * pos;
}
