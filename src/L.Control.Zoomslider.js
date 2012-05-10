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

		this._zoomLevels = map.getMaxZoom() - map.getMinZoom();
		this._zoomStep = this.options.sliderHeight / this._zoomLevels;
		this._makeDraggable(knob);
		this._snapToMapZoomLevel();
		this._knob = knob;
		
		L.DomEvent
			.addListener(slider, 'click', L.DomEvent.stopPropagation)
			.addListener(slider, 'click', L.DomEvent.preventDefault)
			.addListener(slider, 'click', this._onSliderClick, this);

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

			var bounds = new L.Bounds2(
				new L.Point(0, 0), 
				new L.Point(0, this.options.sliderHeight)
			);
			this._draggable = new L.BoundedDraggable(knob, knob, bounds)
				.on('drag', this._snap, this)
				.on('dragend', this._setZoom, this);
		}
		this._draggable.enable();
	},

	_snap : function(){
		var zoomLevel = this._posToZoomlevel();
		this._snapToZoomLevel(zoomLevel);
		return zoomLevel;
	},
	_setZoom: function() {
		this._map.setZoom(this._posToZoomlevel());
	},

	_onSliderClick: function(e){
		var first = (e.touches && e.touches.length === 1 ? e.touches[0] : e);
		var newPoint = new L.Point(
			0, 
			first.offsetY -  this._knob.offsetHeight / 2
		);
		L.DomUtil.setPosition(this._knob,newPoint);
		this._snap();
		this._setZoom();
	},

	_posToZoomlevel: function() {
		var pos = L.DomUtil.getPosition(this._knob).y,
		level = Math.round( (this.options.sliderHeight - pos) / this._zoomStep);
		return level;
	},

	_snapToZoomLevel: function(zoomLevel) {
		L.DomUtil.setPosition(  this._knob
								, new L.Point(0, this.options.sliderHeight - (zoomLevel * this._zoomStep)));
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

L.Bounds2 = L.Bounds.extend({
	closestTo: function(point){
		var closest = new L.Point(
			Math.min(point.x, this.max.x), 
			Math.min(point.y, this.max.y));
		closest.x = Math.max(closest.x, this.min.x);
		closest.y = Math.max(closest.y, this.min.y);
		return closest;
	}
});

L.BoundedDraggable = L.Draggable.extend({
	initialize: function(element, dragStartTarget, bounds) {
		L.Draggable.prototype.initialize.call(this, element, dragStartTarget);
		this.on('drag', function() {
			L.DomUtil.setPosition(
				element,  
				bounds.closestTo(L.DomUtil.getPosition(element))
			);
		}, this);
	}
});
