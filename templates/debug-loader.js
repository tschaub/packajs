(function() {
    var files = {{scripts}};

    var scripts = document.getElementsByTagName("script");
    var index = scripts[scripts.length-1].src;

    var pieces = new Array(scripts.length);

    var src;
    for (var i=0; i<files.length; i++) {
        src = index + "@" + files[i];
        pieces[i] = "<script src='" + src + "'></script>";
    }
    document.write(pieces.join(""));
})();
