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

    /**
     * Module which configures the interactive part of the widgets.
     */
    var interaction = (function () {
        var ptClient;

        function init(map, creationMenu, dlgs, client) {
            ptClient = client;

            // First add interactivity to dialogs
            deviceCreation.init(dlgs[dialogs.CREATION_DIALOG]);
            deviceModification.init(dlgs[dialogs.MODIFICATION_DIALOG]);
            linkCreation.init(dlgs[dialogs.LINK_DIALOG]);
            if ( dlgs.hasOwnProperty(dialogs.CMD_DIALOG) ) {
                commandLine.init(dlgs[dialogs.CMD_DIALOG]);
            }

            // Then to the map and creation menu
            initMap(map);
            var creatableElements = creationMenu.getElements();
            for (var i in creatableElements) {
                var el = creatableElements[i];
                new DraggableDevice($('.' + el, creationMenu.getSelector()), map.getSelector(), el);
            }
        }

        function initMap(map) {
            map.onDoubleClickDevice(function(selectedNode) {
                commandLine.start(selectedNode);
            });

            map.onAddDevice(function(positionX, positionY) {
                deviceCreation.start(positionX, positionY, map.addNode);
            });

            map.onAddLink(function(fromDevice, toDevice) {
                linkCreation.start(fromDevice, toDevice, function(newLink) {  // If success...
                    map.connect(fromDevice, toDevice, newLink.id, newLink.url);
                });
            });

            map.onEditDevice(function(device) {
                deviceModification.start(device, function(modifiedDevice) {
                    map.updateNode(modifiedDevice);
                });
            });

            map.onDeleteDevice(function(device) {
                ptClient.removeDevice(device);
            });

            map.onDeleteLink(function(device) {
                ptClient.removeLink( device );
            });
        }


        // Module which handles command line
        var commandLine = (function () {
            var cmdDialog;

            function init(cmdDialogObject) {
                cmdDialog = cmdDialogObject;
            }

            function openIFrame(node) {
                cmdDialog.setBody(
                    '<div class="iframeWrapper">' +
                    '   <iframe class="terminal" src="console?endpoint=' + node.consoleEndpoint + '"></iframe>' +
                    '</div>'
                );
                cmdDialog.open();
            }

            return {
                init: init,
                start: openIFrame,
            };
        })();  // End commandLine module


        // Module for device creation
        var deviceCreation = (function () {
            var creationDialog;

            function init(creationDialogObject) {
                creationDialog = creationDialogObject;
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

            function openDialog(x, y, successfulCreationCallback) {
                creationDialog.getPrimaryButton().unbind();  // To avoid accumulation of click listeners from other calls
                creationDialog.getPrimaryButton().click(function() {
                    // We could also simply use their IDs...
                    var name = creationDialog.getDeviceName();
                    var type = creationDialog.getDeviceType();
                    addDevice(name, type, x, y, successfulCreationCallback).
                        always(function() {
                            creationDialog.close();
                        });
                });
                creationDialog.open();
            }

            return {
                init: init,
                start: openDialog,
            };
        })();  // End deviceCreation module


        // Link creation
        var linkCreation = (function () {
            var linkDialog = null;
            var successfulCreationCallback;
            var oneLoaded = false;

            function init(linkDialogObject) {
                linkDialog = linkDialogObject;
            }

            function afterLoadingSuccess(ports, isFrom) {
                // TODO Right now it returns a null, but it would be much logical to return an empty array.
                if (ports==null || ports.length==0) {
                    linkDialog.showError('One of the devices you are trying to link has no available interfaces.');
                } else {
                    if (isFrom) {
                        linkDialog.setFromPorts(ports);
                    } else {
                        linkDialog.setToPorts(ports);
                    }
                    if (oneLoaded) { // TODO Check race conditions!
                        // Success: both loaded!
                        linkDialog.showLoaded();
                    } else {
                        oneLoaded = true;
                    }
                }
            }

            function afterLoadingError(device, errorData) {
                if (errorData.status==410) {
                    linkDialog.close(); // session expired, error will be shown replacing the map.
                } else {
                    linkDialog.showError('Unable to get ' + device.label + ' device\'s ports.');
                }
            }

            function loadAvailablePorts(fromDevice, toDevice) {
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

            function openDialog(fromDevice, toDevice, callback) {
                successfulCreationCallback = callback;
                linkDialog.showLoading();

                linkDialog.setFromDevice(fromDevice.label);
                linkDialog.setToDevice(toDevice.label);

                linkDialog.getPrimaryButton().hide();
                linkDialog.open();
                linkDialog.getPrimaryButton().unbind();  // To avoid accumulation of click listeners from other calls
                linkDialog.getPrimaryButton().click(function() {
                    ptClient.createLink(linkDialog.getFromPortURL(),
                                        linkDialog.getToPortURL()).
                               done(successfulCreationCallback).
                               always(function() {
                                   linkDialog.close();
                               });
                });
                loadAvailablePorts(fromDevice, toDevice);
            }

            return {
                init: init,
                start: openDialog,
            };
        })();  // End linkCreation module

        // Module for device modification
        var deviceModification = (function () {
            var modificationDialog = null;
            var selectedDevice;

            function init(modificationDialogObject) {
                modificationDialog = modificationDialogObject;
            }

            function updateInterfaceInformation(port) {
                if (port.hasOwnProperty('portIpAddress') && port.hasOwnProperty('portSubnetMask')) {
                    modificationDialog.setPortIpAddress(port.portIpAddress);
                    modificationDialog.setPortSubnetMask(port.portSubnetMask);
                    modificationDialog.showIFaceDetails();
                } else {
                    modificationDialog.hideIFaceDetails();
                }
            }

            function loadPortsForInterface(ports) {
                var selectedPort = modificationDialog.setPorts(ports);
                if (selectedPort!=null) {
                    updateInterfaceInformation(selectedPort);
                    modificationDialog.showLoaded();
                }
                modificationDialog.getPortSelect().unbind();  // To avoid accumulation of change listeners from other calls
                modificationDialog.getPortSelect().change(function () {
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
                modificationDialog.showLoading();

                modificationDialog.setDeviceName(selectedDevice.label);
                if (selectedDevice.hasOwnProperty('defaultGateway')) {
                    modificationDialog.setDefaultGateway(selectedDevice.defaultGateway);
                } else {
                    modificationDialog.setDefaultGateway(null);
                }

                ptClient.getAllPorts(selectedDevice).
                          done(loadPortsForInterface).
                          fail(function() {
                            modificationDialog.close();
                          });
            }

            function handleModificationSubmit(successCallback, alwaysCallback) {
                var selectedTab = modificationDialog.getSelectedTab();
                if (selectedTab==1) { // General settings
                    var deviceLabel = modificationDialog.getDeviceName();
                    var defaultGateway = modificationDialog.getDefaultGateway();
                    return ptClient.modifyDevice(selectedDevice, deviceLabel, defaultGateway).
                                    done(successCallback).
                                    always(alwaysCallback);
                } else if (selectedTab==2) { // Interfaces
                    var portURL = modificationDialog.getSelectedPortUrl();
                    var portIpAddress = modificationDialog.getPortIpAddress();
                    var portSubnetMask = modificationDialog.getPortSubnetMask();
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
                modificationDialog.getPrimaryButton().unbind();  // To avoid accumulation of click listeners from other calls
                modificationDialog.getPrimaryButton().click(function() {
                    handleModificationSubmit(successfulNodeModificationCallback, function() {
                        modificationDialog.close();
                    });
                });
                modificationDialog.open();
            }

            return {
                init: init,
                start: openDialog,
            };
        })();  // End deviceModification module


        // Class for draggable device creation
        function DraggableDevice(draggedSelector, canvasEl, deviceType) {
            this.el = draggedSelector;
            this.originalPosition = {
                'left': this.el.css('left'),
                'top': this.el.css('top')
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
            var position = main.map.getCoordinate(x, y);
            var thisObj = this;
            // We don't use the return
            return ptClient.addDevice({
                        'group': this.deviceType,
                        'x': position.x,
                        'y': position.y
                    }).
                    done(function(data) {  // Success
                        thisObj.stopCreatingIcon();
                        main.map.addNode(data);
                    }).
                    fail(function(data) {
                        thisObj.stopCreatingIcon();
                    });
        };
        // End DraggableDevice class


        // exposed functions and classes
        return {
            init: init,
            commandLine: commandLine,
            deviceCreation: deviceCreation,
            linkCreation: linkCreation,
            deviceModification: deviceModification,
        };
    })();

    /**
     * HTML structure for the main widget.
     */
    var main = (function () {
        var widgetSelector = null;

        var creationMenu = (function () {
            var menuSelector = null;
            var staticsPath = null;

            var draggableElements = ['cloud', 'router', 'switch', 'pc'];
            var images = [
                {icon: 'cloud.png', caption: 'Cloud'},
                {icon: 'router.png', caption: 'Router'},
                {icon: 'switch.png', caption: 'Switch'},
                {icon: 'pc.png', caption: 'Pc'},
            ];

            /* Public component creator */
            function createComponent(pathToStatics, settings) {
                staticsPath = pathToStatics;
                return createDOM();
            }

            /* Class for drag and drop device menu */
            function createDOM() {
                var fieldset = $('<fieldset></fieldset>');
                fieldset.tooltip({title: res.creationMenu.legend});
                var rowHolder = $('<div class="col-md-8 col-md-offset-2 col-sm-10 col-sm-offset-1 col-xs-12"></div>');
                var figuresHolder = $('<div class="row"></div>');
                for (var i in draggableElements) {
                    figuresHolder.append(getFigureDOM(draggableElements[i], images[i]));
                }
                rowHolder.append(figuresHolder);
                fieldset.append(rowHolder);
                menuSelector = $('<div class="creation-menu"></div>');
                menuSelector.append(fieldset);
                return menuSelector;
            }

            function getFigureDOM(draggableElement, imageDetails) {
                return '<figure class="col-md-3 col-sm-3 col-xs-3 text-center"><img class="' + draggableElement + '" alt="' +
                       draggableElement + '" ' + 'src="' + staticsPath +
                       imageDetails.icon + '"><figcaption>' +
                       imageDetails.caption + '</figcaption></figure>';
            }

            function getElements() {
                return draggableElements;
            }

            function getSelector() {
                return menuSelector;
            }


            return {
                getSelector: getSelector,
                create: createComponent,
                getElements: getElements
            };
        })();

        /**
         * Network map.
         */
        var map = (function () {
            var nodes = new vis.DataSet();
            var edges = new vis.DataSet();
            var network;
            var options;

            var containerSelector = null;

            var html = {  // Literals for classes, identifiers, names or paths
                cLoadingIcon: 'loading-icon',
                idLoadingMessage: 'loadingMessage',
            };


            function createMap(staticsPath) {
                options = {
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
                        addNode: function(data, callback) {},
                        addEdge: function(data, callback) {},
                        editNode: function(data, callback) {},
                        editEdge: false,
                        deleteNode: function(data, callback) {},
                        deleteEdge: function(data, callback) {}
                    },
                    locale: 'ptAnywhere',
                    locales: {
                        ptAnywhere: res.manipulationMenu
                    },
                };
                containerSelector = createTemporaryDOM(staticsPath);
                showLoading();
                drawTopology();
                return containerSelector;
            }

            // Created the DOM that shorty afterwards will be replaced by the network map
            function createTemporaryDOM(staticsPath) {
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

            function drawTopology() {
                // Create network element if needed (only the first time)
                if (network==null) {
                    // create a network
                    var visData = { nodes : nodes, edges : edges };
                    network = new vis.Network($('.map', containerSelector).get(0), visData, options);
                }
            }

            function fit() {
                network.fit();
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

            /**
             * @arg name Name of the node to be deleted.
             */
            function removeNode(name) {
                nodes.remove(getByName(name));
            }

            function updateNode(node) {
                nodes.update(node);
            }

            /**
             * @arg fromDevice origin endpoint.
             *      It can be an object with an 'id' field or the device name (i.e., an string).
             * @arg toDevice destination endpoint.
             *      It can be an object with an 'id' field or the device name (i.e., an string).
             * @arg linkId (optional, string) identifier of the new link.
             * @arg linkUrl (optional, string) URL associated to the new link.
             */
            function connect(fromDevice, toDevice, linkId, linkUrl) {
                // FIXME unify the way to connect devices
                var newEdge;
                if (typeof fromDevice === 'string'  && typeof toDevice === 'string') {
                    // Alternative used mainly in the replayer
                    newEdge = { from: getByName(fromDevice).id, to: getByName(toDevice).id };
                } else {
                    // Alternative used in interactive widgets
                    newEdge = { from: fromDevice.id, to: toDevice.id };
                }
                if (linkId !== undefined) {
                    newEdge.id = linkId;
                }
                if (linkUrl !== undefined) {
                    newEdge.url = linkUrl;
                }
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

            // For instrumented widgets:
            function getById(deviceId) {
                return nodes.get(deviceId);
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

            // Begin event listeners
            function onDoubleClick(callback) {
                network.on('doubleClick', function() {
                    var selected = getSelectedNode();
                    if (selected!=null) callback(selected);
                });
            }

            function onAddDevice(interactionCallback) {
                options.manipulation.addNode = function(data, callback) {
                    interactionCallback(data.x, data.y);
                };
                network.setOptions(options);
            }

            function onAddLink(interactionCallback) {
                options.manipulation.addEdge = function(data, callback) {
                    var fromDevice = nodes.get(data.from);
                    var toDevice = nodes.get(data.to);
                    interactionCallback(fromDevice, toDevice);
                };
                network.setOptions(options);
            }

            function onEditDevice(interactionCallback) {
                options.manipulation.editNode = function(data, callback) {
                    interactionCallback( nodes.get(data.id) );
                    callback(data);
                };
                network.setOptions(options);
            }

            function onDeleteDevice(interactionCallback) {
                options.manipulation.deleteNode = function(data, callback) {
                    // Always (data.nodes.length>0) && (data.edges.length==0)
                    // FIXME There might be more than a node selected...
                    interactionCallback(nodes.get(data.nodes[0]));
                    // This callback is important, otherwise it received 3 consecutive onDelete events.
                    callback(data);
                };
                network.setOptions(options);
            }

            function onDeleteLink(interactionCallback) {
                options.manipulation.deleteEdge = function(data, callback) {
                    // Always (data.nodes.length==0) && (data.edges.length>0)
                    // TODO There might be more than an edge selected...
                    interactionCallback( edges.get(data.edges[0]) );
                    // This callback is important, otherwise it received 3 consecutive onDelete events.
                    callback(data);
                };
                network.setOptions(options);
            }
            // End event listeners

            function getSelector() {
                return containerSelector;
            }

            // Reveal public pointers to
            // private functions and properties
           return {
                getSelector: getSelector,
                create: createMap,
                update: update,
                fit: fit,
                addNode: addNode,
                removeNode: removeNode,
                updateNode: updateNode,
                connect: connect,
                disconnect: disconnect,
                getCoordinate: toNetworkMapCoordinate,
                error: showError,
                // Method mainly for instrumentation
                get: getByName,
                // Event listeners / interaction configuration
                onDoubleClickDevice: onDoubleClick,
                onAddDevice: onAddDevice,
                onAddLink: onAddLink,
                onEditDevice: onEditDevice,
                onDeleteDevice: onDeleteDevice,
                onDeleteLink: onDeleteLink,
           };

        })();
        // End networkMap module


        // Before the components are created, an error message can be shown...
        function init(selector) {
            widgetSelector = $(selector);
        }

        function createComponents(staticsPath) {
            var menuSelector = creationMenu.create(staticsPath);
            var mapSelector = map.create(staticsPath);
            widgetSelector.append(mapSelector);
            widgetSelector.append(menuSelector);
        }

        /* Show message */
        function showMessage(msg) {
            widgetSelector.html('<div class="row message">' +
                                '  <div class="col-md-8 col-md-offset-2 text-center">' +
                                '    <h1>' + msg.title + '</h1>' + msg.content +
                                '  </div>' +
                                '</div>');
        }

        return {
            init: init,
            create: createComponents,
            showMessage: showMessage,
            creationMenu: creationMenu,
            map: map
        };
    })();

    /**
     * HTML structure for the dialogs used in the widget.
     */
    var dialogs = (function () {

        var CREATION = 'creationDialog';
        var MODIFICATION = 'modificationDialog';
        var LINK = 'linkDialog';
        var CMD = 'cmdDialog';

        /* Public component creator */
        function createComponents(settings) {
            // The wrapper must be visible and it should not be deleted/overriden (e.g., ERROR 410 overrides widgetSelector).
            var componentsWrapper = $('<div></div>');
            $(settings.dialogWrapper).append(componentsWrapper);

            var components = {};
            components[CREATION] = new creationDialog.Object(componentsWrapper, 'create-device', settings.backdrop, settings.backdropArea);
            components[MODIFICATION] = new deviceModificationDialog.Object(componentsWrapper, 'modify-device', settings.backdrop, settings.backdropArea);
            components[LINK] = new linkDialog.Object(componentsWrapper, 'link-devices', settings.backdrop, settings.backdropArea);
            if (settings.commandLine) {
                components[CMD] = new cmdDialog.Object(componentsWrapper, settings.backdrop, settings.backdropArea);
            }
            return components;
        }


        // Begin: utility functions/classes
        //  (They are used in many submodules)
        var MODAL = {  // Literals for classes, identifiers or names
            cPrimaryBtn: 'btn-primary',
        };

        /**
         * Parent modal class.
         */
        function Modal(modalId, parentSelector, modalTitle, modalBody, hasSubmitButton, hasBackdrop, backdropArea) {
            this.options = {
                backdrop: hasBackdrop,
            };
            this.bdArea = backdropArea;
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
                modal += '        <button type="button" class="btn ' + MODAL.cPrimaryBtn + '">Submit</button>';
            }
            modal +=    '      </div>' +
                        '    </div>' +
                        '  </div>' +
                        '</div>';
            parentSelector.append(modal);
            this.selector = $("#" + modalId, parentSelector);
        }

        Modal.prototype.open = function() {
            this.selector.modal(this.options);
            this.selector.modal('show');
            if (this.options.backdrop && this.bdArea!=null) {
                $('.modal-backdrop').appendTo(this.bdArea);
            }
        };

        Modal.prototype.close = function() {
            this.selector.modal('hide');
        };

        Modal.prototype.getPrimaryButton = function() {
            return $('.' + MODAL.cPrimaryBtn, this.selector);
        };


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


        // Component to embed command line
        var cmdDialog = (function () {
            function Dialog(parentSelector, hasBackdrop, backdropArea) {
                this.options = {
                    backdrop: hasBackdrop,
                };
                this.bdArea = backdropArea;
                this.selector = $('<div class="modal fade" tabindex="-1" role="dialog" aria-labelledby="cmdModal"></div>');
                var modal = '<div class="modal-dialog" role="document" style="height: 90%;">' +
                            '  <div class="modal-content" style="height: 100%;">' +
                            '    <div class="modal-header" style="height: 10%;">' +
                            '      <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
                            '      <h4 class="modal-title" id="cmdModal">' + res.commandLineDialog.title + '</h4>' +
                            '    </div>' +
                            '    <div class="modal-body" style="height: 89%;">' +
                            '    </div>' +
                            '  </div>' +
                            '</div>';
                this.selector.append(modal);
                parentSelector.append(this.selector);
                var el = this;
                this.selector.on('hidden.bs.modal', function (e) {
                    // TODO not destroy and have many hidden modals to not remove previous interactions.
                    el.setBody('');  // To make sure that no iframe is left open after the modal is closed.
                });
            }

            Dialog.prototype.setBody = function(htmlSnippet) {
                $('.modal-body', this.selector).html(htmlSnippet);
            };

            Dialog.prototype.appendTo = function(subselector, htmlSnippet) {
                $(subselector, this.selector).append(htmlSnippet);
            };

            Dialog.prototype.open = function() {
                this.selector.modal(this.options);
                this.selector.modal('show');
                if (this.options.backdrop && this.bdArea!=null) {
                    $('.modal-backdrop').appendTo(this.bdArea);
                }
            };

            Dialog.prototype.close = function() {
                this.selector.modal('hide');
            };

            return {
                Object: Dialog
            };
        })();  // End cmdDialog module


        // Creation dialog component
        var creationDialog = (function () {

            var html = {  // Literals for classes, identifiers or names
                nameField: 'name',
                nameId: 'newDeviceName',
                typeField: 'type',
                typeId: 'newDeviceType',
            };

            function Dialog(parentSelector, dialogId, hasBackdrop, backdropArea) {
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
                Modal.call(this, dialogId, parentSelector, res.creationDialog.title, dialogForm, true, hasBackdrop, backdropArea);
                //$('form', this.selector).on('submit', function( event ) { event.preventDefault(); });
            }

            // Inheritance
            Dialog.prototype = Object.create(Modal.prototype);
            Dialog.prototype.constructor = Dialog;

            // Own methods
            Dialog.prototype.getDeviceName = function() {
                return $('input[name="' + html.nameField + '"]', this.selector).val().trim();
            };

            Dialog.prototype.getDeviceType = function() {
                return $('select[name="' + html.typeField + '"]', this.selector).val();
            };

            return {
                Object: Dialog
            };
        })();  // End creationDialog module


        // Link dialog component
        var linkDialog = (function () {

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

            function Dialog(parentSelector, dialogId, hasBackdrop, backdropArea) {
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
                Modal.call(this, dialogId, parentSelector, res.linkDialog.title, dialogForm, true, hasBackdrop, backdropArea);
            }

            // Inheritance
            Dialog.prototype = Object.create(Modal.prototype);
            Dialog.prototype.constructor = Dialog;

            // Own methods
            Dialog.prototype.setFromDevice = function(deviceName) {
                $('.' + clazz.fromName, this.selector).text(deviceName);
            };

            Dialog.prototype.setToDevice = function(deviceName) {
                $('.' + clazz.toName, this.selector).text(deviceName);
            };

            Dialog.prototype.getFromPortURL = function() {
                return $('.' + clazz.fromInterface + ' option:selected', this.selector).val();
            };

            Dialog.prototype.getToPortURL = function() {
                return $('.' + clazz.toInterface + ' option:selected', this.selector).val();
            };

            Dialog.prototype.setToPorts = function(ports) {
                loadPortsInSelect(ports, $('.' + clazz.toInterface, this.selector), null);
            };

            Dialog.prototype.setFromPorts = function(ports) {
                loadPortsInSelect(ports, $('.' + clazz.fromInterface, this.selector), null);
            };

            Dialog.prototype.showLoading = function() {
                this.showPanel(clazz.loading);
            };

            Dialog.prototype.showLoaded = function() {
                this.showPanel(clazz.loaded);
                this.getPrimaryButton().show();
            };

            Dialog.prototype.showError = function(errorMessage) {
                $('.' + clazz.error + ' .' + clazz.errorMsg, this.selector).text(errorMessage);
                this.showPanel(clazz.error);
            };

            // Should be private
            Dialog.prototype.showPanel = function(classToShow) {
                var classNames = [clazz.loading, clazz.loaded, clazz.error];
                for (i in classNames) {
                    if (classNames[i]==classToShow) {
                        $('.' + classNames[i], this.selector).show();
                    } else {
                        $('.' + classNames[i], this.selector).hide();
                    }
                }
            };


            return {
                Object: Dialog
            };
        })();  // End linkDialog module


        // Module for device modification
        var deviceModificationDialog = (function () {
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

            function Dialog(parentSelector, dialogId, hasBackdrop, backdropArea) {
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
                Modal.call(this, dialogId, parentSelector, res.modificationDialog.title, dialogForm, true, hasBackdrop, backdropArea);
            }

            // Inheritance
            Dialog.prototype = Object.create(Modal.prototype);
            Dialog.prototype.constructor = Dialog;

            // Own methods
            /**
             * @return The selected tab number (starting in 1).
             */
            Dialog.prototype.getSelectedTab = function() {
                var selectedTab = $('li.active a', this.selector).attr('aria-controls');
                if (selectedTab==html.tab1) return 1;
                if (selectedTab==html.tab2) return 2;
                return 0;  // else
            };

            Dialog.prototype.selectFirstTab = function() {
                $('.nav-tabs a[href="#' + html.tab1 + '"]', this.selector).tab('show');
            };

            Dialog.prototype.selectSecondTab = function() {
                $('.nav-tabs a[href="#' + html.tab2 + '"]', this.selector).tab('show');
            };

            Dialog.prototype.getDeviceName = function() {
                return $('input[name="' + html.nameField + '"]', this.selector).val();
            };

            Dialog.prototype.setDeviceName = function(name) {
                $('input[name="' + html.nameField + '"]', this.selector).val(name);
            };

            Dialog.prototype.getDefaultGateway = function() {
                return $('input[name="' + html.gatewayField + '"]', this.selector).val();
            };

            /**
             * @param defaultGw If it is null, the field is set to '' and hidden.
             */
            Dialog.prototype.setDefaultGateway = function(defaultGw) {
                var gwSelector = $('input[name="' + html.gatewayField + '"]', this.selector);
                if (defaultGw==null) {
                    gwSelector.parent().parent().hide();
                    gwSelector.val('');
                } else {
                    gwSelector.val(defaultGw);
                    gwSelector.parent().parent().show();
                }
            };

            Dialog.prototype.getSelectedPortUrl = function() {
                return $('select[name="' + html.iFaceSelector + '"]', this.selector).val();
            };

            /**
             * Updates the port selector and returns selected port.
             * @return Selected port.
             */
            Dialog.prototype.setPorts = function(ports) {
                return loadPortsInSelect(ports, $('select[name="' + html.iFaceSelector + '"]', this.selector), 0);
            };

            Dialog.prototype.getPortSelect = function() {
                return $('select[name="' + html.iFaceSelector + '"]', this.selector);
            };

            Dialog.prototype.showIFaceDetails = function() {
                $('.' + html.cIFaceDetails, this.selector).show();
                $('.' + html.cNoIFaceDetails, this.selector).hide();
            };

            Dialog.prototype.hideIFaceDetails = function() {
                $('.' + html.cIFaceDetails, this.selector).hide();
                $('.' + html.cNoIFaceDetails, this.selector).show();
            };

            Dialog.prototype.getPortIpAddress = function() {
                return $('input[name="' + html.ipField + '"]', this.selector).val();
            };

            Dialog.prototype.setPortIpAddress = function(ipAddress) {
                $('input[name="' + html.ipField + '"]', this.selector).val(ipAddress);
            };

            Dialog.prototype.getPortSubnetMask = function() {
                return $('input[name="' + html.subnetField + '"]', this.selector).val();
            };

            Dialog.prototype.setPortSubnetMask = function(subnetMask) {
                $('input[name="' + html.subnetField + '"]', this.selector).val(subnetMask);
            };

            Dialog.prototype.showLoading = function() {
                $('#' + html.tab2 + '>.' + html.cLoading, this.selector).show();
                $('#' + html.tab2 + '>.' + html.cLoaded, this.selector).hide();
            };

            Dialog.prototype.showLoaded = function() {
                $('#' + html.tab2 + '>.' + html.cLoading, this.selector).hide();
                $('#' + html.tab2 + '>.' + html.cLoaded, this.selector).show();
            };


            return {
                Object: Dialog
            };
        })();  // End deviceModification module


        return {
            create: createComponents,
            CREATION_DIALOG: CREATION,
            MODIFICATION_DIALOG: MODIFICATION,
            LINK_DIALOG: LINK,
            CMD_DIALOG: CMD,
        };
    })();


    function getSettings(customSettings) {
        var settings = { // Default values
            createSession: false,
            fileToOpen: null,
            commandLine: true,
            backdrop: true,
            backdropArea: null,
            dialogWrapper: 'body',  // Class to apply to
        };
        for (var attrName in customSettings) { settings[attrName] = customSettings[attrName]; }  // merge/override
        return settings;
    }

    function addSlashIfNeeded(url) {
      if (url.indexOf('/', this.length - 1) === -1 ) {
        return url + '/';
      }
      return url;
    }

    function loadComponents(pathToStatics, settings) {
        var staticsPath = addSlashIfNeeded(pathToStatics);
        main.create(staticsPath);
        return dialogs.create(settings);
    }

    function loadInteractiveComponents(pathToStatics, settings, ptClient) {
        var dlgs = loadComponents(pathToStatics, settings);
        interaction.init(main.map, main.creationMenu, dlgs, ptClient);
    }

    /*
     * It creates an interactive widget.
     */
    function initInteractive(selector, apiURL, pathToStatics, customSettings) {
        var settings = getSettings(customSettings);
        main.init(selector);
        if (settings.createSession && settings.fileToOpen!=null) {
            main.showMessage(res.session.creating);
            ptAnywhere.http.newSession(apiURL, settings.fileToOpen, function(newSessionURL) {
                $.get(newSessionURL, function(sessionId) {
                    window.location.href =  '?session=' + sessionId;
                });
            }).fail(function(data) {
                main.showMessage(res.session.unavailable);
            });
        } else {
            // JS client of the HTTP API
            var ptClient = new ptAnywhere.http.Client(apiURL, function() {
                main.showMessage(res.network.notLoaded);
            });

            loadInteractiveComponents(pathToStatics, settings, ptClient);

            ptClient.getNetwork(
                function(data) {
                    main.map.update(data);
                },
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
                    main.map.error(errorMessage + '. ' + res.network.attempt + ' ' + tryCount + '/' + maxRetries + '.');
                });
        }
    }

    /*
     * It creates a non interactive widget and returns the methods to control it.
     */
    function initNonInteractive(selector, pathToStatics, networkData, customSettings) {
        var settings = getSettings(customSettings);
        main.init(selector);
        var dlgs = loadComponents(pathToStatics, settings);
        main.map.update(networkData);
        return {  // Controls to programatically modify the module
            map: main.map,
            reset: function() { main.map.update(networkData); },
            dialogs: {
                creation: dlgs[dialogs.CREATION_DIALOG],
                modification: dlgs[dialogs.MODIFICATION_DIALOG],
                link: dlgs[dialogs.LINK_DIALOG],
                cmd: dlgs[dialogs.CMD_DIALOG],
            },
        };
    }

    // exposed functions and classes
    return {
        create: initInteractive,
        createNonInteractiveWidget: initNonInteractive
    };
})();
