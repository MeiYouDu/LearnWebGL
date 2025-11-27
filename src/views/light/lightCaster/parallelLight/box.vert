#version 300 es

in vec3 position;
in vec2 texCoord;
in vec3 normal;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

out vec2 outTexCoord;
out vec3 outNormal;
out vec3 outFragVertexPos;

void main() {
	gl_Position = projection * view * model * vec4(position, 1.0);
	outTexCoord = texCoord;
	outNormal = mat3(transpose(inverse(view * model))) * normal;
	outFragVertexPos = vec3(view * model * vec4(position, 1));
}
