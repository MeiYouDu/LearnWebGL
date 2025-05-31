#version 300 es
precision highp float;

struct Material {
	vec3 ambient;
	vec3 specular;
	vec3 diffuse;
	float shininess;
};

struct Light {
	vec3 position;
	vec3 ambient;
	vec3 diffuse;
	vec3 specular;
};

in vec2 outTexCoord;
in vec3 outNormal;
in vec3 outFragVertexPos;

uniform sampler2D texture0;
uniform sampler2D texture1;
uniform vec2 resolution;
uniform vec3 cameraPos;
uniform Material material;
uniform Light light;

out vec4 fragmentColor;


void main() {
	vec4 textureColor = mix(texture(texture1, outTexCoord), texture(texture0, outTexCoord) * 1.5, 0.65);
	// 环境光
	vec4 ambient = vec4((light.ambient * material.ambient).rgb, 1.0);
	vec3 norm = normalize(outNormal);
	vec3 lightDir = normalize(light.position - outFragVertexPos);
	float diff = max(dot(norm, lightDir), 0.0);
	// 漫反射
	vec4 diffuse = vec4((light.diffuse * (diff * material.diffuse)).rgb, 1.0);
	vec3 viewDir = normalize(cameraPos - outFragVertexPos);
	vec3 reflectDir = reflect(-lightDir, norm);
	float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
	vec4 specular = vec4(((material.specular * spec) * light.specular).rgb, 1.0);
	fragmentColor = (ambient + diffuse + specular);
}
