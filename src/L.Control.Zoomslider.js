L.Control.Zoomslider = L.Control.extend({
	options: {
		position: 'topleft',
		sliderHeight: 162
	},

	onAdd: function (map) {
		var className = 'leaflet-control-zoomslider',
			container = L.DomUtil.create('div', className);
		
		this._createButton('Zoom in', className + '-in', container, map.zoomIn, map);
		this._createSlider(className + '-slider', container, map);
		this._createButton('Zoom out', className + '-out', container, map.zoomOut, map);

		this._map = map;
		
		this._map.on('zoomend', this._snapToMapZoomLevel, this);
		
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
			, height: this.options.sliderHeight
		};
		
		this._zoomLevels = map.getMaxZoom() - map.getMinZoom();
		this._zoomStep = this._bbox.height / this._zoomLevels;
		this._makeDraggable(knob);
		this._snapToMapZoomLevel();
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
				.on('drag', this._onDrag, this)
				.on('dragend', this._onDragEnd, this);
		}
		this._draggable.enable();
	},

	_onDrag: function() {
		var newPos = L.DomUtil.getPosition(this._knob)
		  , adjustedPos = this._adjustPointInsideBbox(newPos, this._bbox);
		L.DomUtil.setPosition(this._knob, adjustedPos);
		this._snap();
	},
	_onDragEnd: function() {
		this._map.setZoom(this._posToZoomlevel());
	}, 
	
	_adjustPointInsideBbox: function(point, bbox) {
		var newPoint = new L.Point(
			Math.min(point.x, bbox.x+bbox.width), 
			Math.min(point.y, bbox.y+bbox.height));
		newPoint.x = Math.max(newPoint.x, bbox.x);
		newPoint.y = Math.max(newPoint.y, bbox.y);
		return newPoint;
	},

	_posToZoomlevel: function() {
		var pos = L.DomUtil.getPosition(this._knob).y,
			level = Math.round(pos/this._zoomStep);
		return level;
	},

	_snapToZoomLevel: function(zoomLevel) {
		L.DomUtil.setPosition(  this._knob
							  , new L.Point(0, zoomLevel * this._zoomStep));
	},
	_snap : function(){
		var zoomLevel = this._posToZoomlevel();
		this._snapToZoomLevel(zoomLevel);
		return zoomLevel;
	},
	_snapToMapZoomLevel: function() {
		if(typeof this._knob !== "undefined" && this._knob !== null) {
			this._snapToZoomLevel(this._map.getZoom());
		}
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