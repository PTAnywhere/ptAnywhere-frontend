    <script src="http://code.jquery.com/jquery-1.12.4.min.js"></script>
    <script src="http://code.jquery.com/ui/1.11.4/jquery-ui.min.js"></script>
    <script>
        if (!window.jQuery) {
            // Assumption: either all of them fail (hence the JS has not been loaded properly), or none does.
            console.log("Error externally loading jQuery from CDN, including local copy.");
            document.write('<script src="${dependencies}/jquery.min.js"><\/script>');
            document.write('<script src="${dependencies}/core.min.js"><\/script>');
            document.write('<script src="${dependencies}/widget.min.js"><\/script>');
            document.write('<script src="${dependencies}/mouse.min.js"><\/script>');
            document.write('<script src="${dependencies}/draggable.min.js"><\/script>');
        }
    </script>

    <!-- Always added locally because there was no easy way to check when the plugin has been loaded. -->
    <!-- <script src="https://cdnjs.cloudflare.com/ajax/libs/jqueryui-touch-punch/0.2.3/jquery.ui.touch-punch.min.js"></script> -->
    <script src="${dependencies}/jquery.ui.touch-punch.min.js"></script>
