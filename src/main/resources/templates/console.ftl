<!DOCTYPE html>
<html>
<head lang="en">
    <meta charset="UTF-8">
    <title>Console</title>

    <#include "headers/jquery.ftl">

    <link href="${base}/css/console.css" rel="stylesheet" type="text/css"/>

    <script type="text/javascript" src="${base}/js/custom/ptAnywhere-js/js/libPTAnywhere-websocket.js"></script>
    <script type="text/javascript" src="${base}/js/ptAnywhere.min.js"></script>
    <script>
        $(function() {
            var cmd = ptAnywhereWidgets.console.create('.commandLine');
            ptAnywhere.websocket.start('${websocketURL}',
                                        cmd.getConnectionCallback(),
                                        cmd.getUpdateCallback(),
                                        cmd.getReplaceCommandCallback(),
                                        cmd.getWarningCallback());
        });
    </script>
</head>
<body>
    <div class="commandLine"></div>
</body>
</html>