#version 300 es

precision highp float;

in vec3 position;

uniform mat4 view;
uniform mat4 projection;

out vec3 outTexCoord;

void main() {
	outTexCoord = normalize(vec3(position.x, position.y, position.z));
	mat4 viewNew = mat4(mat3(view));
	vec4 pos = projection * viewNew * vec4(position, 1.0);
	gl_Position = pos.xyww;
	gl_Position.z = 0.999999 * gl_Position.w;
}
