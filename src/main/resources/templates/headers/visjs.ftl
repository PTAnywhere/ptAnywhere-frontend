    <link href="https://cdnjs.cloudflare.com/ajax/libs/vis/3.11.0/vis.min.css" rel="stylesheet" type="text/css"/>
    <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/vis/3.11.0/vis.min.js"></script>
    <script>
        if (!window.vis) {
            // Assumption: if JS fails, so will do the CSS because they are hosted by the same CDN.
            // If only the CSS fails, no solution possible.
            console.log("Error externally loading vis.js from CDN, including local copy.");
            document.write('<link href="${base}/libs/vis/vis.css" rel="stylesheet" type="text/css"/>');
            document.write('<script src="${base}/libs/vis/vis.js"><\/script>');
        }
    </script>