var osmTileJSON = {    
	"tilejson": "2.0.0",
    "name": "OpenStreetMap",
    "description": "A free editable map of the whole world.",
    "version": "1.0.0",
    "attribution": "&copy; OpenStreetMap contributors, CC-BY-SA",
    "scheme": "xyz",
    "tiles": [
        "http://a.tile.openstreetmap.org/${z}/${x}/${y}.png",
        "http://b.tile.openstreetmap.org/${z}/${x}/${y}png",
        "http://c.tile.openstreetmap.org/${z}/${x}/${y}.png"
    ],
    "minzoom": 5,
    "maxzoom": 12,
    "bounds": [ -180, -85, 180, 85 ],
    "center": [ 11.9, 57.7, 8 ]
};
// The zoomslider will be used by default if you include L.Control.Zoomslider
var map = L.TileJSON.createMap('map', osmTileJSON); //, { mapOptions: { zoomslider: true }});

// You can turn it off by using the option zoomSliderControl: false
// var map = L.TileJSON.createMap('map', osmTileJSON, { mapOptions: { zoomsliderControl: false }});

// You can restore the original control by turning the zoomslider off and turning the zoomControl on 
//var map = L.TileJSON.createMap('map', osmTileJSON, { mapOptions: { zoomsliderControl: false, zoomControl: true }});

// Or turn them both on. 
//var map = L.TileJSON.createMap('map', osmTileJSON, { mapOptions: { zoomsliderControl: true, zoomControl: true }});
