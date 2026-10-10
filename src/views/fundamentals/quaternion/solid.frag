#version 300 es
precision highp float;

in vec3 outNormal;

// 纯色：每帧由 uniformsSetter 里的 setVec3(color, "color") 设置
uniform vec3 color;

out vec4 fragmentColor;

void main() {
	vec3 norm = normalize(outNormal);
	// 固定世界空间光照方向（指向光源），简单 Lambert 着色，让圆环 / 坐标轴有立体感
	vec3 lightDir = normalize(vec3(0.4, -0.7, 0.6));
	float diff = max(dot(norm, lightDir), 0.0);
	vec3 ambient = 0.45 * color;
	vec3 diffuse = 0.65 * diff * color;
	fragmentColor = vec4(ambient + diffuse, 1.0);
}
