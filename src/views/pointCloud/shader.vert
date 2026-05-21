precision highp float;
uniform float size;

void main() {
	gl_PointSize = size;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

}
