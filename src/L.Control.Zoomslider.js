L.Control.Zoomslider = L.Control.extend({
	options: {
		position: 'topleft',
		sliderHeight: 162
	},

	onAdd: function (map) {
		var className = 'leaflet-control-zoomslider',
			container = L.DomUtil.create('div', className);
		
		this._createButton('Zoom in', className + '-in'
						   , container, map.zoomIn , map);
		this._createSlider(className + '-slider', container, map);
		this._createButton('Zoom out', className + '-out'
						   , container, map.zoomOut, map);

		this._map = map;
		
		this._map.on('zoomend', this._snapToZoomLevel, this);
		
		return container;
	},

	_createSlider: function (className, container, map) {
		var wrapper =  L.DomUtil.create('div', className + '-wrap', container);
		var slider = L.DomUtil.create('div', className, wrapper);
		var knob = L.DomUtil.create('div', className + '-knob', slider);

		this._zoomLevels = map.getMaxZoom() - map.getMinZoom();
		this._zoomStep = this.options.sliderHeight / this._zoomLevels;
		this._makeDraggable(knob);
		this._snapToZoomLevel();
		this._knob = knob;
		
		L.DomEvent
			.on(slider, 'click', L.DomEvent.stopPropagation)
			.on(slider, 'click', L.DomEvent.preventDefault)
			.on(slider, 'click', this._onSliderClick, this);

		return slider;
	},

	_createButton: function (title, className, container, fn, context) {
		var link = L.DomUtil.create('a', className, container);
		link.href = '#';
		link.title = title;

		L.DomEvent
			.on(link, 'click', L.DomEvent.stopPropagation)
			.on(link, 'click', L.DomEvent.preventDefault)
			.on(link, 'click', fn, context);
		
		return link;
	},

	_makeDraggable: function(knob, bbox) {
		if (!this._draggable) {
			L.DomUtil.setPosition(knob, new L.Point(0, 0));
			L.DomEvent
				.on(knob
					, L.Draggable.START
					, L.DomEvent.stopPropagation)
				.on(knob, 'click', L.DomEvent.stopPropagation);

			var bounds = new L.Bounds(
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
	    var offset = first.offsetY 
			? first.offsetY
			: L.DomEvent.getMousePosition(first).y 
			- L.DomUtil.getViewportOffset(this._knob).y;
		var level = this._posToZoomlevel(offset  - this._knob.offsetHeight / 2);
		this._snapToZoomLevel(level);
		this._map.setZoom(level);
	},

	_posToZoomlevel: function(pos) {
		pos = !isNaN(pos) 
			? pos
			: L.DomUtil.getPosition(this._knob).y;
		return Math.round( (this.options.sliderHeight - pos) / this._zoomStep);
	},

	_snapToZoomLevel: function(zoomLevel) {
		if(this._knob) {
			zoomLevel = !isNaN(zoomLevel) 
				? zoomLevel
				: this._map.getZoom();
			var y = this.options.sliderHeight - (zoomLevel * this._zoomStep);
			L.DomUtil.setPosition(this._knob, new L.Point(0, y));
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

L.control.zoomslider = function (options) {
    return new L.Control.Zoomslider(options);
};


L.BoundedDraggable = L.Draggable.extend({
	initialize: function(element, dragStartTarget, bounds) {
		L.Draggable.prototype.initialize.call(this, element, dragStartTarget);
		this._bounds = bounds;
		this.on('predrag', function() {
			if(!this._bounds.contains(this._newPos)){
				this._newPos = this._fitPoint(this._newPos);
			}
		}, this);
	}, 
	_fitPoint: function(point){
		var closest = new L.Point(
			Math.min(point.x, this._bounds.max.x),
			Math.min(point.y, this._bounds.max.y)
		);
		closest.x = Math.max(closest.x, this._bounds.min.x);
		closest.y = Math.max(closest.y, this._bounds.min.y);
		return closest;
	}
});
