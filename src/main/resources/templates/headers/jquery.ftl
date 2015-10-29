    <script src="http://code.jquery.com/jquery-1.10.2.min.js"></script>
    <script>
        if (!window.jQuery) {
            console.log("Error externally loading jQuery from CDN, including local copy.");
            document.write('<script src="${base}/bower_components/jquery/jquery.min.js"><\/script>');
        }
    </script>
