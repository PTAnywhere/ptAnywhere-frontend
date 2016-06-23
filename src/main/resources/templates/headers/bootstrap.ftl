    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap-theme.min.css">
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js"></script>
    <script>
        var bootstrap3_enabled = (typeof $().emulateTransitionEnd == 'function');
        if (!bootstrap3_enabled) {
            console.log("Error externally loading Boostrap from CDN, including local copy.");
            document.write('<link rel="stylesheet" href="${dependencies}/css/bootstrap.min.css">');
            document.write('<link rel="stylesheet" href="${dependencies}/css/bootstrap-theme.min.css">');
            document.write('<script src="${dependencies}/js/bootstrap.min.js"><\/script>');
        }
    </script>
