CLOCKWORKRT.components.register([
    {
        name: "keyboard",
        description: "This component allows you to incorporate keyboard support to your game, sending key events that other components can listen to.",
        events: [
            {
                name: "#setup", code: function (event) {
                    var names = ["keyup", "keydown"];
                    var tokens = [];

                    for (var i in names) {
                        tokens[i] = this.execute_event.bind(this, names[i]);
                        window.addEventListener(names[i], tokens[i], false);
                    }
                    this.setVar("eventstoken", tokens);
                }
            },
            {
                name: "#exit", code: function (event) {
                    var tokens = this.getVar("eventstoken");
                    var names = ["keyup", "keydown"];
                    for (var i in names) {
                        window.removeEventListener(names[i], tokens[i], false);
                    }
                }
            },
            {
                name: "keydown", code: function (event) {
                    this.engine.execute_event("keyboardDown", { key: event.keyCode });

                }
            },
            {
                name: "keyup", code: function (event) {
                    this.engine.execute_event("keyboardUp", { key: event.keyCode });
                }
            }
        ],
        triggers: [
            {
                "name": "keyboardDown",
                "description": "This event will be triggered once a key is pressed.",
                "dataSchema": {
                    "key": "<The key code>"
                }
            },
            {
                "name": "keyboardUp",
                "description": "This event will be triggered once a key is released.",
                "dataSchema": {
                    "key": "<The key code>"
                }
            }
        ]
    }
]);