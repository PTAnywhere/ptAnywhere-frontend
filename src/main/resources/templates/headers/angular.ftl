    <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.5.6/angular.min.js"></script>
    <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.5.6/angular-route.min.js"></script>
    <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.5.6/angular-animate.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/angular-ui-bootstrap/1.3.3/ui-bootstrap-tpls.min.js"></script>
    <script>
        if (!window.angular) {
            console.log("Error externally loading Angular from CDN, including local copy.");
            document.write('<script src="${dependencies}/angular.min.js"><\/script>');
        }

        try {
            angular.module('ngRoute');
        } catch(err) {
            console.log("Error externally loading Angular route module from CDN, including local copy.");
            document.write('<script src="${dependencies}/angular-route.min.js"><\/script>');
        }

        try {
            angular.module('ngAnimate');
        } catch(err) {
            console.log("Error externally loading Angular animate module from CDN, including local copy.");
            document.write('<script src="${dependencies}/angular-animate.min.js"><\/script>');
        }

        try {
            angular.module('ui.bootstrap');
        } catch(err) {
            console.log("Error externally loading Angular ui bootstrap module from CDN, including local copy.");
            document.write('<script src="${dependencies}/ui-bootstrap-tpls.min.js"><\/script>');
            document.write('<link rel="stylesheet" href="${dependencies}/bootstrap.min.css" \/>');
            document.write('<link rel="stylesheet" href="${dependencies}/bootstrap-theme.min.css" \/>');
        }
    </script>