#version 300 es

precision highp float;

uniform samplerCube cubeMap;
uniform vec3 cameraPos;

in vec3 vPosition;
in vec3 vNormal;

out vec4 FragColor;

void main() {
	float ratio = 1.0 / 1.5;
	vec3 I = normalize(vPosition - cameraPos);
	vec3 R = refract(I, normalize(vNormal), ratio);
	FragColor = texture(cubeMap, R);
}
