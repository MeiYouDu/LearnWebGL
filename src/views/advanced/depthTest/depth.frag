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
uniform float near;
uniform float far;

out vec4 fragmentColor;

float linearDepth(float depth) {
	float z = depth * 2.0 - 1.0; // 转换为 NDC
	return (2.0 * near * far / (far + near - z * (far - near)) - near) / (far - near);
}

void main() {
	float depth = linearDepth(gl_FragCoord.z); // divide by far for demonstration
	fragmentColor = vec4(vec3(depth), 1.0);
}
