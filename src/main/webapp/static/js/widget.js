
// Widget creator module and its submodules
// The Revealing Module Pattern
// http://addyosmani.com/resources/essentialjsdesignpatterns/book/#revealingmodulepatternjavascript
var ptAnywhere = (function () {

    var widgetSelector;
    var ptClient;  // JS client of the HTTP API


    // Begin: utility functions
    //  (They are used in many submodules)

    /**
     * @param defaultSelection It can be an int with the number of the option to be selected or a "null" (for any choice).
     * @return Selected port.
     */
    function loadPortsInSelect(ports, selectElement, defaultSelection) {
        var ret = null;
        selectElement.html(''); // Remove everything
        for (var i = 0; i < ports.length; i++) {
            var portName = ports[i].portName;
            var portURL = ports[i].url;
            var htmlAppend = '<option value="' + portURL + '"';
            if (i == defaultSelection) {
                htmlAppend += ' selected';
                ret = ports[i];
            }
            selectElement.append(htmlAppend + '>' + portName + '</option>');
        }
        return ret;
    }
    // End: utility functions

    // Module which handles command line
    var commandLine = (function () {

        var dialogSelector;

        function createDOM(parentSelector) {
            dialogSelector = $('<div></div>');
            parentSelector.append(dialogSelector);
        }

        function openIFrame(node) {
            var dialog = dialogSelector.dialog({
                title: res.commandLineDialog.title,
                autoOpen: false, height: 400, width: 600, modal: true, draggable: false,
                close: function() { dialog.html(""); }
            });
            dialog.html('<div class="iframeWrapper"><iframe class="terminal" src="console?endpoint=' + node.consoleEndpoint + '"></iframe></div>');
            dialog.dialog('open');
        }

        // Reveal public pointers to
        // private functions and properties
        return {
            init: createDOM,
            open: openIFrame,
        };
    })();  // End commandLine module

    // Class for draggable device creation
    function DraggableDevice(el, canvasEl, deviceType) {
        this.el = el;
        this.originalPosition = {
            'left': el.css('left'),
            'top': el.css('top')
        };
        this.canvas = canvasEl;
        this.deviceType = deviceType;
        var thisObj = this;
        this.el.draggable({
            helper: 'clone',
            opacity: 0.4,
            // The following properties interfere with the position I want to capture in the 'stop' event
            /*revert: true, revertDuration: 2000,  */
            start: function(event, ui) {
                $(this).css({'opacity':'0.7'});
            },
            stop: function(event, ui) {
                if (thisObj.collisionsWithCanvas(ui.helper)) {
                    thisObj.startCreatingIcon(ui);
                    thisObj.createDevice(ui.offset);
                } else {
                    thisObj.moveToStartingPosition();
                }
            }
        });
    }

    // Source: http://stackoverflow.com/questions/5419134/how-to-detect-if-two-divs-touch-with-jquery
    DraggableDevice.prototype.collisionsWithCanvas = function(draggingEl) {
        var x1 = this.canvas.offset().left;
        var y1 = this.canvas.offset().top;
        var h1 = this.canvas.outerHeight(true);
        var w1 = this.canvas.outerWidth(true);
        var b1 = y1 + h1;
        var r1 = x1 + w1;
        var x2 = draggingEl.offset().left;
        var y2 = draggingEl.offset().top;
        var h2 = draggingEl.outerHeight(true);
        var w2 = draggingEl.outerWidth(true);
        var b2 = y2 + h2;
        var r2 = x2 + w2;

        if (b1 < y2 || y1 > b2 || r1 < x2 || x1 > r2) return false;
        return true;
    };

    DraggableDevice.prototype.moveToStartingPosition = function() {
        var obj = this;
        this.el.animate({'opacity':'1'}, 1000, function() {
            obj.el.css({ // would be great with an animation too, but it doesn't work
                'left': obj.originalPosition.left,
                'top': obj.originalPosition.top
            });
        });
    };

    DraggableDevice.prototype.startCreatingIcon = function(ui) {
        var image = $('<img alt="Temporary image" src="' + ui.helper.attr('src') + '">');
        image.css('width', ui.helper.css('width'));
        var warning = $('<div class="text-in-image"><span>Creating...</span></div>');
        warning.prepend(image);
        $('body').append(warning);
        warning.css({'position': 'absolute',
                     'left': ui.offset.left,
                     'top': ui.offset.top});
        this.creatingIcon = warning;
    };

    DraggableDevice.prototype.stopCreatingIcon = function(ui) {
        this.moveToStartingPosition();
        this.creatingIcon.remove();
    };

    DraggableDevice.prototype.createDevice = function(elementOffset) {
        var x = elementOffset.left;
        var y = elementOffset.top;
        var position = networkMap.getCoordinate(x, y);
        var thisObj = this;
        // We don't use the return
        return ptClient.addDevice({
                    'group': this.deviceType,
                    'x': position.x,
                    'y': position.y
                }, function(data) {  // Success
                    thisObj.stopCreatingIcon();
                    networkMap.addNode(data);
                }).
                fail(function(data) {
                    thisObj.stopCreatingIcon();
                });
    };
    // End DraggableDevice class

    // Module for creating device network map
    var networkMap = (function () {

        //var nodes = null; // To replace in the future with null
        //var edges = null; // To replace in the future with null
        var nodes, edges;
        var network;
        var containerSelector = null;

        var html = {  // Literals for classes, identifiers, names or paths
            iconsPath: '../static/images/',
            cLoadingIcon: 'loading-icon',
            idLoadingMessage: 'loadingMessage',
        };

        // Created the DOM that shorty afterwards will be replaced by the network map
        function createTemporaryDOM() {
            containerSelector.append('<img class="' + html.cLoadingIcon + '" src="' + html.iconsPath + 'loading.gif" alt="Loading network topology..." />' +
                                  '<div style="text-align: center;">' +
                                  '<p>' + res.network.loading + '<p>' +
                                  '<p id="' + html.idLoadingMessage + '"></p>' +
                                  '</div>');
        }

        function drawTopology(responseData) {
            // Initialize data sets if needed
            if (nodes==null) {
                nodes = new vis.DataSet();
            }
            if (edges==null) {
                edges = new vis.DataSet();
            }

            // Load data
            if (responseData.devices!=null) {
                nodes.clear();
                nodes.add(responseData.devices);
            }
            if (responseData.edges!=null) {
                edges.clear();
                edges.add(responseData.edges);
            }

            // Create network element if needed (only the first time)
            if (network==null) {
                // create a network
                var visData = { nodes : nodes, edges : edges };
                var options = {
                    nodes: {
                        physics: false,
                        font: '14px verdana black',
                    },
                    edges: {
                        width: 3,
                        selectionWidth: 1.4,
                        color: {
                            color:'#606060',
                            highlight:'#000000',
                            hover: '#000000'
                        }
                     },
                    groups: {
                        cloudDevice : {
                            shape : 'image',
                            image : html.iconsPath + 'cloud.png',
                            size: 50,
                        },
                        routerDevice : {
                            shape : 'image',
                            image : html.iconsPath + 'router.png',
                            size: 45,
                        },
                        switchDevice : {
                            shape : 'image',
                            image : html.iconsPath + 'switch.png',
                            size: 35,
                        },
                        pcDevice : {
                            shape : 'image',
                            image : html.iconsPath + 'PC.png',
                            size: 45,
                        }
                    },
                    manipulation: {
                        initiallyActive: true,
                        addNode: function(data, callback) {
                                    deviceCreationDialog.open(data.x, data.y, addNode);
                                 },
                        addEdge: function(data, callback) {
                                    var fromDevice = nodes.get(data.from);
                                    var toDevice = nodes.get(data.to);
                                    var sCallback = function(edgeId, edgeUrl) {
                                                        edges.add([{
                                                            id: edgeId,
                                                            url: edgeUrl,
                                                            from: fromDevice.id,
                                                            to: toDevice.id,
                                                        }]);
                                                    };
                                    linkDialog.open(fromDevice, toDevice, sCallback);
                                 },
                        editNode: function(data, callback) {
                                    var successUpdatingNode = function(result) { nodes.update(result); };
                                    deviceModificationDialog.open(nodes.get(data.id), successUpdatingNode);
                                    callback(data);
                                  },
                        editEdge: false,
                        deleteNode: function(data, callback) {
                                        // Always (data.nodes.length>0) && (data.edges.length==0)
                                        // FIXME There might be more than a node selected...
                                        ptClient.removeDevice(nodes.get(data.nodes[0]));
                                        // This callback is important, otherwise it received 3 consecutive onDelete events.
                                        callback(data);
                                    },
                        deleteEdge: function(data, callback) {
                                        // Always (data.nodes.length==0) && (data.edges.length>0)
                                        // FIXME There might be more than an edge selected...
                                        var edgeId = data.edges[0]; // Var created just to enhance readability
                                        ptClient.removeLink( edges.get(edgeId).url );
                                        // This callback is important, otherwise it received 3 consecutive onDelete events.
                                        callback(data);
                                    },
                    },
                    locale: 'ptAnywhere',
                    locales: {
                        ptAnywhere: res.manipulationMenu
                    },
                };
                network = new vis.Network(containerSelector.get(0), visData, options);
                network.on('doubleClick', function() {
                    var selected = getSelectedNode();
                    if (selected!=null)
                        commandLine.open(selected);
                });
            }
        }

        function addNode(newNode) {
            nodes.add(newNode);
        }

        /**
         * Canvas' (0,0) does not correspond with the network map's DOM (0,0) position.
         *   @arg x DOM X coordinate relative to the canvas element.
         *   @arg y DOM Y coordinate relative to the canvas element.
         *   @return Coordinates on the canvas with form {x:Number, y:Number}.
         */
        function toNetworkMapCoordinate(x, y) {
            return network.DOMtoCanvas({x: x, y: y});
        }

        /**
         * @arg callback If it is null, it is simply ignored.
         */
        function loadTopology(containerId, callback) {
            containerSelector = $('#' + containerId);
            createTemporaryDOM();

            var draw = drawTopology;
            ptClient.getNetwork(function(data) {
                draw(data);
                if (callback!=null)
                    callback();
            }, function(tryCount, maxRetries, errorMessage) {
                $('#' + html.idLoadingMessage).text(errorMessage + '. ' + res.network.attempt + ' ' + tryCount + '/' + maxRetries + '.');
            });
        }

        function getSelectedNode() {
            var selected = network.getSelection();
            if (selected.nodes.length!=1) { // Only if just one is selected
                console.log('Only one device is supposed to be selected. Instead ' + selected.nodes.length + ' are selected.');
                return null;
            }
            return nodes.get(selected.nodes[0]);
        }

        // Reveal public pointers to
        // private functions and properties
       return {
            load: loadTopology,
            addNode: addNode,
            getCoordinate: toNetworkMapCoordinate,
       };

    })();
    // End networkMap module

    // Dialog for link creation
    var linkDialog = (function () {  // closure

        var dialogSelector = null;
        var fromDevice = null, toDevice = null;
        var successfulCreationCallback;
        var oneLoaded = false;

        // Literals for classes
        var clazz = {
            fromName: 'fromDeviceName',
            toName: 'toDeviceName',
            fromInterface: 'linkFromInterface',
            toInterface: 'linkToInterface',
            loading: 'loading',
            loaded: 'loaded',
            error: 'error',
            errorMsg: 'error-msg',
        }


        function createDOM(parentSelector, dialogId) {
            var dialogForm = $('<form name="link-devices"></form>');
            dialogForm.append('<div class="' + clazz.loading + '">' + res.loadingInfo + '</div>');
            dialogForm.append('<div class="' + clazz.loaded + '">' +
                              '  <p>' + res.linkDialog.select + '</p>' +
                              '  <p><span class="' + clazz.fromName + '">Device 1</span>:' +
                              '    <select class="' + clazz.fromInterface + '" size="1">' +
                              '      <option value="loading">' + res.loading + '</option>' +
                              '     </select>' +
                              '  </p>' +
                              '  <p><span class="' + clazz.toName + '">Device 2</span>:' +
                              '    <select class="' + clazz.toInterface + '" size="1">' +
                              '      <option value="loading">' + res.loading + '</option>' +
                              '    </select>' +
                              '  </p>' +
                              '</div>');
            dialogForm.append('<div class="' + clazz.error + '">' +
                              '  <p>' + res.linkDialog.error + '</p>' +
                              '  <p class="' + clazz.errorMsg + '"></p>' +
                              '</div>');
            parentSelector.append('<div id="' + dialogId + '">' + dialogForm.html() + '</div>');
        }

        function showPanel(classToShow) {
            var classNames = [clazz.loading, clazz.loaded, clazz.error];
            for (i in classNames) {
                if (classNames[i]==classToShow) {
                    $(" ." + classNames[i], dialogSelector).show();
                } else {
                    $(" ." + classNames[i], dialogSelector).hide();
                }
            }
        }

        function showErrorInPanel(errorMessage) {
            $('.' + clazz.error + ' .' + clazz.errorMsg, dialogSelector).text(errorMessage);
            showPanel(clazz.error);
        }

        function getReducedOptions() {
            return { Cancel: close };
        }

        function getOptions() {
            return {
                'SUBMIT': function() {
                            var fromPortURL = $('.' + clazz.fromInterface + ' option:selected', dialogSelector).val();
                            var toPortURL = $('.' + clazz.toInterface + ' option:selected', dialogSelector).val();
                            ptClient.createLink(fromPortURL, toPortURL, close, successfulCreationCallback);
                        },
                Cancel: close
            };
        }

        function afterLoadingSuccess(ports, isFrom) {
            // TODO Right now it returns a null, but it would be much logical to return an empty array.
            if (ports==null || ports.length==0) {
                showErrorInPanel('One of the devices you are trying to link has no available interfaces.');
            } else {
                var selectPortsEl = $((isFrom)? '.' + clazz.fromInterface : '.' + clazz.toInterface, dialogSelector);
                loadPortsInSelect(ports, selectPortsEl, null);
                if (oneLoaded) { // TODO Check race conditions!
                    // Success: both loaded!
                    showPanel(clazz.loaded);
                    dialogSelector.dialog('option', 'buttons', getOptions());
                } else {
                    oneLoaded = true;
                }
            }
        }

        function afterLoadingError(device, data) {
            console.error('Something went wrong getting this devices\' available ports ' + device.id + '.')
            showErrorInPanel('Unable to get ' + device.label + ' device\'s ports.');
        }

        function loadAvailablePorts() {
            oneLoaded = false;
            ptClient.getAvailablePorts(fromDevice,
                                                function(ports) {
                                                    afterLoadingSuccess(ports, true);
                                                },
                                                function(errorData) {
                                                    afterLoadingError(fromDevice, errorData);
                                                },
                                                close);
            ptClient.getAvailablePorts(toDevice,
                                                function(ports) {
                                                    afterLoadingSuccess(ports, false);
                                                },
                                                function(errorData) {
                                                    afterLoadingError(toDevice, errorData);
                                                },
                                                close);
        }

        function openDialog(fromD, toD, callback) {
            fromDevice = fromD;
            toDevice = toD;
            successfulCreationCallback = callback;
            showPanel(clazz.loading);

            $('.' + clazz.fromName, dialogSelector).text(fromDevice.label);
            $('.' + clazz.toName, dialogSelector).text(toDevice.label);

            dialogSelector.dialog({
                title: res.linkDialog.title,
                autoOpen: false, height: 300, width: 400, modal: true, draggable: false,
                buttons: getReducedOptions()
             });
            var form = dialogSelector.find('form').on('submit', function( event ) { event.preventDefault(); });
            dialogSelector.dialog('open');
            loadAvailablePorts();
        }

        function close() {
            dialogSelector.dialog('close');
        }

        function createDialog(parentSelector, dialogId) {
            createDOM(parentSelector, dialogId);
            dialogSelector = $('#' + dialogId, parentSelector);
        }

        return {
            create: createDialog,
            open: openDialog,
        };
    })();
    // End linkDialog module

    // Module for creation dialog
    var deviceCreationDialog = (function () {

        var dialogSelector = null;
        var html = {  // Literals for classes, identifiers or names
            nameField: 'name',
            nameId: 'newDeviceName',
            typeField: 'type',
            typeId: 'newDeviceType',
        };

        function createDOM(parentSelector, dialogId) {
            var dialogForm = $('<form></form>');
            dialogForm.append('<fieldset style="margin-top: 15px;">' +
                              '  <div>' +
                              '    <label for="' + html.nameId + '">' + res.name + ': </label>' +
                              '    <input type="text" name="' + html.nameField + '" id="' + html.nameId + '" style="float: right;">' +
                              '  </div>' +
                              '  <div style="margin-top: 20px;">' +
                              '    <label for="' + html.typeId + '">' + res.creationDialog.type + ': </label>' +
                              '    <span style="float: right;">' +
                              '      <select name="' + html.typeField + '" id="' + html.typeId + '">' +
                              '        <option value="cloud" data-class="cloud">Cloud</option>' +
                              '        <option value="router" data-class="router">Router</option>' +
                              '        <option value="switch" data-class="switch">Switch</option>' +
                              '        <option value="pc" data-class="pc">PC</option>' +
                              '      </select>' +
                              '    </span>' +
                              '  </div>' +
                              '</fieldset>');
            parentSelector.append('<div id="' + dialogId + '">' + dialogForm.html() + '</div>');
        }

        function addDevice(label, type, x, y, callback) {
            var newDevice = {
                group: type,
                x: x,
                y: y
            };
            if (label!="") newDevice['label'] = label;
            return ptClient.addDevice(newDevice, callback);
        }

        function closeDialog() {
            dialogSelector.dialog('close');
        }

        function openDialog(x, y, successfulCreationCallback) {
            dialogSelector.dialog({
                title: res.creationDialog.title,
                autoOpen: false, height: 300, width: 400, modal: true, draggable: false,
                buttons: {
                    'SUBMIT': function() {
                        // We could also simply use their IDs...
                        var name = $('input[name="' + html.nameField + '"]', dialogSelector).val().trim();
                        var type = $('select[name="' + html.typeField + '"]', dialogSelector).val();
                        addDevice(name, type, x, y, successfulCreationCallback).always(closeDialog);
                    },
                    Cancel: closeDialog
                }
             });
            var form = dialogSelector.find('form').on('submit', function( event ) { event.preventDefault(); });
            $('#' + html.typeId).iconselectmenu().iconselectmenu('menuWidget').addClass('ui-menu-icons customicons');
            dialogSelector.dialog('open');
        }

        function createDialog(parentSelector, dialogId) {
            createDOM(parentSelector, dialogId);
            dialogSelector = $("#" + dialogId, parentSelector);
            // Hack needed to show iconselectmenu inside dialog
            $.widget('custom.iconselectmenu', $.ui.selectmenu, {
                _renderItem: function( ul, item ) {
                    var li = $('<li>', { text: item.label } );
                    if ( item.disabled ) {
                        li.addClass('ui-state-disabled');
                    }
                    $( '<span>', {
                        style: item.element.attr('data-style'),
                        'class': 'ui-icon ' + item.element.attr('data-class')
                     }).appendTo( li );
                     return li.appendTo( ul );
                }
            });
        }

        return {
            create: createDialog,
            open: openDialog,
        };
    })();
    // End deviceCreationDialog module

    // Module for device modification dialog
    var deviceModificationDialog = (function () {

        var dialogSelector = null;
        var selectedDevice;
        var html = {  // Literals for classes, identifiers or names
            tabs: 'modify-dialog-tabs',
            tab1: 'tabs-1',
            tab2: 'tabs-2',
            nameField: 'displayName',
            gatewayField: 'defaultGateway',
            ipField: 'ipAddress',
            subnetField: 'subnetMask',
            iFaceSelector: 'interface',
            cLoading: 'loading',
            cLoaded: 'loaded',
            cIFaceDetails: 'iFaceDetails',
            cNoIFaceDetails: 'noIFaceDetails',
        };

        function createDOM(parentSelector, dialogId) {
            var dialogForm = $('<form></form>');
            dialogForm.append('<ul>' +
                              '  <li><a href="#' + html.tab1 + '">' + res.modificationDialog.globalSettings + '</a></li>' +
                              '  <li><a href="#' + html.tab2 + '">' + res.modificationDialog.interfaces + '</a></li>' +
                              '</ul>' +
                              '<div id="' + html.tab1 + '">' +
                              '  <label>' + res.name + ': <input type="text" name="' + html.nameField + '"></label><br />' +
                              '  <label>' + res.modificationDialog.defaultGW + ': <input type="text" name="' + html.gatewayField + '"></label>' +
                              '</div>' +
                              '<div id="' + html.tab2 + '">' +
                              '  <div class="' + html.cLoading + '">' + res.loadingInfo + '</div>' +
                              '  <div class="' + html.cLoaded + '">' +
                              '    <label>' + res.name + ': ' +
                              '      <select name="' + html.iFaceSelector + '" size="1">' +
                              '        <option value="loading">' + res.loadingInfo + '</option>' +
                              '      </select>' +
                              '    <label>' +
                              '    <hr>' +
                              '    <div class="' + html.cIFaceDetails + '">' +
                              '      <label>' + res.modificationDialog.ipAddress + ': <input type="text" name="' + html.ipField + '"></label><br>' +
                              '      <label>' + res.modificationDialog.subnetMask + ': <input type="text" name="' + html.subnetField + '"></label>' +
                              '    </div>' +
                              '    <div class="' + html.cNoIFaceDetails + '">' + res.modificationDialog.noSettings + '</div>' +
                              '  </div>' +
                              '</div>');
            parentSelector.append('<div id="' + dialogId + '"><div class="' + html.tabs + '">' + dialogForm.html() + '</div></div>');
        }

        function showLoadingPanel(loading) {
            if (loading) {
                $('#' + html.tab2 + '>.' + html.cLoading).hide();
                $('#' + html.tab2 + '>.' + html.cLoaded).show();
            } else {
                $('#' + html.tab2 + '>.' + html.cLoading).show();
                $('#' + html.tab2 + '>.' + html.cLoaded).hide();
            }
        }

        function updateInterfaceInformation(port) {
            if (port.hasOwnProperty('portIpAddress') && port.hasOwnProperty('portSubnetMask')) {
                $('.' + html.cIFaceDetails, dialogSelector).show();
                $('.' + html.cNoIFaceDetails, dialogSelector).hide();
                $('input[name="' + html.ipField + '"]', dialogSelector).val(port.portIpAddress);
                $('input[name="' + html.subnetField + '"]', dialogSelector).val(port.portSubnetMask);
            } else {
                $('.' + html.cIFaceDetails, dialogSelector).hide();
                $('.' + html.cNoIFaceDetails, dialogSelector).show();
            }
        }

        function loadPortsForInterface(ports) {
            var selectSelector = $('select[name="' + html.iFaceSelector + '"]', dialogSelector);
            var selectedPort = loadPortsInSelect(ports, selectSelector, 0);
            if (selectedPort!=null) {
                updateInterfaceInformation(selectedPort);
                showLoadingPanel(true);
            }
            selectSelector.change(function () {
                $('option:selected', this).each(function(index, element) { // There is only one selection
                    var selectedIFace = $(element).text();
                    for (var i = 0; i < ports.length; i++) {  // Instead of getting its info again (we save one request)
                        if ( selectedIFace == ports[i].portName ) {
                            updateInterfaceInformation(ports[i]);
                            break;
                        }
                    }
                });
            });
        }

        function updateEditForm() {
            showLoadingPanel(false);

            $('input[name="' + html.nameField + '"]', dialogSelector).val(selectedDevice.label);
            var gwSelector = $('input[name="' + html.gatewayField + '"]', dialogSelector);
            if (selectedDevice.hasOwnProperty('defaultGateway')) {
                gwSelector.val(selectedDevice.defaultGateway);
                gwSelector.parent().show();
            } else {
                gwSelector.val('');
                gwSelector.parent().hide();
            }

            ptClient.getAllPorts(selectedDevice, loadPortsForInterface).fail(closeDialog);
        }

        function handleModificationSubmit(callback, alwaysCallback) {
            // Check the tab
            var selectedTab = $('li.ui-state-active', dialogSelector).attr('aria-controls');
            if (selectedTab==html.tab1) { // General settings
                var deviceLabel = $('input[name="' + html.nameField + '"]', dialogSelector).val();
                var defaultGateway = $('input[name="' + html.gatewayField + '"]', dialogSelector).val();
                return ptClient.modifyDevice(selectedDevice, deviceLabel, defaultGateway, callback).always(alwaysCallback);
            } else if (selectedTab==html.tab2) { // Interfaces
                var portURL = $('select[name="' + html.iFaceSelector + '"]', dialogSelector).val();
                var portIpAddress = $('input[name="' + html.ipField + '"]', dialogSelector).val();
                var portSubnetMask = $('input[name="' + html.subnetField + '"]', dialogSelector).val();
                // Room for improvement: the following request could be avoided when nothing has changed
                // In case just the port details are modified...
                return ptClient.modifyPort(portURL, portIpAddress, portSubnetMask).always(alwaysCallback);
            } else {
                console.error('ERROR. Unknown selected tab.');
            }
        }

        function closeDialog() {
            dialogSelector.dialog('close');
        }

        function openDialog(deviceToModify, successfulNodeModificationCallback) {
            selectedDevice = deviceToModify;
            updateEditForm();

            $("." + html.tabs, dialogSelector).tabs();
            var dialog = dialogSelector.dialog({
                title: res.modificationDialog.title,
                height: 350, width: 450,
                autoOpen: false, modal: true, draggable: false,
                buttons: {
                    'SUBMIT': function() {
                        handleModificationSubmit(successfulNodeModificationCallback, closeDialog);
                    },
                    Cancel: function() {
                        $(this).dialog('close');
                    }
                }, close: function() { /*console.log("Closing dialog...");*/ }
             });
            dialog.parent().attr('id', 'modify-dialog');
            var form = dialog.find('form').on('submit', function( event ) { event.preventDefault(); });
            dialog.dialog('open');
        }

        function createDialog(parentSelector, dialogId) {
            createDOM(parentSelector, dialogId);
            dialogSelector = $('#' + dialogId, parentSelector);
        }

        return {
            create: createDialog,
            open: openDialog,
        };
    })();
    // End deviceModificationDialog module

    function showMessage(msg) {
        widgetSelector.html('<div class="message">' + '<h1>' + msg.title + '</h1>' + msg.content + '</div>');
    }

    function loadComponents(sessionURL, settings) {
        ptClient = new packetTracer.Client(sessionURL, function() { showMessage(res.network.notLoaded); } );

        networkMap.load('network');  // Always loaded

        var hiddenComponentContents = $('<div></div>');
        hiddenComponentContents.hide();
        widgetSelector.append(hiddenComponentContents);

        if (settings.commandLine) {
            commandLine.init(hiddenComponentContents);
        }
        linkDialog.create(hiddenComponentContents, 'link-devices');
        deviceCreationDialog.create(hiddenComponentContents, 'create-device');
        deviceModificationDialog.create(hiddenComponentContents, 'modify-device');
    }

    // Widget configurator/initializer
    function init(selector, apiURL, customSettings) {
        widgetSelector = $(selector);

        var settings = { // Default values
            createSession: false,
            commandLine: true,
        };
        for (var attrName in customSettings) { settings[attrName] = customSettings[attrName]; }  // merge/override

        if (settings.createSession) {
            showMessage(res.session.creating);
            packetTracer.newSession(apiURL, function(newSessionURL) {
                $.get(newSessionURL, function(sessionId) {
                    window.location.href =  '?session=' + sessionId;
                });
            }).fail(function(data) {
                showMessage(res.session.unavailable);
            });
        } else {
            loadComponents(apiURL, settings);
        }
    }

    // exposed functions and classes
    return {
        createWidget: init,
        DraggableDevice: DraggableDevice,
    };
})();



// From: http://www.jquerybyexample.net/2012/06/get-url-parameters-using-jquery.html
function getURLParameter(sParam) {
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) {
            return sParameterName[1];
        }
    }
}