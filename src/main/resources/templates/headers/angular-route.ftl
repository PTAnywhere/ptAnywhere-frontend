    <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.5.6/angular-route.min.js"></script>
    <script>
        if (window.angular) {
            try {
                angular.module('ngRoute');
            } catch(err) {
                console.log("Error externally loading Angular route module from CDN, including local copy.");
                document.write('<script src="${dependencies}/angular-route.min.js"><\/script>');
            }
        }
    </script>