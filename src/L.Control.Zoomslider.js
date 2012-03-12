L.Control.Zoomslider = L.Control.extend({
	options: {
		position: 'topleft'
	},

	onAdd: function (map) {
		var className = 'leaflet-control-zoomslider',
			container = L.DomUtil.create('div', className);
		
		this._createButton('Zoom in', className + '-in', container, map.zoomIn, map);
		this._createSlider(className + '-slider', container, map);
		this._createButton('Zoom out', className + '-out', container, map.zoomOut, map);

		this._map = map;

		return container;
	},

	_createSlider: function (className, container, map) {
		var wrapper =  L.DomUtil.create('div', className + '-wrap', container);
		var slider = L.DomUtil.create('div', className, wrapper);
		var knob = L.DomUtil.create('div', className + '-knob', slider);

		this._bbox = {
			x: 0
			, y: 0
			, width: 0
			, height: 145 // TODO: Calculate this from div-height or from a setting.
		};
		this._sliderHeight = this._bbox.height;
		this._zoomLevels = map.options.maxZoom;
		this._zoomStep = this._bbox.height / this._zoomLevels;
		this._makeDraggable(knob);
		this._knob = knob;
		
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
	},

	_makeDraggable: function(knob, bbox) {
		if (!this._draggable) {
			L.DomUtil.setPosition(knob, new L.Point(0, 0));
			L.DomEvent.addListener(knob, L.Draggable.START, L.DomEvent.stopPropagation);
			
			this._draggable = new L.Draggable(knob, knob)
				.on('predrag', this._onPreDrag, this)
				.on('dragend', this._onDragEnd, this);
		}
		this._draggable.enable();
	},

	_onPreDrag: function() {
		this._adjustPointInsideBbox(this._draggable._newPos, this._bbox);
		this._snap();
	},
	_onDragEnd: function() {
		this._map.setZoom(this._snap());
	}, 

	_adjustPointInsideBbox: function(point, bbox) {
		var newPoint = new L.Point(
			Math.min(point.x, bbox.x+bbox.width), 
			Math.min(point.y, bbox.y+bbox.height));
		point.x = Math.max(newPoint.x, bbox.x);
		point.y = Math.max(newPoint.y, bbox.y);
		return newPoint;
	},

	_posToZoomlevel: function() {
		var pos = this._draggable._newPos.y,
			level = Math.round(pos/this._zoomStep);
		return level;
	},

	_snapToZoomLevel: function(zoomLevel) {
		this._draggable._newPos.y = zoomLevel * this._zoomStep;
		L.DomUtil.setPosition(this._knob, this._draggable._newPos);
	},
	_snap : function(){
		var zoomLevel = this._posToZoomlevel();
		this._snapToZoomLevel(zoomLevel);
		return zoomLevel;
	},
	
	// label: function() {
	// }

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