#version 300 es

in vec2 position;
in vec2 texCoord;

out vec2 outTexCoord;

// out vec3 outFragVertexPos;

void main() {
	gl_Position = vec4(position.xy, 0.0, 1.0);
	outTexCoord = texCoord;
}
