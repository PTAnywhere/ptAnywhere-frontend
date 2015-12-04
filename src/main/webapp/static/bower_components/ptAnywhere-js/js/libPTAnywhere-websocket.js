// Define module if needed.
if (typeof(ptAnywhere) === 'undefined') {
    var ptAnywhere = {};
}

/**
 * Client for PacketTracer's HTTP API.
 */
ptAnywhere.websocket = (function () {

    /** @type {Websocket|MozWebSocket} */
    var ws = null;

    /** @type {Object} */
    var callbacks = {
        /**
         * Called when it connects to the websocket successfully.
         * @callback connectionCallback
         */
        connected: null,
        /**
         * Called when the websocket receives a message.
         * @callback outputCallback
         * @param {string} message - Message received.
         */
        output: null,
        /**
         * @callback replaceCommandCallback
         * @param {string} command - Command to be displayed in the command line.
         * @param {boolean} showCurrentIfNull - Optional flag which indicates
         *              that if 'command' is null the current command should be
         *              displayed.
         */
        replace: null,
        /**
         * @callback warningCallback
         * @param {string} message - Warning message to be displayed.
         */
        warning: null
    };

    /**
     *  Module to handle the command line history.
     */
    var history = (function () {
        var commands = null;
        var currentIndex = 0;  // Iterator from 0 to length+1
        // In last position you can already access previous.

        function update(newCommandHistory, callback) {
            commands = newCommandHistory;
            currentIndex = commands.length; // Current is outside the array limits at the beginning
            callback(getPreviousCommand());
        }

        function markToUpdate() {
            commands = null;
        }

        function needsToBeUpdated() {
            return commands==null;
        }

        function getPreviousCommand() {
            // No previous (already in the first position or empty array)
            if (currentIndex==0 || commands.length==0) return null;
            return commands[--currentIndex];
        }

        function getNextCommand() {
            // if currentIndex is in length-1, there is no 'next command'.
            if (currentIndex==commands.length-1) currentIndex++; // current can still be moved to last position
            if (currentIndex==commands.length) return null;
            return commands[++currentIndex];
        }

        return {
            markToUpdate: markToUpdate,
            needsToBeUpdated: needsToBeUpdated,
            update: update,
            previous: getPreviousCommand,
            next: getNextCommand
        };
    })();

    function connect(target) {
        console.log('Connecting to websocket endpoint... (' + target + ')');

        if ('WebSocket' in window) {
            ws = new WebSocket(target);
        } else if ('MozWebSocket' in window) {
            ws = new MozWebSocket(target);
        } else {
            alert('WebSocket is not supported by this browser.');
            return;
        }
        ws.onopen = function () {
            console.log('Info: WebSocket connection opened.');
            callbacks.connected();
        };
        ws.onmessage = function (event) {
            var msg = JSON.parse(event.data);
            if (msg.hasOwnProperty('prompt')) {  // At the beginning of the session
                callbacks.output(msg.prompt);
            } else
            if (msg.hasOwnProperty('out')) {
                callbacks.output(msg.out);
            } else
            if (msg.hasOwnProperty('history')) {
                history.update(msg.history, function(previousCommand) {
                    callbacks.replace(previousCommand);
                });
            }
        };
        ws.onerror = function (event) {
            console.error('Info: WebSocket error, Code: ' + event.code + (event.reason == '' ? '' : ', Reason: ' + event.reason));
            callbacks.warning('Websocket error. ' +  event.reason);
        };
        ws.onclose = function (event) {
            console.log('Info: WebSocket connection closed, Code: ' + event.code + (event.reason == '' ? '' : ', Reason: ' + event.reason));
            callbacks.warning('Connection closed. ' +  event.reason);
        };
    }

    /**
     *  Module initialization function.
     *  @param {string} websocketURL - URL of the websocket for the PTAnywhere command line.
     *  @param {connectionCallback} connectedCallback - Function to be called after a successful websocket connection.
     *  @param {outputCallback} outputCallback - Function to be called on message reception.
     *  @param {replaceCommandCallback} replaceCommandCallback - Function to be called when the current command needs to be replaced.
     *  @param {warningCallback} warningCallback - Function to be called when a warning message is created.
     */
    function init(websocketURL, connectedCallback, outputCallback, replaceCommandCallback, warningCallback) {
        callbacks.connected = connectedCallback;
        callbacks.output = outputCallback;
        callbacks.replace = replaceCommandCallback;
        callbacks.warning = warningCallback;
        connect(websocketURL);
    }

    /**
     *  Sends a command through the websocket.
     *  @param {string} msg - Message to be written.
     */
    function send(msg) {
        ws.send(msg);
        history.markToUpdate();  // To ensure that an updated version is get the next time...
    }

    /**
     *  Looks for the previous command in the command line history.
     *  This command is returned in a callback to the {replaceCommandCallback}
     *  object passed to the start function.
     */
    function previousCommand() {
        if (history.needsToBeUpdated()) {
            ws.send('/getHistory');
        } else {
            callbacks.replace(history.previous());
        }
    }

    /**
     *  Looks for the next command in the command line history
     *  This command is returned in a callback to the {replaceCommandCallback}
     *  object passed to the start function.
     */
    function nextCommand() {
        if (!history.needsToBeUpdated()) {
            callbacks.replace(history.next(), true);
        }
    }

    return {
        start: init,
        send: send,
        previous: previousCommand,
        next: nextCommand
    };
})();
