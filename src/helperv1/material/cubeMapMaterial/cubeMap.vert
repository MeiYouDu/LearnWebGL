#version 300 es

precision highp float;

in vec3 position;

uniform mat4 view;
uniform mat4 projection;

out vec3 outTexCoord;

void main() {
	outTexCoord = normalize(position);
	vec4 pos = projection * view * vec4(position, 1.0);
	gl_Position = pos.xyww;
}
