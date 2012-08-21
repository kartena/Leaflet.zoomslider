window.osmTileJSON = {
	"tilejson": "2.0.0",
    "name": "OpenStreetMap",
    "description": "A free editable map of the whole world.",
    "version": "1.0.0",
    "attribution": "&copy; OpenStreetMap contributors, CC-BY-SA",
    "scheme": "xyz",
    "tiles": [
        "http://a.tile.openstreetmap.org/${z}/${x}/${y}.png",
        "http://b.tile.openstreetmap.org/${z}/${x}/${y}.png",
        "http://c.tile.openstreetmap.org/${z}/${x}/${y}.png"
    ],
    "minzoom": 5,
    "maxzoom": 12,
    "bounds": [ -180, -85, 180, 85 ],
    "center": [ 11.9, 57.7, 8 ]
};
