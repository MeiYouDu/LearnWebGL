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
	float ambient;
	float diffuse;
	float specular;
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
	vec3 ligthPosition = vec3(light.position);
	float distance = length(ligthPosition - outFragVertexPos);
	float attenuation =
		1.0 / (light.constant + light.linear * distance + light.quadratic * distance * distance);
	vec4 texDiffuse = texture(material.diffuse, outTexCoord);
	vec4 texSpecular = texture(material.specular, outTexCoord);
	// 环境光
	vec4 ambient = vec4(vec3(light.ambient * attenuation), 1.0) * texDiffuse;
	vec3 norm = normalize(outNormal);
	vec3 lightDir = normalize(ligthPosition - outFragVertexPos);
	float diff = max(dot(norm, lightDir), 0.0);
	// 漫反射
	vec4 diffuse = vec4(vec3(light.diffuse * diff * attenuation), 1.0) * texDiffuse;
	vec3 viewDir = normalize(cameraPos - outFragVertexPos);
	vec3 reflectDir = reflect(-lightDir, norm);
	float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
	vec4 specular = texSpecular * (spec * light.specular * attenuation);
	fragmentColor = ambient + specular + diffuse;
}
