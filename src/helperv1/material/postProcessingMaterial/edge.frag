#version 300 es
precision highp float;
precision highp int;
precision highp sampler2DArray;

uniform sampler2D postProcessingTexture;
in vec2 outTexCoord;

out vec4 fragmentColor;
const float offset = 1.0 / 300.0;

void main() {
	vec2 offsets[9] = vec2[](
		vec2(-offset, offset), // 左上
		vec2(0.0f, offset), // 正上
		vec2(offset, offset), // 右上
		vec2(-offset, 0.0f), // 左
		vec2(0.0f, 0.0f), // 中
		vec2(offset, 0.0f), // 右
		vec2(-offset, -offset), // 左下
		vec2(0.0f, -offset), // 正下
		vec2(offset, -offset) // 右下
	);

	float kernel[9] = float[](1.0, 1.0, 1.0, 1.0, -9.0, 1.0, 1.0, 1.0, 1.0);

	vec3 sampleTex[9];
	vec3 col = vec3(0.0);
	for (int i = 0; i < 9; i++) {
		sampleTex[i] = vec3(texture(postProcessingTexture, outTexCoord.st + offsets[i]));
		col += sampleTex[i] * kernel[i];
	}

	fragmentColor = vec4(col, 1.0);
}
