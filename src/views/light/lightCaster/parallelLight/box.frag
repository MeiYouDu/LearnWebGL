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
	vec3 lightPosition = vec3(view * vec4(light.position, 1));
	vec3 texDiffuse = texture(material.diffuse, outTexCoord).rgb;
	vec3 texSpecular = texture(material.specular, outTexCoord).rgb;
	// 环境光
	vec4 ambient = vec4(light.ambient * texDiffuse, 1.0);
	vec3 norm = normalize(outNormal);
	// 平行光任务所有光源的方向一致
	vec3 lightDir = normalize(light.position);
	// 漫反射
	float diff = max(dot(norm, lightDir), 0.0);
	vec4 diffuse = vec4((light.diffuse * (diff * texDiffuse)), 1.0);
	// 高光
	vec3 viewDir = normalize(cameraPos - outFragVertexPos);
	vec3 reflectDir = reflect(-lightDir, norm);
	float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
	vec4 specular = vec4(((texSpecular * spec) * light.specular), 1.0);
	fragmentColor = vec4(((ambient + specular + diffuse)).rgb, 1.0);
}
