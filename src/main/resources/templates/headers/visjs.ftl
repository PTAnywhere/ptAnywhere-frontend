    <link href="https://cdnjs.cloudflare.com/ajax/libs/vis/4.7.0/vis.min.css" rel="stylesheet" type="text/css"/>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/vis/4.7.0/vis.min.js" type="text/javascript"></script>
    <script>
        if (!window.vis) {
            // Assumption: if JS fails, so will do the CSS because they are hosted by the same CDN.
            // If only the CSS fails, no solution possible.
            console.log("Error externally loading vis.js from CDN, including local copy.");
            document.write('<link href="${base}/libs/vis/vis.min.css" rel="stylesheet" type="text/css"/>');
            document.write('<script src="${base}/libs/vis/vis.min.js"><\/script>');
        }
    </script>