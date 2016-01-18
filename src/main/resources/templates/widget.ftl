<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
    <link rel="icon" type="image/png" href="${base}/images/icon.png">

    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">

    <#include "headers/jquery-with-ui.ftl">
    <#include "headers/bootstrap.ftl">
    <#include "headers/visjs.ftl">

    <!-- PTAnywhere -->
    <script type="text/javascript" src="${base}/bower_components/ptAnywhere-js/js/libPTAnywhere-http.js"></script>

    <link href="${base}/css/widget.css" rel="stylesheet" type="text/css"/>
    <link href="${base}/bower_components/widget-ui/css/widget.css" rel="stylesheet" type="text/css"/>

    <script type="text/javascript" src="${base}/bower_components/widget-ui/js/locale/en.js"></script>
    <script type="text/javascript" src="${base}/bower_components/widget-ui/js/widget.js"></script>
    <script>
        $(function() {
            // Global, better if it is passed by parameter to widget creator...
            var widget = ptAnywhereWidgets.all.create( '.widget', '${apiUrl}', '${base}/bower_components/widget-ui/images/',
                                                    { sessionCreation: ${sessionCreation} } );
        });
    </script>
</head>

<body>
<div class="container-fluid">
    <div class="row widget-header">
        <div class="col-md-12 text-right">
            <img src="${base}/images/PTAnywhere-logo.png" alt="PacketTracer icon">
            ${title}
        </div>
    </div>
    <div class="row widget-body">
        <div class="col-md-12">
            <div class="widget"></div>
        </div>
    </div>
    <div class="row widget-footer">
        <div class="col-md-offset-2 col-md-8 col-sm-12" style="height: 100%;">
            <div class="row text-center" style="height: 100%;">
                <div class="col-sm-4 col-xs-12" style="height: 100%;">
                    <a href="https://www.netacad.com"><img src="${base}/images/Cisco_academy_logo.png" alt="Cisco logo" /></a>
                </div>
                <div class="col-sm-4 col-xs-12" style="height: 100%;">
                    <a href="http://www.open.ac.uk"><img src="${base}/images/ou_logo.png" alt="Open University logo" /></a>
                </div>
                <div class="col-sm-4 col-xs-12" style="height: 100%;">
                    <a href="http://kmi.open.ac.uk"><img src="${base}/images/kmi_logo.png" alt="Knowledge Media Institute logo" /></a>
                </div>
            </div>
        </div>
    </div>
</div>
</body>
</html>
