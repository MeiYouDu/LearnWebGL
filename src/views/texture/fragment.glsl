#version 300 es
precision highp float;

in vec2 outTexCoord;
in vec4 outColor;

uniform vec2 resolution;
uniform sampler2D textureMap;

out vec4 fragmentColor;

void main() {
	fragmentColor = texture(textureMap, outTexCoord) * outColor;
}
