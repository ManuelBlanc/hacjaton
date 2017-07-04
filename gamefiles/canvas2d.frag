precision highp float;

uniform sampler2D canvas2d;
varying vec2 texCoord;

void main(void) {
	//gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
	gl_FragColor = texture2D(canvas2d, texCoord);
}