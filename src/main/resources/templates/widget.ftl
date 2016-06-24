<!DOCTYPE html>
<html ng-app="ptAnywhere">
<head>
    <title>${title}</title>
    <link rel="icon" type="image/png" href="${base}/images/icon.png">

    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">

    <#include "headers/angular.ftl">
    <#include "headers/angular-route.ftl">
    <#include "headers/jquery-with-ui.ftl">
    <#include "headers/bootstrap.ftl">
    <#include "headers/visjs.ftl">

    <!-- PTAnywhere -->
    <script type="text/javascript" src="${base}/js/custom/ptAnywhere-js/js/libPTAnywhere-http.js"></script>

    <link href="${base}/css/widget.css" rel="stylesheet" type="text/css"/>
    <link href="${base}/css/ptAnywhere.css" rel="stylesheet" type="text/css"/>

    <script>
        /*$(function() {
            // Global, better if it is passed by parameter to widget creator...
            var widget = ptAnywhereWidgets.all.create( '.widget', '${apiUrl}', '${base}/images/',
                                                    { sessionCreation: {sessionCreation} } );
        });*/
    </script>

    <script src="${base}/js/ptAnywhere.min.js"></script>
    <script>
        angular.module('ptAnywhere')
                .constant('baseUrl', '${base}')
                .constant('apiUrl', '${apiUrl}')
                .constant('fileToOpen', '${fileToOpen}');
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
                <div class="widget">
                    <div ng-view></div>
                </div>
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
