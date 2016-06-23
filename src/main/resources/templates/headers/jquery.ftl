    <script src="http://code.jquery.com/jquery-1.12.4.min.js"></script>
    <script>
        if (!window.jQuery) {
            console.log("Error externally loading jQuery from CDN, including local copy.");
            document.write('<script src="${dependencies}/jquery.min.js"><\/script>');
        }
    </script>
