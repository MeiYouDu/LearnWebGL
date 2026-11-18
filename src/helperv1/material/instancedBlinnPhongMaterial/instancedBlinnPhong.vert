#version 300 es

in vec3 position;
in vec2 texCoord;
in vec3 normal;
in mat4 instanceModel;

uniform mat4 view;
uniform mat4 projection;

out vec2 outTexCoord;
out vec3 outNormal;
out vec3 outFragVertexPos;

void main() {
	vec4 worldPosition = instanceModel * vec4(position, 1.0);
	gl_Position = projection * view * worldPosition;
	outTexCoord = texCoord;
	outNormal = mat3(transpose(inverse(instanceModel))) * normal;
	outFragVertexPos = worldPosition.xyz;
}
