// Define module if needed.
if (typeof(ptAnywhereWidgets) === 'undefined') {
    var ptAnywhereWidgets = {};
}

/**
 * Widget creator module and its submodules
 */
// The Revealing Module Pattern
// http://addyosmani.com/resources/essentialjsdesignpatterns/book/#revealingmodulepatternjavascript
ptAnywhereWidgets.all = (function () {

    var widgetSelector;
    var ptClient;  // JS client of the HTTP API
    var staticsPath;


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

    function createModal(modalId, modalTitle, modalBody, hasSubmitButton) {
        var modal = '<div class="modal fade" id="' + modalId + '" tabindex="-1" role="dialog" aria-labelledby="' + modalId + 'Label">' +
                    '  <div class="modal-dialog" role="document">' +
                    '    <div class="modal-content">' +
                    '      <div class="modal-header">' +
                    '        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
                    '        <h4 class="modal-title" id="' + modalId + 'Label">' + modalTitle + '</h4>' +
                    '      </div>' +
                    '      <div class="modal-body">' +
                    modalBody.html() +
                    '      </div>' +
                    '      <div class="modal-footer">' +
                    '        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
        if (hasSubmitButton) {
            modal += '        <button type="button" class="btn btn-primary">Submit</button>';
        }
        modal +=    '      </div>' +
                    '    </div>' +
                    '  </div>' +
                    '</div>';
        return modal;
    }


    function showPrimaryButton(dialogSelector) {
        $('.btn-primary', dialogSelector).show();
    }

    function hidePrimaryButton(dialogSelector) {
        $('.btn-primary', dialogSelector).hide();
    }

    // End: utility functions

    // Module which handles command line
    var commandLine = (function () {

        var dialogSelector;

        function createDOM(parentSelector) {
            dialogSelector = $('<div class="modal fade" tabindex="-1" role="dialog" aria-labelledby="cmdModal"></div>');
            var modal = '<div class="modal-dialog" role="document">' +
                        '  <div class="modal-content">' +
                        '    <div class="modal-header">' +
                        '      <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
                        '      <h4 class="modal-title" id="cmdModal">' + res.commandLineDialog.title + '</h4>' +
                        '    </div>' +
                        '    <div class="modal-body">' +
                        '    </div>' +
                        '  </div>' +
                        '</div>';
            dialogSelector.append(modal);
            parentSelector.append(dialogSelector);
        }

        function openIFrame(node) {
            $('.modal-body', dialogSelector).html(
                '<div class="iframeWrapper">' +
                '   <iframe class="terminal" src="console?endpoint=' + node.consoleEndpoint + '"></iframe>' +
                '</div>');
            dialogSelector.modal('show');
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
                }).
                done(function(data) {  // Success
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
        var nodes = new vis.DataSet();
        var edges = new vis.DataSet();
        var network;
        var containerSelector = null;

        var html = {  // Literals for classes, identifiers, names or paths
            cLoadingIcon: 'loading-icon',
            idLoadingMessage: 'loadingMessage',
        };

        // Created the DOM that shorty afterwards will be replaced by the network map
        function createTemporaryDOM() {
            var ret = $('<div class="network"></div>');
            ret.append('<div class="loading"><img class="' + html.cLoadingIcon +
                        '" src="' + staticsPath + 'loading.gif" alt="Loading network topology..." />' +
                        '<div style="text-align: center;">' +
                        '<p>' + res.network.loading + '<p>' +
                        '<p id="' + html.idLoadingMessage + '"></p>' +
                        '</div></div>');
            ret.append('<div class="map"></div>');
            return ret;
        }

        function showLoading() {
            $('.loading', containerSelector).show();
            $('.map', containerSelector).hide();
        }

        function showTopology() {
            $('.loading', containerSelector).hide();
            $('.map', containerSelector).show();
        }

        function getSelectedNode() {
            var selected = network.getSelection();
            if (selected.nodes.length!=1) { // Only if just one is selected
                console.log('Only one device is supposed to be selected. Instead ' + selected.nodes.length + ' are selected.');
                return null;
            }
            return nodes.get(selected.nodes[0]);
        }

        function drawTopology(isInteractive) {
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
                            image : staticsPath + 'cloud.png',
                            size: 50,
                        },
                        routerDevice : {
                            shape : 'image',
                            image : staticsPath + 'router_cropped.png',
                            size: 45,
                        },
                        switchDevice : {
                            shape : 'image',
                            image : staticsPath + 'switch_cropped.png',
                            size: 35,
                        },
                        pcDevice : {
                            shape : 'image',
                            image : staticsPath + 'pc_cropped.png',
                            size: 45,
                        }
                    },
                    manipulation: {
                        initiallyActive: true,
                        addNode: function(data, callback) {
                                    if (isInteractive) {
                                        deviceCreationDialog.open(data.x, data.y, addNode);
                                    }
                                 },
                        addEdge: function(data, callback) {
                                    if (isInteractive) {
                                        var fromDevice = nodes.get(data.from);
                                        var toDevice = nodes.get(data.to);
                                        var sCallback = function(newLink) {
                                                            edges.add([{
                                                                id: newLink.id,
                                                                url: newLink.url,
                                                                from: fromDevice.id,
                                                                to: toDevice.id,
                                                            }]);
                                                        };
                                        linkDialog.open(fromDevice, toDevice, sCallback);
                                    }
                                 },
                        editNode: function(data, callback) {
                                      if (isInteractive) {
                                          var successUpdatingNode = function(modifiedDevice) { nodes.update(modifiedDevice); };
                                          deviceModificationDialog.open(nodes.get(data.id), successUpdatingNode);
                                          callback(data);
                                      }
                                  },
                        editEdge: false,
                        deleteNode: function(data, callback) {
                                        if (isInteractive) {
                                            // Always (data.nodes.length>0) && (data.edges.length==0)
                                            // FIXME There might be more than a node selected...
                                            ptClient.removeDevice(nodes.get(data.nodes[0]));
                                            // This callback is important, otherwise it received 3 consecutive onDelete events.
                                            callback(data);
                                          }
                                    },
                        deleteEdge: function(data, callback) {
                                        if (isInteractive) {
                                            // Always (data.nodes.length==0) && (data.edges.length>0)
                                            // FIXME There might be more than an edge selected...
                                            var edgeId = data.edges[0]; // Var created just to enhance readability
                                            ptClient.removeLink( edges.get(edgeId).url );
                                            // This callback is important, otherwise it received 3 consecutive onDelete events.
                                            callback(data);
                                        }
                                    },
                    },
                    locale: 'ptAnywhere',
                    locales: {
                        ptAnywhere: res.manipulationMenu
                    },
                };
                network = new vis.Network($('.map', containerSelector).get(0), visData, options);
                if (isInteractive) {
                    network.on('doubleClick', function() {
                        var selected = getSelectedNode();
                        if (selected!=null)
                            commandLine.open(selected);
                    });
                }
            }
        }

        function createMap(isInteractive) {
            containerSelector = createTemporaryDOM();
            showLoading();
            drawTopology(isInteractive);
            return containerSelector;
        }

        function update(responseData) {
            showTopology();
            // Load data
            if (responseData.devices!=null) {
                nodes.clear();
                nodes.add(responseData.devices);
            }
            if (responseData.edges!=null) {
                edges.clear();
                edges.add(responseData.edges);
            }
            network.fit();
        }

        function addNode(newNode) {
            nodes.add(newNode);
        }

        function getByName(name) {
            var ret = nodes.get({
                filter: function (item) {
                    return (item.label == name);
                }
            });
            if (ret.length==0) return null;
            // CAUTION: If there are more than a device with the same name, we return one randomly.
            return ret[0];
        }

        /**
         * @arg name Name of the node to be deleted.
         */
        function removeNode(name) {
            nodes.remove(getByName(name));
        }

        /**
         * @arg fromDeviceName Name of the origin endpoint.
         * @arg toDeviceName Name of the destination endpoint.
         */
        function connect(fromDeviceName, toDeviceName) {
            var newEdge = { from: getByName(fromDeviceName).id, to: getByName(toDeviceName).id };
            edges.add(newEdge);
        }

        function getEdgeByNames(names) {
            var ids = [getByName(names[0]).id, getByName(names[1]).id];
            var ret = edges.get({
                filter: function (item) {

                    return ( (item.from == ids[0]) && (item.to == ids[1]) ) ||
                           ( (item.from == ids[1]) && (item.to == ids[0]) );
                }
            });
            if (ret.length==0) return null;
            // CAUTION: If there are more than one link between devices, we return one randomly.
            return ret[0];
        }

        /**
         * @arg deviceNames Array with the names of the nodes to be disconnected.
         */
        function disconnect(deviceNames) {
            edges.remove(getEdgeByNames(deviceNames).id);
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
         * Shows an error where the network topology should have been loaded.
         */
        function showError(errorMsg) {
            $('#' + html.idLoadingMessage, containerSelector).text(errorMsg);
        }

        // Reveal public pointers to
        // private functions and properties
       return {
            create: createMap,
            update: update,
            addNode: addNode,
            removeNode: removeNode,
            connect: connect,
            disconnect: disconnect,
            getCoordinate: toNetworkMapCoordinate,
            error: showError,
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
        };


        function createDOM(parentSelector, dialogId) {
            var dialogForm = $('<form name="link-devices"></form>');
            dialogForm.append('<div class="' + clazz.loading + '">' + res.loadingInfo + '</div>');
            dialogForm.append('<div class="' + clazz.loaded + '">' +
                              '  <p>' + res.linkDialog.select + '</p>' +
                              '  <div class="clearfix form-group">' +
                              '    <label for="' + clazz.fromInterface + '" class="col-md-3 ' + clazz.fromName + '">Device 1</label>' +
                              '    <div class="col-md-9">' +
                              '      <select class="form-control ' + clazz.fromInterface + '" size="1">' +
                              '        <option value="loading">' + res.loading + '</option>' +
                              '       </select>' +
                              '    </div>' +
                              '  </div>' +
                              '  <div class="clearfix form-group">' +
                              '    <label for="' + clazz.toInterface + '" class="col-md-3 ' + clazz.toName + '">Device 2</label>' +
                              '    <div class="col-md-9">' +
                              '      <select class="form-control ' + clazz.toInterface + '" size="1">' +
                              '        <option value="loading">' + res.loading + '</option>' +
                              '      </select>' +
                              '    </div>' +
                              '  </div>' +
                              '</div>');
            dialogForm.append('<div class="' + clazz.error + '">' +
                              '  <p>' + res.linkDialog.error + '</p>' +
                              '  <p class="' + clazz.errorMsg + '"></p>' +
                              '</div>');
            var e = createModal(dialogId, res.linkDialog.title, dialogForm, true);
            parentSelector.append(e);
        }

        function showPanel(classToShow) {
            var classNames = [clazz.loading, clazz.loaded, clazz.error];
            for (i in classNames) {
                if (classNames[i]==classToShow) {
                    $('.' + classNames[i], dialogSelector).show();
                } else {
                    $('.' + classNames[i], dialogSelector).hide();
                }
            }
        }

        function showErrorInPanel(errorMessage) {
            $('.' + clazz.error + ' .' + clazz.errorMsg, dialogSelector).text(errorMessage);
            showPanel(clazz.error);
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
                    showPrimaryButton(dialogSelector);
                } else {
                    oneLoaded = true;
                }
            }
        }

        function afterLoadingError(device, errorData) {
            if (errorData.status==410) {
                dialogSelector.modal('hide'); // session expired, error will be shown replacing the map.
            } else {
                showErrorInPanel('Unable to get ' + device.label + ' device\'s ports.');
            }
        }

        function loadAvailablePorts() {
            oneLoaded = false;
            ptClient.getAvailablePorts(fromDevice).
                      done(function(ports) {
                          afterLoadingSuccess(ports, true);
                      }).
                      fail(function(errorData) {
                          afterLoadingError(fromDevice, errorData);
                      });
            ptClient.getAvailablePorts(toDevice).
                      done(function(ports) {
                          afterLoadingSuccess(ports, false);
                      }).
                      fail(function(errorData) {
                          afterLoadingError(toDevice, errorData);
                      });
        }

        function openDialog(fromD, toD, callback) {
            fromDevice = fromD;
            toDevice = toD;
            successfulCreationCallback = callback;
            showPanel(clazz.loading);

            $('.' + clazz.fromName, dialogSelector).text(fromDevice.label);
            $('.' + clazz.toName, dialogSelector).text(toDevice.label);

            hidePrimaryButton(dialogSelector);
            dialogSelector.modal('show');
            $('.btn-primary', dialogSelector).click(function() {
                var fromPortURL = $('.' + clazz.fromInterface + ' option:selected', dialogSelector).val();
                var toPortURL = $('.' + clazz.toInterface + ' option:selected', dialogSelector).val();
                ptClient.createLink(fromPortURL, toPortURL).
                           done(successfulCreationCallback).
                           always(function() {
                               dialogSelector.modal('hide');
                           });
            });
            loadAvailablePorts();
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
            dialogForm.append('<fieldset>' +
                              '  <div class="clearfix form-group">' +
                              '    <label for="' + html.nameId + '" class="col-md-3">' + res.name + ': </label>' +
                              '    <div class="col-md-9">' +
                              '      <input type="text" name="' + html.nameField + '" id="' + html.nameId + '" class="form-control">' +
                              '    </div>' +
                              '  </div>' +
                              '  <div class="clearfix form-group">' +
                              '    <label for="' + html.typeId + '" class="col-md-3">' + res.creationDialog.type + ': </label>' +
                              '    <div class="col-md-9">' +
                              '      <select name="' + html.typeField + '" id="' + html.typeId + '" class="form-control">' +
                              '        <option value="cloud" data-class="cloud">Cloud</option>' +
                              '        <option value="router" data-class="router">Router</option>' +
                              '        <option value="switch" data-class="switch">Switch</option>' +
                              '        <option value="pc" data-class="pc">PC</option>' +
                              '      </select>' +
                              '    </div>' +
                              '  </div>' +
                              '</fieldset>');
            var e = createModal(dialogId, res.creationDialog.title, dialogForm, true);
            parentSelector.append(e);
        }

        function addDevice(label, type, x, y, callback) {
            var newDevice = {
                group: type,
                x: x,
                y: y
            };
            if (label!="") newDevice['label'] = label;
            return ptClient.addDevice(newDevice).done(callback);
        }

        function closeDialog() {
            dialogSelector.modal('hide');
        }

        function openDialog(x, y, successfulCreationCallback) {
            $('.btn-primary', dialogSelector).click(function() {
                // We could also simply use their IDs...
                var name = $('input[name="' + html.nameField + '"]', dialogSelector).val().trim();
                var type = $('select[name="' + html.typeField + '"]', dialogSelector).val();
                addDevice(name, type, x, y, successfulCreationCallback).always(closeDialog);
            });
            $('form', dialogSelector).on('submit', function( event ) { event.preventDefault(); });
            dialogSelector.modal('show');
        }

        function createDialog(parentSelector, dialogId) {
            createDOM(parentSelector, dialogId);
            dialogSelector = $("#" + dialogId, parentSelector);
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
            dialogForm.append('<ul class="nav nav-tabs" role="tablist">' +
                              '  <li role="presentation" class="active">' +
                              '     <a href="#' + html.tab1 + '" aria-controls="' + html.tab1 + '" role="tab" data-toggle="tab">' +
                              '       ' + res.modificationDialog.globalSettings +
                              '     </a>' +
                              '  </li>' +
                              '  <li role="presentation">' +
                              '    <a href="#' + html.tab2 + '" aria-controls="' + html.tab2 + '" role="tab" data-toggle="tab">' +
                              '      ' + res.modificationDialog.interfaces +
                              '    </a>' +
                              '  </li>' +
                              '</ul>' +
                              '<div class="tab-content">' +
                              '  <div id="' + html.tab1 + '" role="tabpanel" class="tab-pane active">' +
                              '    <div class="clearfix form-group">' +
                              '      <label for="' + dialogId + '-name" class="col-md-3">' + res.name + ': </label>' +
                              '      <div class="col-md-9">' +
                              '        <input type="text" name="' + html.nameField + '" id="' + dialogId + '-name" class="form-control">' +
                              '      </div>' +
                              '    </div>' +
                              '    <div class="clearfix form-group">' +
                              '      <label for="' + dialogId + '-default-gw" class="col-md-3">' + res.modificationDialog.defaultGW + ': </label>' +
                              '      <div class="col-md-9">' +
                              '        <input type="text" name="' + html.gatewayField + '" id="' + dialogId + '-default-gw" class="form-control">' +
                              '      </div>' +
                              '    </div>' +
                              '  </div>' +
                              '  <div id="' + html.tab2 + '" role="tabpanel" class="tab-pane">' +
                              '    <div class="' + html.cLoading + '">' + res.loadingInfo + '</div>' +
                              '    <div class="' + html.cLoaded + '">' +
                              '      <div class="clearfix form-group">' +
                              '        <label for="' + dialogId + '-ifaces" class="col-md-3">' + res.name + ': </label>' +
                              '        <div class="col-md-9">' +
                              '          <select name="' + html.iFaceSelector + '" id="' + dialogId + '-ifaces"  size="1" class="form-control">' +
                              '            <option value="loading">' + res.loadingInfo + '</option>' +
                              '          </select>' +
                              '        </div>' +
                              '      </div>' +
                              '      <hr>' +
                              '      <div class="clearfix form-group ' + html.cIFaceDetails + '">' +
                              '        <div class="clearfix form-group">' +
                              '          <label for="' + dialogId + '-idaddr" class="col-md-3">' + res.modificationDialog.ipAddress + ': </label>' +
                              '          <div class="col-md-9">' +
                              '            <input type="text" name="' + html.ipField + '" id="' + dialogId + '-idaddr" class="form-control">' +
                              '          </div>' +
                              '        </div>' +
                              '        <div class="clearfix form-group">' +
                              '          <label for="' + dialogId + '-subnet" class="col-md-3">' + res.modificationDialog.subnetMask + ': </label>'+
                              '          <div class="col-md-9">' +
                              '            <input type="text" name="' + html.subnetField + '" id="' + dialogId + '-subnet" class="form-control">' +
                              '          </div>' +
                              '        </div>' +
                              '      </div>' +
                              '    </div>' +
                              '    <div class="' + html.cNoIFaceDetails + '">' + res.modificationDialog.noSettings + '</div>' +
                              '  </div>' +
                              '</div>');
            var e = createModal(dialogId, res.modificationDialog.title, dialogForm, true);
            parentSelector.append(e);
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
                gwSelector.parent().parent().show();
            } else {
                gwSelector.val('');
                gwSelector.parent().parent().hide();
            }

            ptClient.getAllPorts(selectedDevice).
                      done(loadPortsForInterface).
                      fail(function() {
                        dialogSelector.modal('hide');
                      });
        }

        function handleModificationSubmit(successCallback, alwaysCallback) {
            // Check the tab
            var selectedTab = $('li.active a', dialogSelector).attr('aria-controls');
            if (selectedTab==html.tab1) { // General settings
                var deviceLabel = $('input[name="' + html.nameField + '"]', dialogSelector).val();
                var defaultGateway = $('input[name="' + html.gatewayField + '"]', dialogSelector).val();
                return ptClient.modifyDevice(selectedDevice, deviceLabel, defaultGateway).
                                done(successCallback).
                                always(alwaysCallback);
            } else if (selectedTab==html.tab2) { // Interfaces
                var portURL = $('select[name="' + html.iFaceSelector + '"]', dialogSelector).val();
                var portIpAddress = $('input[name="' + html.ipField + '"]', dialogSelector).val();
                var portSubnetMask = $('input[name="' + html.subnetField + '"]', dialogSelector).val();
                // Room for improvement: the following request could be avoided when nothing has changed
                // In case just the port details are modified...
                return ptClient.modifyPort(portURL, portIpAddress, portSubnetMask).always(alwaysCallback);
            } else {
                console.error('ERROR. Unknown selected tab: ' + selectedTab + '.');
            }
        }

        function openDialog(deviceToModify, successfulNodeModificationCallback) {
            selectedDevice = deviceToModify;
            updateEditForm();
            $('.btn-primary', dialogSelector).click(function() {
                handleModificationSubmit(successfulNodeModificationCallback, function() {
                    dialogSelector.modal('hide');
                });
            });
            $('form', dialogSelector).on('submit', function( event ) { event.preventDefault(); });
            dialogSelector.modal('show');
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

    // Module for device drag-and-drop creation menu
    var dragAndDropDeviceMenu = (function () {
        var menuSelector;
        var draggableElements = [
            { element: 'cloud', icon: 'cloud.png', caption: 'Cloud'},
            { element: 'router', icon: 'router.png', caption: 'Router'},
            { element: 'switch', icon: 'switch.png', caption: 'Switch'},
            { element: 'pc', icon: 'pc.png', caption: 'Pc'},
        ];

        function getFigureDOM(draggableElement) {
            return '<figure class="col-md-3 col-sm-3 col-xs-3 text-center"><img class="' + draggableElement.element + '" alt="' +
                   draggableElement.element + '" ' + 'src="' + staticsPath +
                   draggableElement.icon + '"><figcaption>' +
                   draggableElement.caption + '</figcaption></figure>';
        }

        function createDOM() {
            var fieldset = $('<fieldset></fieldset>');
            fieldset.tooltip({title: res.creationMenu.legend});
            var rowHolder = $('<div class="col-md-8 col-md-offset-2 col-sm-10 col-sm-offset-1 col-xs-12"></div>');
            var figuresHolder = $('<div class="row"></div>');
            for (var i in draggableElements) {
                figuresHolder.append(getFigureDOM(draggableElements[i]));
            }
            rowHolder.append(figuresHolder);
            fieldset.append(rowHolder);
            var menu = $('<div class="creation-menu"></div>');
            menu.append(fieldset);
            return menu;
        }

        function createMenu(parentSelector, dragToCanvas) {
            menuSelector = createDOM();
            for (var i in draggableElements) {
                var el = draggableElements[i];
                new DraggableDevice($('.' + el.element, menuSelector), dragToCanvas, el.element);
            }
            return menuSelector;
        }

        return {
            create: createMenu
        };
    })();
    // End deviceModificationDialog module

    function loadComponents(settings, isInteractive) {
        var netSelector = networkMap.create(isInteractive);  // Always loaded
        widgetSelector.append(netSelector);
        var creationMenu = dragAndDropDeviceMenu.create(widgetSelector, netSelector);
        widgetSelector.append(creationMenu);

        // The wrapper must be visible and it should not be deleted/overriden (e.g., ERROR 410 overrides widgetSelector).
        var visibleComponentContents = $('<div></div>');
        $('body').append(visibleComponentContents);

        deviceCreationDialog.create(visibleComponentContents, 'create-device');
        deviceModificationDialog.create(visibleComponentContents, 'modify-device');
        linkDialog.create(visibleComponentContents, 'link-devices');
        if (settings.commandLine) {
            commandLine.init(visibleComponentContents);
        }
    }

    function addSlashIfNeeded(url) {
      if (url.indexOf('/', this.length - 1) === -1 ) {
        return url + '/';
      }
      return url;
    }

    function init(selector, pathToStatics, customSettings) {
        widgetSelector = $(selector);
        staticsPath = addSlashIfNeeded(pathToStatics);
        var settings = { // Default values
            createSession: false,
            fileToOpen: null,
            commandLine: true,
        };
        for (var attrName in customSettings) { settings[attrName] = customSettings[attrName]; }  // merge/override
        return settings;
    }

    function showMessage(msg) {
        widgetSelector.html('<div class="row message">' +
                            '  <div class="col-md-8 col-md-offset-2 text-center">' +
                            '    <h1>' + msg.title + '</h1>' + msg.content +
                            '  </div>' +
                            '</div>');
    }

    // Widget configurator/initializer
    function initInteractive(selector, apiURL, pathToStatics, customSettings) {
        var settings = init(selector, pathToStatics, customSettings);
        if (settings.createSession && settings.fileToOpen!=null) {
            showMessage(res.session.creating);
            ptAnywhere.http.newSession(apiURL, settings.fileToOpen, function(newSessionURL) {
                $.get(newSessionURL, function(sessionId) {
                    window.location.href =  '?session=' + sessionId;
                });
            }).fail(function(data) {
                showMessage(res.session.unavailable);
            });
        } else {
            loadComponents(settings, true);
            ptClient = new ptAnywhere.http.Client(apiURL, function() {
                showMessage(res.network.notLoaded);
            });
            ptClient.getNetwork(
                function(tryCount, maxRetries, errorType) {
                    var errorMessage;
                    switch (errorType) {
                        case ptAnywhere.http.UNAVAILABLE:
                                    errorMessage = res.network.errorUnavailable;
                                    break;
                        case ptAnywhere.http.TIMEOUT:
                                    errorMessage = res.network.errorTimeout;
                                    break;
                        default: errorMessage = res.network.errorUnknown;
                    }
                    networkMap.error(errorMessage + '. ' + res.network.attempt + ' ' + tryCount + '/' + maxRetries + '.');
                }).
                done(function(data) {
                    networkMap.update(data);
                });
        }
    }

    // Widget configurator/initializer
    function initNonInteractive(selector, pathToStatics, networkData, customSettings) {
        var settings = init(selector, pathToStatics, customSettings);
        loadComponents(settings, false);
        networkMap.update(networkData);
        return {  // Controls to programatically modify the module
            addDevice: networkMap.addNode,
            removeDevice: networkMap.removeNode,
            connect: networkMap.connect,
            disconnect: networkMap.disconnect,
            reset: function() { networkMap.update(networkData); },
        };
    }

    // exposed functions and classes
    return {
        create: initInteractive,
        createNonInteractiveWidget: initNonInteractive,
        DraggableDevice: DraggableDevice,
    };
})();
