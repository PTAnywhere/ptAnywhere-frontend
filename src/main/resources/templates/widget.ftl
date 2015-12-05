<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
    <link rel="icon" type="image/png" href="${base}/images/icon.png">

    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">

    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap-theme.min.css">

    <#include "headers/jquery-with-ui.ftl">
    <#include "headers/visjs.ftl">

    <!-- Bootstrap JS -->
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js"></script>

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
                                                    { createSession: ${createSession}, fileToOpen: ${fileToOpen} } );
        });
    </script>
</head>

<body>
<div class="container-fluid">
    <div class="widget-header">
        <h2>
            <img src="${base}/images/PTAnywhere-logo.png" alt="PacketTracer icon" >
            ${title}
        </h2>
    </div>
    <div class="widget"></div>
    <div class="footer">
        <div class="logos">
            <a href="https://www.netacad.com"><img src="${base}/images/Cisco_academy_logo.png" alt="Cisco logo" class="cisco-logo"></a>
            <a href="http://www.open.ac.uk"><img src="${base}/images/ou_logo.png" alt="Open University logo" class="ou-logo"></a>
            <a href="http://kmi.open.ac.uk"><img src="${base}/images/kmi_logo.png" alt="Knowledge Media Institute logo" class="kmi-logo"></a>
        </div>
    </div>
</div>
</body>
</html>
