    <link rel="stylesheet" href="http://code.jquery.com/ui/1.11.4/themes/cupertino/jquery-ui.css">
    <script src="http://code.jquery.com/jquery-1.10.2.min.js"></script>
    <script src="http://code.jquery.com/ui/1.11.4/jquery-ui.min.js"></script>
    <script>
        if (!window.jQuery) {
            // Assumption: either all of them fail (hence the JS has not been loaded properly), or none does.
            console.log("Error externally loading jQuery from CDN, including local copy.");
            document.write('<link rel="stylesheet" href="${base}/bower_components/jquery-ui/themes/cupertino/jquery-ui.css">');
            document.write('<link rel="stylesheet" href="${base}/bower_components/jquery-ui/themes/cupertino/jquery-ui.min.css">');
            document.write('<link rel="stylesheet" href="${base}/bower_components/jquery-ui/themes/cupertino/theme.css">');
            document.write('<script src="${base}/bower_components/jquery/jquery.min.js"><\/script>');
            document.write('<script src="${base}/bower_components/jquery-ui/jquery-ui.min.js"><\/script>');
        }
    </script>

    <!-- Always added locally because there was no easy way to check when the plugin has been loaded. -->
    <!-- <script src="https://cdnjs.cloudflare.com/ajax/libs/jqueryui-touch-punch/0.2.3/jquery.ui.touch-punch.min.js"></script> -->
    <script src="${base}/bower_components/jquery-ui-touch-punch/jquery.ui.touch-punch.min.js"></script>
