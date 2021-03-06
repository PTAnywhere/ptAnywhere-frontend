<!DOCTYPE html>
<html ng-app="ptAnywhere.widget">
<head>
    <title>${title}</title>
    <link rel="icon" type="image/png" href="${base}/images/icon.png">

    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">

    <#include "headers/angular.ftl">
    <#include "headers/bootstrap.ftl">
    <#include "headers/jquery-ui.ftl">
    <#include "headers/visjs.ftl">

    <!-- PTAnywhere -->
    <link href="${base}/css/widget.css" rel="stylesheet" type="text/css" />
    <link href="${base}/ptAnywhere.min.css" rel="stylesheet" type="text/css" />

    <script src="${base}/ptAnywhere.min.js"></script>
    <script>
        angular.module('ptAnywhere.api.http')
                .constant('url', '${apiUrl}');
        angular.module('ptAnywhere.widget.configuration')
                .constant('imagesUrl', '${base}/img')
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
