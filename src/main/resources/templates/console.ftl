<!DOCTYPE html>
<html ng-app="ptAnywhere.widget.console">
<head lang="en">
    <meta charset="UTF-8">
    <title>Console</title>

    <#include "headers/jquery.ftl">
    <#include "headers/angular.ftl">
    <#include "headers/bootstrap.ftl">

    <!-- PTAnywhere -->
    <link href="${base}/ptAnywhere.min.css" rel="stylesheet" type="text/css" />

    <script src="${base}/ptAnywhere.min.js"></script>
    <script>
        angular.module('ptAnywhere.widget.console')
                .constant('endpoint', '${websocketURL}');
    </script>
</head>
<body ng-controller="CommandLineController as cmd">
    <div scroll-glue>
        <div class="commandline" disabled="cmd.disabled" output="cmd.output" input="cmd.lastLine"
             send-command="cmd.send(command)" on-previous="cmd.onPreviousCommand()" on-next="cmd.onNextCommand()">
    </div>
</body>
</html>