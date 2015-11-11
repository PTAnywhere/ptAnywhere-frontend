
// http://addyosmani.com/resources/essentialjsdesignpatterns/book/#revealingmodulepatternjavascript
/**
 * Client for PacketTracer's HTTP API.
 */
var packetTracer = (function () {

    // Private utility functions

    function requestJSON(verb, url, data, callback, customSettings) {
        var settings = { // Default values
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            type: verb,
            data: (data!=null)? JSON.stringify(data): null,
            dataType: 'json',
            timeout: 2000,
            success: callback
        };
        for (var attrName in customSettings) { settings[attrName] = customSettings[attrName]; }  // merge
        return $.ajax(url, settings);
    }

    function getJSON(url, callback, customSettings) {
        return requestJSON('GET', url, null, callback, customSettings);
    }

    function postJSON(url, data, callback, customSettings) {
        return requestJSON('POST', url, data, callback, customSettings);
    }

    function putJSON(url, data, callback, customSettings) {
        return requestJSON('PUT', url, data, callback, customSettings);
    }

    function deleteHttp(url, callback, customSettings) {
        var settings = {
            type: 'DELETE',
            timeout: 2000,
            success: callback
        };
        for (var attrName in customSettings) { settings[attrName] = customSettings[attrName]; }  // merge
        return $.ajax(url, settings);
    }


    // Session-level operations
    /**
     * Creates a new session and returns the request object.
     *   @param apiURL the base url of the HTTP API.
     *   @param fileToOpen URL of the file to be opened at the beginning.
     *   @param success is a callback which received the URL of the new session as a parameter.
     */
    function createSession(apiURL, fileToOpen, success) {
        var newSession = { fileUrl: fileToOpen };
        return postJSON(apiURL + '/sessions', newSession, function(data, status, xhr) {
            var newSessionURL = xhr.getResponseHeader('Location');
            success(newSessionURL);
        }, {});
    }


    // Publicly exposed class with methods which call API resources

    /* Begin PTClient */
    function PTClient(apiURL, sessionExpirationCallback) {
        this.apiURL = apiURL;
        this.customSettings = { // Custom values
            statusCode: {
                410: sessionExpirationCallback
            }
        };
    }

    /**
       * @arg callback If it is null, it is simply ignored.
       */
    PTClient.prototype.getNetwork = function(callback, beforeRetry) {
        var maxRetries = 5;
        var delayBetweenRetries = 2000;
        var sessionExpirationCallback = this.customSettings.statusCode['410'];
        var moreSpecificSettings = {
            tryCount : 0,
            retryLimit : maxRetries,
            statusCode: {
                404: sessionExpirationCallback,
                410: sessionExpirationCallback,
                503: function() {
                        this.tryCount++;
                        if (this.tryCount <= this.retryLimit) {
                            beforeRetry(this.tryCount, maxRetries, res.network.errorUnavailable);
                            var thisAjax = this;
                            setTimeout(function() { $.ajax(thisAjax); }, delayBetweenRetries);  // retry
                        }
                    },
            },
            error : function(xhr, textStatus, errorThrown ) {
                if (textStatus == 'timeout') {
                    this.tryCount++;
                    console.error('The topology could not be loaded: timeout.');
                    if (this.tryCount <= this.retryLimit) {
                        beforeRetry(this.tryCount, maxRetries, res.network.errorTimeout);
                        $.ajax(this); // try again
                    }
                } else {
                   console.error('The topology could not be loaded: ' + errorThrown + '.');
                }
            }
        };
        return getJSON(this.apiURL + '/network', callback, moreSpecificSettings);
    };

    PTClient.prototype.addDevice = function(newDevice, callback) {
        return postJSON( this.apiURL + '/devices', newDevice,
            function(data) {
                console.log('The device was created successfully.');
                callback(data);
            }, this.customSettings).
            fail(function(data) { console.error('Something went wrong in the device creation.'); });
    };

    PTClient.prototype.removeDevice = function(device) {
        return deleteHttp(device.url, function(result) {
                console.log('The device has been deleted successfully.');
            }, this.customSettings).
            fail(function(data) { console.error('Something went wrong in the device removal.'); });
    };

    PTClient.prototype.modifyDevice = function(device, deviceLabel, defaultGateway, callback) { // modify
        // General settings: PUT to /devices/id
        var modification = { label: deviceLabel };
        if (defaultGateway!="") {
            modification.defaultGateway = defaultGateway;
        }
        return putJSON(device.url, modification,
            function(result) {
                console.log('The device has been modified successfully.');
                result.defaultGateway = defaultGateway;  // FIXME PTPIC library!
                callback(result);  // As the device has the same id, it should replace the older one.
        }, this.customSettings).
        fail(function(data) {
            console.error('Something went wrong in the device modification.');
        });
    };

    PTClient.prototype.modifyPort = function(portURL, ipAddress, subnetMask) {
         // Send new IP settings
         var modification = {
             portIpAddress: ipAddress,
             portSubnetMask: subnetMask
         };
         return putJSON(portURL, modification,
            function(result) {
                console.log('The port has been modified successfully.');
            }, this.customSettings).
            fail(function(data) {
                console.error('Something went wrong in the port modification.');
            });
    };

    PTClient.prototype.getAllPorts = function(device, callback) {
        return getJSON(device.url + 'ports', callback, this.customSettings).
                fail(function() {
                    console.error('Ports for the device ' + device.id + ' could not be loaded. Possible timeout.');
                });
    };

    PTClient.prototype.getAvailablePorts = function(device, cSuccess, cFail, cSessionExpired) {
        return getJSON(device.url + 'ports?free=true', cSuccess, this.customSettings).
                fail(function(data) {
                    if (data.status==410) {
                        cSessionExpired();
                    } else {
                        cFail();
                    }
                });
    };

    PTClient.prototype.createLink = function(fromPortURL, toPortURL, doneCallback, successCallback) {
        var modification = {
            toPort: toPortURL
        };
        return postJSON(fromPortURL + 'link', modification, function(response) {
            console.log('The link has been created successfully.');
            successCallback(response.id, response.url);
        }, this.customSettings).
        fail(function(data) {
            console.error('Something went wrong in the link creation.');
        }).
        done(doneCallback);
    };

    PTClient.prototype.removeLink = function(linkUrl) {
        return getJSON(linkUrl, function(data) {
                    deleteHttp(data.endpoints[0] + 'link', function(result) {
                        console.log('The link has been deleted successfully.');
                    }, this.customSettings).
                    fail(function(data) {
                        console.error('Something went wrong in the link removal.');
                    });
                }, this.customSettings).
                fail(function(data) {
                    console.error('Something went wrong getting this link: ' + linkUrl + '.');
                });
    };
    /* End PTClient */


    return {
        // Why an object instead of having all the functions defined at module level?
        //   1. To make sure that constructor is always called (and the base API URL is not missing).
        //   2. To allow having more than a client in the same application (although I am not sure whether this will be ever needed).
        Client: PTClient,
        newSession: createSession
    };
})();
