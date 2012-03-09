L.Control.Zoomslider = L.Control.extend({
	options: {
		position: 'topright'
	},

	onAdd: function (map) {
		var className = 'leaflet-control-zoomslider',
		    container = L.DomUtil.create('div', className);

		this._createButton('Zoom in', className + '-in', container, map.zoomIn, map);
		this._createSlider(className + '-slider', container, map);
		this._createButton('Zoom out', className + '-out', container, map.zoomOut, map);

		return container;
	},

	_createSlider: function (className, container, map) {
		var wrapper =  L.DomUtil.create('div', className + '-wrap', container);
		var slider = L.DomUtil.create('div', className, wrapper);
		var knob = L.DomUtil.create('div', className + '-knob', slider);
		return slider;
	},

	_createButton: function (title, className, container, fn, context) {
		var link = L.DomUtil.create('a', className, container);
		link.href = '#';
		link.title = title;

		L.DomEvent
			.addListener(link, 'click', L.DomEvent.stopPropagation)
			.addListener(link, 'click', L.DomEvent.preventDefault)
			.addListener(link, 'click', fn, context);

		return link;
	}
});

L.Map.mergeOptions({
    zoomControl: false,
    zoomsliderControl: true
});

L.Map.addInitHook(function () {
    if (this.options.zoomsliderControl) {
		this.zoomsliderControl = new L.Control.Zoomslider();
		this.addControl(this.zoomsliderControl);
	}
});