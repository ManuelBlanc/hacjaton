CLOCKWORKRT.components.register([
	{
		name: "lockedMouse",
		vars: [
			{ name: "isLocked", value: false },
			{ name: "yaw",      value: 0     },
			{ name: "pitch",    value: 0     },
			{ name: "dYaw",     value: 0     },
			{ name: "dPitch",   value: 0     },
			{ name: "wheel",    value: 1     }
		],
		events: [
			{
				name: "#setup", code: function (event) {
					var canvas = this.engine.var["#DOM"];
					canvas.addEventListener("click", () => { canvas.requestPointerLock(); });
					canvas.addEventListener("mousemove", this.do.mousemove.bind(this));
					canvas.addEventListener("wheel", this.do.wheel.bind(this));
					document.addEventListener("pointerlockchange", this.do.pointerlockchange.bind(this));
				}
			},
			{
				name: "wheel", code: function (evt) {
					this.var.wheel = Math.max(0, Math.min(this.var.wheel+evt.deltaY, 1));
				},
			},
			{
				name: "mousemove", code: function (event) {
					if (!this.var.isLocked) return;
					var dYaw   = this.var.dYaw   = event.movementX*0.005;
					var dPitch = this.var.dPitch = event.movementY*0.005;
					this.var.yaw   -= dYaw; 
					this.var.pitch -= dPitch; 
					this.var.yaw   %= Math.PI*2;
					this.var.pitch = Math.max(-Math.PI/4, Math.min(this.var.pitch, Math.PI/4));
				}
			},
			{
				name: "pointerlockchange", code: function (event) {
					this.var.isLocked = (document.pointerLockElement == this.engine.var["#DOM"]);
				}
			}
		]
	},
	{
		name: "3dmove",
		vars: [
			{ name: "mouse", value: "mouse" },
			{ name: "keyboard", value: "keyboard" },
			{ name: "keys", value: {w:0, a:0, s:0, d:0} }
		],
		events: [
			{
				name: "#setup", code: function (event) {
					this.var.mouse    = this.engine.find(this.var.mouse);
					this.var.keyboard = this.engine.find(this.var.keyboard);
					if (!this.var.mouse)    throw "invalid mouse";
					if (!this.var.keyboard) throw "invalid keyboard";
				},
			},
			{
				name: "keyboardDown", code: function (event) {
					switch (event.key) {
						case 87: this.var.keys['w'] = 1; break;
						case 65: this.var.keys['a'] = 1; break;
						case 83: this.var.keys['s'] = 1; break;
						case 68: this.var.keys['d'] = 1; break;
						case 32: this.var.keys[' '] = 1; break;
					}
				},
			},
			{
				name: "keyboardUp", code: function (event) {
					switch (event.key) {
						case 87: this.var.keys['w'] = 0; break;
						case 65: this.var.keys['a'] = 0; break;
						case 83: this.var.keys['s'] = 0; break;
						case 68: this.var.keys['d'] = 0; break;
						case 32: this.var.keys[' '] = 0; break;
					}
				},
			},
			{
				name: "#loop", code: function (event) {
					var renderer = this.engine.getAnimationEngine();
					if (this.var.mouse.var.isLocked) {
						renderer.sendCommand("cameraAngles", {
							yaw:   this.var.mouse.var.yaw,
							pitch: this.var.mouse.var.pitch
						});
						renderer.sendCommand("cameraZoom", {
							zoom: this.var.mouse.var.wheel,
						});
						renderer.sendCommand("cameraMove", {
							x: this.var.keys.w - this.var.keys.s,
							y: this.var.keys.d - this.var.keys.a
						});
					}
				}
			}
		]
	},
	{
		name: "talkingDog",
		sprite: "dog",
		events: [
			{
				name: "#setup", code: function (event) {
					this.engine.debug.log("Object loaded");
					this.var.$text = "";
					this.var.timer = 0;
				}
			},
			{
				name: "#loop", code: function (event) {
					this.var.timer++;
					if (this.var.timer == 100) {
						this.var.$text = "Hello World";
						this.var.$state = "BarkL";
					}
					if (this.var.timer == 150) {
						this.engine.debug.log("Time to go");
						this.var.$text = "";
						this.var.$state = "RunR";
					}
					if (this.var.timer > 150) {
						this.var.$x += 5;
					}
				}
			}
		]
	}
]);