<!DOCTYPE html>
<html>
    <head lang="en">
        <meta charset="UTF-8">
        <title>Console</title>

        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font: 10pt monospace, Helvetica, Arial; }
            #messages { margin: 0; padding: 0; white-space: pre; }
            #interactive { width: 100%; }
            #lastLine { float: left; margin-right: 4px; }
            #current { display: block; height: 10pt; }
        </style>

        <#include "headers/jquery.ftl">
        <script>
            var ptCommandLine = (function () {

                var ws = null;
                var callbacks = {
                    connected: null,
                    output: null,
                    replace: null,
                    warning: null
                };

                // TODO unit testing
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
                        if (msg.hasOwnProperty('prompt')) {  // At the beginning of thr session
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

                function init(websocketURL, connectedCallback, outputCallback, replaceCommandCallback, warningCallback) {
                    callbacks.connected = connectedCallback;
                    callbacks.output = outputCallback;
                    callbacks.replace = replaceCommandCallback;
                    callbacks.warning = warningCallback;
                    connect(websocketURL);
                }

                function send(msg) {
                    ws.send(msg);
                    history.markToUpdate();  // To ensure that an updated version is get the next time...
                }

                function previousCommand() {
                    if (history.needsToBeUpdated()) {
                        ws.send('/getHistory');
                    } else {
                        callbacks.replace(history.previous());
                    }
                }

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

            var cmdElement = (function () {

                var showingCached = false;
                var cachedCurrentCommand = null;  // Used when showing historic commands.

                function getCurrentCommand() {
                    return $('#current').text();
                }

                function setCurrentCommand(command, showCurrentIfNull) {
                    if (command!=null) {
                        $('#current').text(command);
                        showingCached = false;
                    } else {
                        if (typeof showCurrentIfNull!=='undefined' && showCurrentIfNull && cachedCurrentCommand!=null) {
                            $('#current').text(cachedCurrentCommand);
                            showingCached = true;
                        }
                    }
                }

                function setConnected(connected) {
                    $('#current').prop('disabled', !connected);
                }

                // Fix for Chrome and Safari where e.key is undefined
                function getKey(keyCode) {
                    switch(keyCode) {
                        case 9: return 'Tab';
                        case 13: return 'Enter';
                        case 38: return 'ArrowUp';
                        case 40: return 'ArrowDown';
                        default: return null;
                    }
                }

                function init() {
                    $('#current').keypress(function(e) {
                        if (typeof e.key === 'undefined') {
                            e.key = getKey(e.keyCode);
                        }
                        if (e.key == 'Enter' || e.key == 'Tab') {  // or if (e.keyCode == 13 || e.keyCode == 9)
                            var commandPressed =  getCurrentCommand(); /* It does not have '\n' or '\t' at this stage */
                            if (e.key == 'Tab') {
                                e.preventDefault();  // Do not tab, stay in this field.
                                commandPressed += '\t';
                            }
                            ptCommandLine.send(commandPressed);
                            cachedCurrentCommand = null;
                            setCurrentCommand('');
                        } else if (e.key == 'ArrowUp') {
                            e.preventDefault();
                            if (cachedCurrentCommand==null || showingCached)
                                cachedCurrentCommand = getCurrentCommand();
                            ptCommandLine.previous();
                        } else if (e.key == 'ArrowDown') {
                            e.preventDefault();
                            ptCommandLine.next();
                        }
                    });

                    $('#current').keyup(function(e) {
                        if (typeof e.key === 'undefined') {
                            e.key = getKey(e.keyCode);
                        }
                        if (e.key != 'ArrowUp' && e.key != 'ArrowDown') {
                            /* In PT, when '?' is pressed, the command is send as it is. */
                            var written = getCurrentCommand();
                            var lastChar = written.slice(-1);
                            if (lastChar == '?') {
                                ptCommandLine.send(written);  /* It has '?' */
                                cachedCurrentCommand = null;
                                setCurrentCommand('');
                            }
                        }
                    });

                    $('#lastLine').click(function() {
                        $('#current').focus();
                    });
                }

                function strEndsWith(str, suffix) {
                    return str.match(suffix + '$')==suffix;
                }

                function scrollToBottom() {
                    if (!strEndsWith(window.location.href, '#bottom')) {
                        document.location.replace(window.location.href + '#bottom');
                    } else {
                        document.location.replace(window.location.href);
                    }
                    // document.location.replace('#bottom'); // Only works if base property is unset.
                    // Another alternative registering "redirection" in the browser history.
                    // window.location.href = '#bottom';
                }

                function addContent(msg) {
                    // Not sure that we will ever get more than a line, but just in case.
                    var lines = msg.split('\n');
                    if (lines.length>1) {
                        for (var i=0; i<lines.length-1; i++) { // Unnecessary
                            if (i==0) {
                                var lastLine = $('#lastLine').text();
                                if (lastLine.trim()!=='--More--')
                                    $('#messages').append(lastLine);
                                $('#lastLine').text('');
                            }
                            $('#messages').append(lines[i] + '<br />');
                        }
                    }
                    $('#lastLine').append(lines[lines.length-1]);
                    scrollToBottom();
                    $('#current').focus();
                }

                function showWarning(message) {
                    setConnected(false);
                    $('#interactive').hide();
                    $('#messages').html('<p>' + message + '</p>');
                }

                function connected() {
                    setConnected(true);
                }

                return {
                    init: init,
                    connected: connected,
                    update: addContent,
                    replaceCommand: setCurrentCommand,
                    warning: showWarning
                };
            })();

            $(function() {
                cmdElement.init();
                ptCommandLine.start('${websocketURL}', cmdElement.connected, cmdElement.update, cmdElement.replaceCommand, cmdElement.warning);
            });
        </script>
    </head>
    <body>
        <div id="messages"></div>
        <div id="interactive">
            <span id="lastLine"></span>
            <span id="current" contentEditable="true"></span>
        </div>
        <a name="bottom"></a>
    </body>
</html>