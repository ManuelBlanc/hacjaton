var SpriteWebGL = (function () {
	"use strict";

	var canvas = null;
	var renderer = null;
	var scene = null;
	var camera = null;
	var onLoad = function() {
		throw "SpriteWebGL _must_ be chained with Spritesheet"
	};
	var pitch = 0, yaw = 0;
	var cameraVel = new THREE.Vector3();

	var light;

	return {
		// This function receives a reference to a canvaselement and the number of fps requested
		setUp: function (ncanvas, nfps) {
			canvas = ncanvas;

			renderer = new THREE.WebGLRenderer({canvas: canvas});
			scene = new THREE.Scene();

			camera = new THREE.PerspectiveCamera(90, 1, 5, 10000);
			camera.position.z = 512;
			camera.lookAt(new THREE.Vector3(0,0,1).add(camera.position))
			scene.add(camera);

			light = new THREE.PointLight( 0xFFFFFF );
			scene.add( light );

			onLoad(ncanvas, nfps);
		},
		// This function sends a command to your library, you can use this an extension point to provide additional functionality
		sendCommand: function (cmd, args) {
			switch (cmd) {
				case "cameraAngles":
					pitch = args.pitch;
					yaw   = args.yaw;
					var dir = new THREE.Vector3(
						Math.cos(pitch) * Math.sin(yaw),
						Math.sin(pitch),
						Math.cos(pitch) * Math.cos(yaw) 
					).add(camera.position);
					camera.lookAt(dir);
					break;
				case "cameraMove":
					cameraVel.add(new THREE.Vector3(
						args.x*Math.sin(yaw) - args.y*Math.cos(yaw),
						0,
						args.x*Math.cos(yaw) + args.y*Math.sin(yaw)
					).normalize());
					var speed = cameraVel.length();
					if (speed > 0) {
						var newspeed = Math.max(0, 1 - 0.01*Math.max(speed, 0.1));
						cameraVel.multiplyScalar(newspeed);
					}
					camera.position.add(cameraVel);
					light.position.copy(camera.position);
					break;
				case "cameraZoom":
					camera.zoom = 1+3*args.zoom;
					break;
				default:
					throw "Invalid command " + cmd;
			}
		},
		setRenderMode: function() {
			console.log("IGNORADO");
		},
		setBufferSize: function() {
			console.log("IGNORADO");
		},
		// Chains to an instance of another rendering library, used in "proxy" libraries (for recording, networking, perspective...)
		chainWith: function (renderingLibrary) {
			// Rederigimos el resto de llamadas a la libreria de abajo
			// * setUp es un caso especial que se trata mas arriba
			// * No permitimos cambiar el render mode (Arcadio WTF?)
			var forbidden = ["setUp", "setRenderMode", "setBufferSize", "sendCommand"];
			Object.keys(renderingLibrary)
				.filter((key) => forbidden.indexOf(key) === -1)
				.forEach((key) => {
					this[key] = renderingLibrary[key].bind(renderingLibrary);
				});

			var texture, material, geometry, mesh;

			this["setBufferSize"] = function(width, height) {
				if (mesh) scene.remove(mesh);
				texture = new THREE.Texture();
				material = new THREE.MeshBasicMaterial({ map: texture });
				geometry = new THREE.PlaneGeometry(width, height);
				mesh = new THREE.Mesh(geometry, material);
				scene.add(mesh);

				(function addWall() {
					var geo = new THREE.PlaneGeometry(4000, height);
					var mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial( { color: 0xFFFFFF } ));
					mesh.translateX(0);
					mesh.translateY(0);
					mesh.translateZ(-1);
					scene.add(mesh);

					var geo = new THREE.PlaneGeometry(4000, height);
					var mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial( { color: 0xFFFFFF } ));
					mesh.translateX(2000);
					mesh.translateY(0);
					mesh.translateZ(2000);
					mesh.rotateY(-Math.PI/2);
					scene.add(mesh);

					var geo = new THREE.PlaneGeometry(4000, height);
					var mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial( { color: 0xFFFFFF } ));
					mesh.translateX(2000);
					mesh.translateY(0);
					mesh.translateZ(2000);
					mesh.rotateY(Math.PI/2);
					scene.add(mesh);

					var geo = new THREE.PlaneGeometry(4000, 4000);
					var mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial( { color: 0xFFFFFF } ));
					mesh.translateX(0);
					mesh.translateY(height/2);
					mesh.translateZ(2000);
					mesh.rotateX(Math.PI/2);
					scene.add(mesh);

					var geo = new THREE.PlaneGeometry(4000, 4000);
					var mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial( { color: 0xFFFFFF } ));
					mesh.translateX(0);
					mesh.translateY(-height/2);
					mesh.translateZ(2000);
					mesh.rotateX(-Math.PI/2);
					scene.add(mesh);
				})();
			};

			renderingLibrary.setRenderMode(() => {/* noop*/});

			onLoad = (canvas, fps) => {
				renderingLibrary.setUp(canvas, fps);

				// Modificamos el rendermode de la libreria de abajo para que vaya a traves de WebGL
				var first = true;
				renderingLibrary.setRenderMode(function(ctxIn, _ctxOut_) {
					if (!texture) return;
					texture.image = ctxIn.canvas;
					texture.needsUpdate = true;
					renderer.render(scene, camera);
				});
			};
		}
	};
});

CLOCKWORKRT.rendering.setPipeline(["SpriteWebGL", "spritesheet"]);
CLOCKWORKRT.rendering.add("SpriteWebGL", SpriteWebGL);