

// http://addyosmani.com/resources/essentialjsdesignpatterns/book/#revealingmodulepatternjavascript
/**
 * Client for PacketTracer's HTTP API.
 */
var packetTracer = (function () {

    // Private utility functions

    function showSessionExpiredError() {
        $(".view").html($("#notFound").html());
    }

    function requestJSON(verb, url, data, callback) {
        return $.ajax({
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            type: verb,
            url: url,
            data: (data!=null)? JSON.stringify(data): null,
            dataType: 'json',
            timeout: 2000,
            success: callback,
            statusCode: {
                410: showSessionExpiredError
            }
        });
    }

    function getJSON(url, callback) {
        return requestJSON('GET', url, null, callback);
    }

    function postJSON(url, data, callback) {
        return requestJSON('POST', url, data, callback);
    }

    function putJSON(url, data, callback) {
        return requestJSON('PUT', url, data, callback);
    }

    function deleteHttp(url, callback) {
        return $.ajax({
            type: 'DELETE',
            url: url,
            success: callback
        });
    }

    // Publicly exposed functions which call API resources

    /**
     * @arg callback If it is null, it is simply ignored.
     */
    function getTopology(callback) {
        var maxRetries = 5;
        $.ajax({
            url: api_url + "/network",
            type : 'GET',
            dataType: 'json',
            success: callback,
            tryCount : 0,
            retryLimit : maxRetries,
            timeout: 2000,
            statusCode: {
                404: showSessionExpiredError,
                410: showSessionExpiredError,
                503: function() {
                    this.tryCount++;
                    if (this.tryCount <= this.retryLimit) {
                        $("#loadingMessage").text("Instance not yet available. Attempt " + this.tryCount + "/" + maxRetries + ".");
                        var thisAjax = this;
                        setTimeout(function() { $.ajax(thisAjax); }, 2000);  // retry
                    }
                },
            },
            error : function(xhr, textStatus, errorThrown ) {
                if (textStatus == 'timeout') {
                    this.tryCount++;
                    console.error("The topology could not be loaded: timeout.");
                    if (this.tryCount <= this.retryLimit) {
                        $("#loadingMessage").text("Timeout. Attempt " + this.tryCount + "/" + maxRetries + ".");
                        $.ajax(this); //try again
                    }
                } else {
                    console.error("The topology could not be loaded: " + errorThrown + ".");
                }
            }
        });
    }

    function postDevice(newDevice, callback) {
        return postJSON( api_url + "/devices", newDevice,
            function(data) {
                console.log("The device was created successfully.");
                callback(data);
            })
            .fail(function(data) { console.error("Something went wrong in the device creation."); });
    }

    function deleteDevice(device) {
        return deleteHttp(device.url,
            function(result) {
                console.log("The device has been deleted successfully.");
            }).fail(function(data) { console.error("Something went wrong in the device removal."); });
    }

    function putDevice(device, deviceLabel, defaultGateway, callback) { // modify
        // General settings: PUT to /devices/id
        var modification = { label: deviceLabel };
        if (defaultGateway!="") {
            modification.defaultGateway = defaultGateway;
        }
        return putJSON(device.url, modification,
            function(result) {
                console.log("The device has been modified successfully.");
                result.defaultGateway = defaultGateway;  // FIXME PTPIC library!
                callback(result);  // As the device has the same id, it should replace the older one.
        })
        .fail(function(data) { console.error("Something went wrong in the device modification."); });
    }

    function putPort(portURL, ipAddress, subnetMask, callback) {
        // Send new IP settings
        var modification = {
            portIpAddress: ipAddress,
            portSubnetMask: subnetMask
        };
        return putJSON(portURL, modification,
            function(result) {
                console.log("The port has been modified successfully.");
        })
        .fail(function(data) { console.error("Something went wrong in the port modification."); })
        .always(callback);
    }

    function getPorts(device, callback) {
        return getJSON(device.url + "ports", callback)
        .fail(function() {
            console.error("Ports for the device " + device.id + " could not be loaded. Possible timeout.");
        });
    }

    function getFreePorts(device, cSuccess, cFail, cSessionExpired) {
        return getJSON(device.url + "ports?free=true", cSuccess)
        .fail(function(data) {
            if (data.status==410) {
                cSessionExpired();
            } else {
                cFail();
            }
        });
    }

    function postLink(fromPortURL, toPortURL, doneCallback, successCallback) {
        var modification = {
            toPort: toPortURL
        }
        return postJSON(fromPortURL + "link", modification, function(response) {
            console.log("The link has been created successfully.");
            successCallback(response.id, response.url);
        })
        .fail(function(data) { console.error("Something went wrong in the link creation."); })
        .always(callback);
    }

    function deleteLink(linkUrl) {
        return getJSON(linkUrl, function(data) {
            deleteHttp(data.endpoints[0] + "link", function(result) {
                console.log("The link has been deleted successfully.");
            })
            .fail(function(data) { console.error("Something went wrong in the link removal."); });
        })
        .fail(function(data) { console.error("Something went wrong getting this link " + edgeId + "."); });
    }

    return {
        getNetwork: getTopology,
        addDevice: postDevice,
        removeDevice: deleteDevice,
        modifyDevice: putDevice,
        modifyPort: putPort,
        getAllPorts: getPorts,
        getAvailablePorts: getFreePorts,
        createLink: postLink,
        removeLink: deleteLink,
    };

})();