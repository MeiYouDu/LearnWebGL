#version 300 es
precision highp float;

struct Material {
	vec3 ambient;
	sampler2D specular;
	sampler2D diffuse;
	float shininess;
};

struct Light {
// 手电筒位置
	vec3 position;
// 手电筒朝向
	vec3 direction;
// 内光切角 cos 值
	float cutOff;
// 外光切角 cos 值
	float outerCutOff;
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
	vec3 ligthPosition = vec3(view * vec4(light.position, 1));
	float distance = length(ligthPosition - outFragVertexPos);
	float attenuation = 1.0/(light.constant + light.linear * distance + light.quadratic * distance * distance);
	vec3 norm = normalize(outNormal);
	vec3 lightDir = normalize(outFragVertexPos - ligthPosition);
	vec3 viewDir = normalize(cameraPos - outFragVertexPos);
	vec3 reflectDir = reflect(lightDir, norm);
	vec3 spotlightDir = light.direction;
	float theta = dot(lightDir, spotlightDir);
	// 手电筒覆盖范围
	float intensity = clamp((theta - light.outerCutOff)/(light.cutOff - light.outerCutOff), 0.0, 1.0);
	// 纹理贴图
	vec3 texDiffuse = texture(material.diffuse, outTexCoord).rgb;
	// 高光贴图
	vec3 texSpecular = texture(material.specular, outTexCoord).rgb;
	// 环境光
	vec4 ambient = vec4(light.ambient * texDiffuse, 1.0);
	// 漫反射
	float diff = max(dot(norm, -lightDir), 0.0);
	vec4 diffuse = vec4((light.diffuse * (diff * texDiffuse)), 1.0) * intensity;
	// 高光
	float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
	vec4 specular = vec4(((texSpecular * spec) * light.specular), 1.0) * intensity;
	fragmentColor = vec4(((ambient + specular + diffuse) * attenuation).rgb, 1.0);
}
