#version 300 es

precision highp float;

uniform samplerCube skybox;

in vec3 outTexCoord;

out vec4 FragColor;

void main() {
	FragColor = texture(skybox, outTexCoord);
}
