<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
    <link rel="icon" type="image/png" href="${base}/images/icon.png">

    <#include "headers/jquery-with-ui.ftl">
    <#include "headers/visjs.ftl">

    <script type="text/javascript" src="${base}/bower_components/ptAnywhere-js/libPTAnywhere.js"></script>

    <link href="${base}/css/widget.css" rel="stylesheet" type="text/css"/>
    <link href="${base}/bower_components/widget-ui/css/widget.css" rel="stylesheet" type="text/css"/>

    <script type="text/javascript" src="${base}/bower_components/widget-ui/js/locale/en.js"></script>
    <script type="text/javascript" src="${base}/bower_components/widget-ui/js/widget.js"></script>
    <script>
        $(function() {
            // Global, better if it is passed by parameter to widget creator...
            var widget = ptAnywhere.createWidget("#widget", "${apiUrl}", "${base}/bower_components/widget-ui/images/", {createSession: ${createSession}});
            var networkCanvas = $("#network");
            var draggableCloud = new ptAnywhere.DraggableDevice($("#cloud"), networkCanvas, "cloud");
            var draggableRouter = new ptAnywhere.DraggableDevice($("#router"), networkCanvas, "router");
            var draggableSwitch = new ptAnywhere.DraggableDevice($("#switch"), networkCanvas, "switch");
            var draggablePc = new ptAnywhere.DraggableDevice($("#pc"), networkCanvas, "pc");
        });
    </script>
</head>

<body>
<div class="widget-header">
    <h2>
        <img src="${base}/images/PTAnywhere-logo.png" alt="PacketTracer icon" >
        ${title}
    </h2>
</div>
<div id="widget">
    <div id="network"></div>
    <fieldset id="creation-fieldset">
        <legend>To create a new device, drag it to the network map</legend>
        <div id="creation-menu">
            <figure>
                <img id="cloud" alt="cloud" src="${base}/bower_components/widget-ui/images/cloud.png" style="width: 120px;">
                <figcaption>Cloud</figcaption>
            </figure>
            <figure>
                <img id="router" alt="router" src="${base}/bower_components/widget-ui/images/router.png" style="width: 80px;">
                <figcaption>Router</figcaption>
            </figure>
            <figure>
                <img id="switch" alt="switch" src="${base}/bower_components/widget-ui/images/switch.png" style="width: 90px;">
                <figcaption>Switch</figcaption>
            </figure>
            <figure>
                <img id="pc" alt="PC" src="${base}/bower_components/widget-ui/images/PC.png" style="width: 90px;">
                <figcaption>PC</figcaption>
            </figure>
        </div>
    </fieldset>
</div>
<div class="footer">
    <div class="logos">
        <a href="https://www.netacad.com"><img src="${base}/images/Cisco_academy_logo.png" alt="Cisco logo" class="cisco-logo"></a>
        <a href="http://www.open.ac.uk"><img src="${base}/images/ou_logo.png" alt="Open University logo" class="ou-logo"></a>
        <a href="http://kmi.open.ac.uk"><img src="${base}/images/kmi_logo.png" alt="Knowledge Media Institute logo" class="kmi-logo"></a>
    </div>
</div>
</body>
</html>
