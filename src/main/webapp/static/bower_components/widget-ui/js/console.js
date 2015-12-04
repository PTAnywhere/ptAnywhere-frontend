// Define module if needed.
if (typeof(ptAnywhereWidgets) === 'undefined') {
    var ptAnywhereWidgets = {};
}

/**
 * Module to create PTAnywhere console GUI.
 */
ptAnywhereWidgets.console = (function () {

    var html = { // HTML labels
        cMessages: 'messages',
        cInteractive: 'interactive',
        cPrompt: 'prompt',
        cCurrent: 'current',
        nBottom: 'bottom',
    };

    /* Begin Console */
    /**
     * Creates a Console object.
     *   @param {string} selector
     *          Selector where the console will be inserted.
     */
    function Console(selector) {
        this.selector = $(selector);
        this.showingCached = false;
        this.cachedCurrentCommand = null;  // Used when showing historic commands.
    }

    function setConnected(console, connected) {
        $('.' + html.cCurrent, console.selector).prop('disabled', !connected);
    }

    Console.prototype.onConnect = function() {
        setConnected(this, true);
    }

    Console.prototype.getConnectionCallback = function() {
        var consoleObject = this;
        return function() {
            consoleObject.onConnect();
        };
    }

    Console.prototype.onWarning = function(message) {
        setConnected(this, false);
        $('.' + html.cInteractive, this.selector).hide();
        $('.' + html.cMessages, this.selector).html('<p>' + message + '</p>');
    }

    Console.prototype.getWarningCallback = function() {
        var consoleObject = this;
        return function(message) {
            consoleObject.onWarning(message);
        };
    }

    function addContent(cmd, msg) {
        // Not sure that we will ever get more than a line, but just in case.
        var lines = msg.split('\n');
        if (lines.length>1) {
            for (var i=0; i<lines.length-1; i++) { // Unnecessary?
                if (i==0) {
                    var lastLine = $('.' + html.cPrompt, cmd.selector).text();
                    if (lastLine.trim()!=='--More--')
                        $('.' + html.cMessages, cmd.selector).append(lastLine);
                    $('.' + html.cPrompt, cmd.selector).text('');
                }
                $('.' + html.cMessages, cmd.selector).append(lines[i] + '<br />');
            }
        }
        $('.' + html.cPrompt, cmd.selector).append(lines[lines.length-1]);
        scrollToBottom();
        $('.' + html.cCurrent, cmd.selector).focus();
    }

    Console.prototype.onUpdate = function(message) {
        addContent(this, message);
    }

    Console.prototype.getUpdateCallback = function() {
        var consoleObject = this;
        return function(message) {
            consoleObject.onUpdate(message);
        };
    }

    Console.prototype.isShowingCached = function() {
        return this.showingCached;
    }

    Console.prototype.clearCached = function() {
        this.setCommand('');
        this.cachedCurrentCommand = null;
    }

    Console.prototype.getCached = function() {
        return this.cachedCurrentCommand;
    }

    Console.prototype.isCaching = function() {
        return this.cachedCurrentCommand != null;
    }

    Console.prototype.updateCached = function() {
        this.cachedCurrentCommand = this.getCommand();
    }

    Console.prototype.getCommand = function() {
        return $('.' + html.cCurrent, this.selector).text();
    }

    Console.prototype.setCommand = function(command, showCurrentIfNull) {
        if (command!=null) {
            $('.' + html.cCurrent, this.selector).text(command);
            this.showingCached = false;
        } else {
            if (typeof showCurrentIfNull!=='undefined' && showCurrentIfNull && this.isCaching()) {
                $('.' + html.cCurrent, this.selector).text(this.getCached());
                this.showingCached = true;
            }
        }
    }

    Console.prototype.onReplaceCommand = function(command, showCurrentIfNull) {
        this.setCommand(command, showCurrentIfNull);
    }

    Console.prototype.getReplaceCommandCallback = function() {
        var consoleObject = this;
        return function(command, showCurrentIfNull) {
            consoleObject.onReplaceCommand(command, showCurrentIfNull);
        };
    }

    Console.prototype.onUpdate = function(message) {
        addContent(this, message);
    }

    function createDOM(parentSelector) {
        var interactiveDiv = $('<div class="' + html.cInteractive + '"></div>');
        interactiveDiv.append('<span class="' + html.cPrompt + '"></span><span> </span>');
        interactiveDiv.append('<span class="' + html.cCurrent + '" contentEditable="true"></span>');
        parentSelector.append('<div class="' + html.cMessages + '"></div>');
        parentSelector.append(interactiveDiv);
        parentSelector.append('<a name="' + html.nBottom + '"></a>');
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

    function configureEventListeners(cmd) {
      $('.' + html.cCurrent, cmd.selector).keypress(function(e) {
          if (typeof e.key === 'undefined') {
              e.key = getKey(e.keyCode);
          }
          if (e.key == 'Enter' || e.key == 'Tab') {  // or if (e.keyCode == 13 || e.keyCode == 9)
              var commandPressed =  cmd.getCommand(); /* It does not have '\n' or '\t' at this stage */
              if (e.key == 'Tab') {
                  e.preventDefault();  // Do not tab, stay in this field.
                  commandPressed += '\t';
              }
              ptAnywhere.websocket.send(commandPressed);
              cmd.clearCached();
          } else if (e.key == 'ArrowUp') {
              e.preventDefault();
              if (!cmd.isCaching() || cmd.isShowingCached())
                  cmd.updateCached();
              ptAnywhere.websocket.previous();
          } else if (e.key == 'ArrowDown') {
              e.preventDefault();
              ptAnywhere.websocket.next();
          }
      });

      $('.' + html.cCurrent, cmd.selector).keyup(function(e) {
          if (typeof e.key === 'undefined') {
              e.key = getKey(e.keyCode);
          }
          if (e.key != 'ArrowUp' && e.key != 'ArrowDown') {
              /* In PT, when '?' is pressed, the command is send as it is. */
              var written = cmd.getCommand();
              var lastChar = written.slice(-1);
              if (lastChar == '?') {
                  ptAnywhere.websocket.send(written);  /* It has '?' */
                  cmd.clearCached();
              }
          }
      });

      $('.' + html.cInteractive, cmd.selector).click(function() {
          $('.' + html.cCurrent, cmd.selector).focus();
      });
    }

    function init(selector) {
        var cmd = new Console(selector);
        createDOM(cmd.selector);
        configureEventListeners(cmd);
        return cmd;
    }

    function strEndsWith(str, suffix) {
        return str.match(suffix + '$')==suffix;
    }

    function scrollToBottom() {
        if (!strEndsWith(window.location.href, '#' + html.nBottom)) {
            document.location.replace(window.location.href + '#' + html.nBottom);
        } else {
            document.location.replace(window.location.href);
        }
        // document.location.replace('#bottom'); // Only works if base property is unset.
        // Another alternative registering "redirection" in the browser history.
        // window.location.href = '#bottom';
    }

    return {
        create: init
    };
})();
