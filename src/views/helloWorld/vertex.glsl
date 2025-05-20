#version 300 es
in vec4 position;
in vec4 color;
uniform mat4 modelTrans;

out vec4 colorToFragment;

void main() {
	colorToFragment = color;
	gl_Position = modelTrans * position;
}
