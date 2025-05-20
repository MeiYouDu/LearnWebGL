#version 300 es
in vec4 position;
in vec4 color;

out vec4 colorToFragment;

void main() {
	colorToFragment = color;
	gl_Position = position;
}
