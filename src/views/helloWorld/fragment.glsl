#version 300 es

precision highp float;

in vec4 colorToFragment;
out vec4 fragmentColor;

void main() {
	fragmentColor = colorToFragment;
}
