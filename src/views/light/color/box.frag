#version 300 es
precision highp float;

in vec2 outTexCoord;
in vec3 outNormal;
in vec3 outFragVertexPos;

uniform sampler2D texture0;
uniform sampler2D texture1;
uniform vec2 resolution;
uniform vec4 lightColor;
uniform vec3 lightPos;
uniform vec3 cameraPos;

out vec4 fragmentColor;


void main() {
	float ambientStrength = 0.1;
	float diffuseStrength = 0.6;
	float specularStrength = 0.8;
	vec4 textureColor = mix(texture(texture1, outTexCoord), texture(texture0, outTexCoord) * 1.5, 0.65);
	// 环境光
	vec4 ambient = vec4((lightColor * ambientStrength).rgb, 1.0);
	vec3 norm = normalize(outNormal);
	vec3 lightDir = normalize(lightPos - outFragVertexPos);
	float diff = max(dot(norm, lightDir), 0.0);
	// 漫反射
	vec4 diffuse = vec4((lightColor * diff * diffuseStrength).rgb, 1.0);
	vec3 viewDir = normalize(cameraPos - outFragVertexPos);
	vec3 reflectDir = reflect(-lightDir, norm);
	float spec = pow(max(dot(viewDir, reflectDir), 0.0), 128.0);
	vec4 specular = vec4((specularStrength * spec * lightColor).rgb, 1.0);
	fragmentColor = (ambient + diffuse + specular) * textureColor;
}
