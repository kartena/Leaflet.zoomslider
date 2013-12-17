[Leaflet.zoomslider][1]
==================

## Description
A zoom slider widget for [Leaflet][2]

Tested with Chrome, IE 7-9 and Firefox. 

## Branches
 - 0.4 — tracks Leaflet 0.4.x and should be stable. 
 - 0.5 — tracks Leaflet 0.5.x and should be stable. 
 - 0.6 — tracks Leaflet 0.6.x and should be stable.
 - 0.7 — tracks Leaflet 0.7.x and should be stable. 
 - master — tracks Leaflet master and can be considered unstable (but please file bugs!). 

## Tests

Install the needed dependencies:
```
$ npm install
```

### Browser
```
$ open spec/index.html # xdg-open on Linux
```

### Node.js / phantomjs
```
$ npm install -g grunt-cli phantomjs
$ grunt
```

[1]: http://kartena.github.io/Leaflet.zoomslider/
[2]: http://leafletjs.com/
