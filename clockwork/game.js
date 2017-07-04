(function () {
    "use strict";

    var CLOCKWORKCONFIG = {};

    var XHRPromise = function (url) {
        return new Promise(function(resolve, reject) {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", url);
            xhr.onload  = () => resolve(xhr.responseText);
            xhr.onerror = () => reject(xhr.statusText);
            xhr.send();
        });
    };

    var loadScriptPromise = function (url) {
        return new Promise(function(resolve, reject) {
            var tag = document.createElement("script");
            tag.src = url;
            tag.addEventListener("load", resolve, false);
            tag.addEventListener("error", reject, false);
            document.head.appendChild(tag);
        });
    };


    var ObjectCatalog = function () { this._catalog = {}; };
    ObjectCatalog.prototype = {
        // Add a single object to the catalog.
        add: function (name, value) {
            if (name in this._catalog) throw "Component " + name + " already registered!";
            this._catalog[name] = value;
            return this;
        },
        // Retrieve a single object.
        get: function (name) {
            return this._catalog[name];
        },
        // Retrieve all objects.
        getAll: function () {
            return Object.values(this._catalog);
        },
        // Register an associative array of objects.
        register: function (catalog) {
            catalog.forEach((item) => {
                this.add(item.name, item);
            });
            return this;
        }
    };


    var CLOCKWORKRT = window.CLOCKWORKRT = {}
    CLOCKWORKRT.API = {};
    CLOCKWORKRT.API.appPath = () => "gamefiles"
    CLOCKWORKRT.API.manifest = XHRPromise(CLOCKWORKRT.API.appPath() + "/manifest.json").then(JSON.parse),
    CLOCKWORKRT.apps = {
        urlForDependency: function (name, version) {
            //Load cached dependencies
            return "dependencies/" + name + "/" + version + ".js";
        }
    };


    window.addEventListener("load", () => {

        //List of components, only two operations are allowed: register and get
        CLOCKWORKRT.components = new ObjectCatalog();

        //List of components, only two operations are allowed: register and get
        CLOCKWORKRT.collisions = new ObjectCatalog();

        //List of rendering libraries, plus rendering pipeline
        var rendering = CLOCKWORKRT.rendering = new ObjectCatalog();
        // Default renderer: Spritesheet
        rendering.add("spritesheet", Spritesheet);
        rendering.pipeline = ["spritesheet"];

        // We add the two extra functions we need
        rendering.setPipeline = function (pipeline) {
            this.pipeline = pipeline;
        };
        rendering.getPipeline = function () {
            return this.pipeline;
        };

        var manifest, canvas, animlib, engine;

        // Load the manifest
        CLOCKWORKRT.API.manifest.then((the_manifest) => {
            manifest = the_manifest;

            CLOCKWORKCONFIG = {
                enginefps: manifest.enginefps,
                animationfps: manifest.animationfps,
                screenbuffer_width: manifest.screenResolution ? manifest.screenResolution.w : 0,
                screenbuffer_height: manifest.screenResolution ? manifest.screenResolution.h : 0
            };

            return true;

        // Load dependencies
        }).then(() => {
                return Promise.all(
                    Object.keys(manifest.dependencies)
                        .map((name) => CLOCKWORKRT.apps.urlForDependency(name, manifest.dependencies[name]))
                        .map(loadScriptPromise)
                );

        // Load components
        }).then(() => {
                return Promise.all(
                    manifest.components
                        .map((name) => CLOCKWORKRT.API.appPath() + "/" + name)
                        .map(loadScriptPromise)
                );

        // Prepare the pipeline
        }).then(() => {
            var initPipeline = CLOCKWORKRT.rendering.getPipeline()
                .map((x) => CLOCKWORKRT.rendering.get(x)())
            
            initPipeline.reduce((x, y) => x.chainWith(y));
            animlib = initPipeline[0];

            document.body.style["background-color"] = manifest.backgroundColor || "black";
            
            canvas = document.getElementById("canvas");
            canvas.style = "position:absolute;top:0px;left:0px;margin:0px;width:100%;height:100%;";

            // Attatch to the global resize callback
            function resize_canvas() {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
            window.addEventListener("resize", resize_canvas, true); // UseCapture!
            resize_canvas();

            return true;

        // Config the anim lib
        }).then(() => {
            animlib.setUp(canvas, CLOCKWORKCONFIG.animationfps);
            animlib.setBufferSize(CLOCKWORKCONFIG.screenbuffer_width, CLOCKWORKCONFIG.screenbuffer_height);
            animlib.setRenderMode(function (contextinput, contextoutput) {
                contextoutput.clearRect(0, 0, contextoutput.canvas.width, contextoutput.canvas.height);
                //All the width available will be used, the aspect ratio will be the same and the image will be centered vertically
                if (contextoutput.canvas.width / contextinput.canvas.width < contextoutput.canvas.height / contextinput.canvas.height) {
                    var xpos = 0;
                    var ypos = (contextoutput.canvas.height - contextinput.canvas.height * contextoutput.canvas.width / contextinput.canvas.width) / 2;
                    var width = contextoutput.canvas.width;
                    var height = (contextinput.canvas.height * contextoutput.canvas.width / contextinput.canvas.width);
                } else {
                    var xpos = (contextoutput.canvas.width - contextinput.canvas.width * contextoutput.canvas.height / contextinput.canvas.height) / 2;
                    var ypos = 0;
                    var width = (contextinput.canvas.width * contextoutput.canvas.height / contextinput.canvas.height);
                    var height = contextoutput.canvas.height;
                }
                contextoutput.drawImage(contextinput.canvas, xpos, ypos, width, height);
            });
            animlib.setWorkingFolder(CLOCKWORKRT.API.appPath());
            
            return Promise.all(
                manifest.spritesheets
                .map((file) => CLOCKWORKRT.API.appPath() + "/" + file)
                .map((path) => XHRPromise(path)
                    .then(JSON.parse)
                    .then((x) => animlib.loadSpritesheetJSONObject(x))
                )
            );
        }).then(() => {
            engine = new Clockwork();
            CLOCKWORKCONFIG.engine = engine;

            engine.setAnimationEngine(animlib);
            CLOCKWORKRT.collisions.getAll().map(engine.registerCollision);
            engine.loadComponents(CLOCKWORKRT.components.getAll());
            return Promise.all(
                manifest.levels
                    .map(lvl => CLOCKWORKRT.API.appPath() + "/" + lvl)
                    .map((url) => XHRPromise(url)
                        .then(JSON.parse)
                        .then((json) => engine.loadLevelsFromJSONobject(json))
                    )
            );
        }).then(() => {        
            if (localStorage.debugMode == "true") {
                if (localStorage.levelEditor === "true") {
                    engineInstance.registerCollision(mouseCollisions);
                    engineInstance.loadComponents(levelEditorComponents);
                    engineInstance.loadComponents(mouseComponent);
                    loadLevelEditor(engineInstance);
                    var wf = animLib.getWorkingFolder();
                    animLib.setWorkingFolder(null);
                    animLib.loadSpritesheetJSONObject(levelEditorSpriteseets);
                    animLib.setWorkingFolder(wf);
                }
                var socket = io(localStorage.debugFrontend);
                socket.on('setBreakpoints',  (data) => engineInstance.setBreakpoints(data) );
                socket.on('continueRequest', ()     => engineInstance.debug.continue()     );
                socket.on('stepOverRequest', ()     => engineInstance.debug.stepOver()     );
                socket.on('stepInRequest',   ()     => engineInstance.debug.stepIn()       );
                socket.on('stepOutRequest',  ()     => engineInstance.debug.stepOut()      );
                socket.on('connect', function () {
                    engineInstance.start(CLOCKWORKCONFIG.enginefps, canvas);
                });
                socket.on('eval', function (data) {
                    socket.emit('evalResult', {
                        id: data.id,
                        result: engineInstance.debug.eval(data.expression)
                    });
                });
                animLib.debug(function (message) {
                    socket.emit('exception', { msg: message });
                });
                engineInstance.setBreakpointHandler(function (event, data) {
                    switch (event) {
                        case 'breakpointHit':
                            socket.emit('breakpointHit', {
                                bp: data.bp,
                                vars: data.vars,
                                engineVars: data.globalvars,
                                stack: data.stack
                            });
                            break;
                        case 'continue':
                            socket.emit('continue', {});
                            break;
                        case 'error':
                            socket.emit('exception', { msg: data.msg });
                            break;
                        case 'log':
                            socket.emit('log', { msg: data });
                            break;
                    }
                });
            } else {
                engine.start(CLOCKWORKCONFIG.enginefps, canvas);
            }
        });
    });
})();
