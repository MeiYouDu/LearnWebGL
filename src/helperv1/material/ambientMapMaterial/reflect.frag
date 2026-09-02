#version 300 es

precision highp float;

uniform samplerCube cubeMap;
uniform vec3 cameraPos;

in vec3 vPosition;
in vec3 vNormal;

out vec4 FragColor;

void main() {
	vec3 I = normalize(vPosition - cameraPos);
	vec3 R = reflect(I, normalize(vNormal));
	FragColor = texture(cubeMap, R);
}
