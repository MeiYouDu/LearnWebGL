#version 300 es
precision highp float;
precision highp int;
precision highp sampler2DArray;

struct Material {
	vec3 ambient;
	sampler2D specular;
	sampler2D diffuse;
	float shininess;
};

struct Light {
	vec3 position;
	vec3 ambient;
	vec3 diffuse;
	vec3 specular;
	float constant;
	float linear;
	float quadratic;
};

in vec2 outTexCoord;
in vec3 outNormal;
in vec3 outFragVertexPos;

//uniform sampler2D texture1;
uniform vec2 resolution;
uniform vec3 cameraPos;
uniform Material material;
uniform Light light;
uniform mat4 view;

out vec4 fragmentColor;

void main() {
	vec3 texDiffuse = texture(material.diffuse, outTexCoord).rgb;
	// 环境光
	fragmentColor = vec4(texDiffuse.rgb, 1.0);
}
