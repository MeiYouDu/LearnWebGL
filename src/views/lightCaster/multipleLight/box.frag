#version 300 es
precision highp float;

struct Material {
//	vec3 ambient;
	sampler2D specular;
	sampler2D diffuse;
	float shininess;
};

struct ParallelLight {
	vec3 direction;
	vec3 ambient;
	vec3 diffuse;
	vec3 specular;
};

struct PointLight {
	vec3 position;
	vec3 ambient;
	vec3 diffuse;
	vec3 specular;
	float constant;
	float linear;
	float quadratic;
};

struct FlashLight {
	vec3 position;
	vec3 direction;
	vec3 ambient;
	vec3 diffuse;
	vec3 specular;
	float constant;
	float linear;
	float quadratic;
	float cutOff;
	float outerCutOff;
};

struct Camera {
	vec3 position;
};

vec3 computeParallelLight(ParallelLight light, Material material, Camera camera, vec3 normal, vec3 vertexPos);
vec3 computePointLight(PointLight light, Material material, Camera camera, vec3 normal, vec3 vertexPos);
vec3 computeFlashLight(FlashLight light, Material material, Camera camera, vec3 normal, vec3 vertexPos);

in vec2 outTexCoord;
in vec3 outNormal;
in vec3 outFragVertexPos;

uniform vec2 resolution;
uniform mat4 view;


uniform Camera camera;
uniform Material material;
uniform ParallelLight parallelLight;
uniform PointLight[4] pointLights;
uniform FlashLight flashLight;

out vec4 fragmentColor;


void main() {
	vec3 color = vec3(0, 0, 0);
	color += computeParallelLight(parallelLight, material, camera, outNormal, outFragVertexPos);
	color += computeFlashLight(flashLight, material, camera, outNormal, outFragVertexPos);
	for (int i = 0, u = pointLights.length(); i < u; ++i) {
		color += computePointLight(pointLights[i], material, camera, outNormal, outFragVertexPos);
	}
	fragmentColor = vec4(color, 1.0);
}

/**
	* 计算平行光源
	*/
vec3 computeParallelLight(ParallelLight light, Material material, Camera camera, vec3 normal, vec3 vertexPos) {
	float diffuseFactor = max(dot(-light.direction, normal), 0.0);
	vec3 reflectDir = reflect(light.direction, normal);
	vec3 viewDir = normalize(camera.position - vertexPos);
	float specularFactor = pow(max(dot(reflectDir, viewDir), 0.0), material.shininess);
	vec3 texDiffuse = texture(material.diffuse, outTexCoord).rgb;
	// 环境光
	vec3 ambient = light.ambient * texDiffuse;
	// 漫反射
	vec3 diffuse = light.diffuse * texDiffuse * diffuseFactor;
	// 高光
	vec3 specular = light.specular * texture(material.specular, outTexCoord).rgb * specularFactor;
	return diffuse + specular + ambient;
}
/**
	* 计算点光源
	*/
vec3 computePointLight(PointLight light, Material material, Camera camera, vec3 normal, vec3 vertexPos) {
	vec3 lightDir = normalize(vertexPos - light.position);
	float distance = distance(vertexPos, light.position);
	// 光强度衰减因子
	float attenuation = 1.0 / (light.constant + light.linear * distance + light.quadratic * distance * distance);
	float diffuseFactor = max(dot(-lightDir, normal), 0.0);
	vec3 reflectDir = reflect(lightDir, normal);
	vec3 viewDir = normalize(camera.position - vertexPos);
	float specularFactor = pow(max(dot(reflectDir, viewDir), 0.0), material.shininess);
	vec3 texDiffuse = texture(material.diffuse, outTexCoord).rgb;
	// 环境光
	vec3 ambient = light.ambient * texDiffuse;
	// 漫反射
	vec3 diffuse = light.diffuse * texDiffuse * diffuseFactor * attenuation;
	// 高光
	vec3 specular = light.specular * texture(material.specular, outTexCoord).rgb * specularFactor * attenuation;
	return diffuse + specular;
}
/**
	* 计算手电筒光
	*/
vec3 computeFlashLight(FlashLight light, Material material, Camera camera, vec3 normal, vec3 vertexPos) {
	vec3 lightDir = normalize(vertexPos - light.position);
	float distance = distance(vertexPos, light.position);
	float theta = max(dot(light.direction, lightDir), 0.0);
	// 光强度衰减因子
	float attenuation = 1.0 / (light.constant + light.linear * distance + light.quadratic * distance * distance);
	// 范围因子
	float spot = clamp((theta - light.cutOff) / (light.cutOff - light.outerCutOff), 0.0, 1.0);
	float diffuseFactor = max(dot(-lightDir, normal), 0.0);
	vec3 reflectDir = reflect(lightDir, normal);
	vec3 viewDir = normalize(camera.position  - vertexPos);
	float specularFactor = pow(max(dot(reflectDir, viewDir), 0.0), material.shininess);
	vec3 texDiffuse = texture(material.diffuse, outTexCoord).rgb;
	// 环境光
	vec3 ambient = light.ambient * texDiffuse;
	// 漫反射
	vec3 diffuse = light.diffuse * texDiffuse * diffuseFactor * attenuation * spot;
	// 高光
	vec3 specular = light.specular * texture(material.specular, outTexCoord).rgb * specularFactor * attenuation * spot;
	return diffuse + specular;
}
