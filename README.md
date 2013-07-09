[Leaflet.zoomslider](http://kartena.github.com/Leaflet.zoomslider/)
==================

## Description
A zoom slider widget for [Leaflet][2]

Tested with Chrome, IE 7-9 and Firefox. 

Also see [Leaflet.Pancontrol][1]

## Branches
 - 0.4 — tracks Leaflet 0.4.x and should be stable. 
 - 0.5 — tracks Leaflet 0.5.x and should be stable. 
 - 0.6 — tracks Leaflet 0.6.x and should be stable. 
 - master — tracks Leaflet master and can be considered unstable (but please file bugs!). 

## Tests

Install the needed dependencies:
```
$ git submodule update --init
$ npm install
```

### Browser
```
$ open spec/index.html # xdg-open on Linux
```

### Node.js
```
$ brew install phantomjs  # or get it from http://phantomjs.org/
$ npm install -g grunt-cli
$ grunt test
```


[1]: https://github.com/kartena/Leaflet.Pancontrol
[2]: https://github.com/CloudMade/Leaflet
