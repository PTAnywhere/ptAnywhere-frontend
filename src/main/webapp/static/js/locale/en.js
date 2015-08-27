var res = {
    loading: 'Loading...',
    loadingInfo: 'Loading info...',
    name: 'Name',
    manipulationMenu: {
        edit: 'Edit',
        del: 'Delete selected',
        back: 'Back',
        addNode: 'Add Device',
        addEdge: 'Connect Devices',
        editNode: 'Edit Device',
        addDescription: 'Click in an empty space to place a new device.',
        edgeDescription: 'Click on a node and drag the edge to another element to connect them.',
        // BEGIN: Unused
        editEdge: 'Edit Edge',
        editEdgeDescription: 'Click on the control points and drag them to a node to connect to it.',
        createEdgeError: 'Cannot link edges to a cluster.',
        deleteClusterError: 'Clusters cannot be deleted.',
        editClusterError: 'Clusters cannot be edited.',
        // END: Unused
    },
    network: {
        loading: 'Loading network...',
        attempt: 'Attempt',
        errorUnavailable: 'Instance not yet available',
        errorTimeout: 'Timeout',
    },
    commandLineDialog: {
        title: 'Command line',
    },
    linkDialog: {
        title: 'Connect two devices',
        select: 'Please select which ports to connect...',
        error: 'Sorry, something went wrong during the link creation.',
    },
    creationDialog: {
        title: 'Create new device',
        type: 'Device type',
    },
    modificationDialog: {
        title: 'Modify device',
        globalSettings: 'Global Settings',
        interfaces: 'Interfaces',
        defaultGW: 'Default gateway',
        ipAddress: 'IP address',
        subnetMask: 'Subnet mask',
        noSettings: 'No settings can be specified for this type of interface.',
    }
};