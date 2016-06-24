    <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.5.6/angular.min.js"></script>
    <script>
        if (!window.angular) {
            console.log("Error externally loading Angular from CDN, including local copy.");
            document.write('<script src="${dependencies}/angular.min.js"><\/script>');
        }
    </script>

    <script src="${dependencies}/angular-route.min.js"></script>
