<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
    <link rel="icon" type="image/png" href="${base}/images/icon.png">

    <#include "headers/jquery-with-ui.ftl">
    <#include "headers/visjs.ftl">

    <link href="${base}/css/widget.css" rel="stylesheet" type="text/css"/>
    <script type="text/javascript" src="${base}/js/libPTAnywhere.js"></script>

    <script type="text/javascript" src="${base}/js/locale/en.js"></script>
    <script type="text/javascript" src="${base}/js/widget.js"></script>
    <script>
        api_url = "${session_api}";
        $(function() {
            // Global, better if it is passed by parameter to widget creator...
            var ptClient = new packetTracer.Client(api_url, function() { $(".view").html($("#notFound").html()); } );
            var widget = ptAnywhere.createWidget("#widget", ptClient, {});
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

</div>
<div class="view">
    <div id="network"></div>
    <fieldset id="creation-fieldset">
        <legend>To create a new device, drag it to the network map</legend>
        <div id="creation-menu">
            <figure>
                <img id="cloud" alt="cloud" src="${base}/images/cloud.png" style="width: 120px;">
                <figcaption>Cloud</figcaption>
            </figure>
            <figure>
                <img id="router" alt="router" src="${base}/images/router.png" style="width: 80px;">
                <figcaption>Router</figcaption>
            </figure>
            <figure>
                <img id="switch" alt="switch" src="${base}/images/switch.png" style="width: 90px;">
                <figcaption>Switch</figcaption>
            </figure>
            <figure>
                <img id="pc" alt="PC" src="${base}/images/PC.png" style="width: 90px;">
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
<div id="notFound" style="display: none;">
    <div class="message">
        <h1>Topology not found.</h1>
        <p>The topology could not be loaded probably because the session does not exist (e.g., if it has expired).</p>
        <p><a href="../index.html">Click here</a> to initiate a new one.</p>
    </div>
</div>
</body>
</html>
