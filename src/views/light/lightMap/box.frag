#version 300 es
precision highp float;

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
};

in vec2 outTexCoord;
in vec3 outNormal;
in vec3 outFragVertexPos;

uniform sampler2D code;
uniform float time;
//uniform sampler2D texture1;
uniform vec2 resolution;
uniform vec3 cameraPos;
uniform Material material;
uniform Light light;

out vec4 fragmentColor;


void main() {
	vec3 texDiffuse = texture(material.diffuse, outTexCoord).rgb;
	vec3 texSpecular = texture(material.specular, outTexCoord).rgb;
	vec4 emission = texture(code, vec2(outTexCoord.s, outTexCoord.t * time));
	// 环境光
	vec4 ambient = vec4(light.ambient * texDiffuse, 1.0);
	vec3 norm = normalize(outNormal);
	vec3 lightDir = normalize(light.position - outFragVertexPos);
	float diff = max(dot(norm, lightDir), 0.0);
	// 漫反射
	vec4 diffuse = vec4((light.diffuse * (diff * texDiffuse)), 1.0);
	vec3 viewDir = normalize(cameraPos - outFragVertexPos);
	vec3 reflectDir = reflect(-lightDir, norm);
	float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
	vec4 specular = vec4(((texSpecular * spec) * light.specular), 1.0);
	fragmentColor = (ambient + specular + diffuse + emission);
}
