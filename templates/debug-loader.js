(function(d) {
  var files = {{scripts}},
      scripts = d.getElementsByTagName('script'),
      index = scripts[scripts.length - 1].src,
      pieces = new Array(scripts.length),
      src, i;
  for (i = 0; i < files.length; ++i) {
    src = index + '/' + files[i];
    pieces[i] = '<script src="' + src + '"></script>';
  }
  d.write(pieces.join(''));
})(document);
