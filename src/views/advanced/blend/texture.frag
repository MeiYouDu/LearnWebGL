#version 300 es
precision highp float;

struct Material {
	vec3 ambient;
	sampler2D specular;
	sampler2D diffuse;
	float shininess;
};

in vec2 outTexCoord;
in vec3 outFragVertexPos;

uniform Material material;

out vec4 fragmentColor;

void main() {
	// 纹理贴图
	vec4 texDiffuse = texture(material.diffuse, outTexCoord);
	if (texDiffuse.a <= 0.1) discard;
	// if (length(texDiffuse) >= 0.9) discard;
	fragmentColor = texDiffuse;
}
