L.Control.Zoomslider = (function(){
	var BoundedDraggable = L.Draggable.extend({
		initialize: function (element, dragStartTarget, bounds) {
			L.Draggable.prototype.initialize.call(this, element, dragStartTarget);
			this._bounds = bounds;
			this.on('predrag', function() {
				if(!this._bounds.contains(this._newPos)){
					this._newPos = this._fitPoint(this._newPos);
				}
			}, this);
		},
		_fitPoint: function (point) {
			var closest = L.point(
				Math.min(point.x, this._bounds.max.x),
				Math.min(point.y, this._bounds.max.y)
			);
			closest.x = Math.max(closest.x, this._bounds.min.x);
			closest.y = Math.max(closest.y, this._bounds.min.y);
			return closest;
		},
		getElement: function () {
			return this._element;
		}
	});

	var Slider = L.Class.extend({
		includes: L.Mixin.Events,

		options: {
			stepHeight: 9,
			styleNS: "leaflet-control-zoomslider-slider"
		},
		
		initialize: function (element, steps, value) {
			this._height = this.options.stepHeight * steps;
			var slider =  L.DomUtil.create('div', 
										   this.options.styleNS 
										   + ' leaflet-bar-part', 
										   element);
			slider.style.height = (this._height + 5) + "px"; // Eh, why 5?
			var body = L.DomUtil.create('div',
										this.options.styleNS + '-body',
										slider);
			this._knob = this._createKnob(body);
			// .on('drag', this._snap, this)
			// .on('dragend', this._setZoom, this)
		},
		
		setValue: function (value) {
			var y = this._height - (value * this.options.stepHeight);
			L.DomUtil.setPosition(this._knob.getElement(), L.point(0, y));
		},
		// getValue: function() { ... } ?
		
		_createKnob: function (parent) {
			var elem = L.DomUtil.create('div', this.options.styleNS + '-knob', parent);
			L.DomUtil.setPosition(elem, L.point(0, 0)); // Why?
			L.DomEvent.disableClickPropagation(elem);

			var bounds = new L.Bounds(L.point(0, 0), 
									  L.point(0, this._height));
			return new L.BoundedDraggable(elem, elem, bounds);
		},
		
		_onClick: function (e) {
			var first = (e.touches && e.touches.length === 1 ? e.touches[0] : e);
			var offset = first.offsetY
					? first.offsetY
					: L.DomEvent.getMousePosition(first).y
					- L.DomUtil.getViewportOffset(this._knob.getElement()).y;
			var value = this._posToValue(offset - this._knob.getElement().offsetHeight / 2);
			this.setValue(value);
			this.fire("update", { value: value } );
		},
		
		// Helpers
		
		_posToValue: function(pos) {
			pos = isNaN(pos)
				? L.DomUtil.getPosition(this._knob).y
				: pos;
			return Math.round( (this._height - pos) / this.options.stepHeight);
		}
	});
	
	return L.Control.extend({
		options: {
			position: 'topleft',
			// height in px of zoom-slider.png
			stepHeight: 9,
			styleNS: 'leaflet-control-zoomslider'
		},

		onAdd: function (map) {
			var container = L.DomUtil.create('div', this.options.styleNS + ' leaflet-bar');

			L.DomEvent.disableClickPropagation(container);

			this._map = map;

			this._zoomInButton = this._createZoomButton(
				'in', 'top', container, this._zoomIn);

			this._createSlider(container, map);

			this._zoomOutButton = this._createZoomButton(
				'out', 'bottom', container, this._zoomOut);

			map.on('layeradd layerremove', this._refresh, this);

			map.whenReady(function () {
				this._snapToSliderValue();
				map.on('zoomend', this._snapToSliderValue, this);
			}, this);

			return container;
		},

		onRemove: function (map) {
			map.off('zoomend', this._snapToSliderValue);
			map.off('layeradd layerremove', this._refresh);
		},

		_refresh: function () {
			this._map
				.removeControl(this)
				.addControl(this);
		},

		_createSlider: function (container, map) {
			var zoomLevels = map.getMaxZoom() - map.getMinZoom();
			// This means we have no tilelayers (or that they are setup in a strange way).
			// Either way we don't want to add a slider here.
			if(zoomLevels == Infinity){
				return;
			}

			this._sliderHeight = this.options.stepHeight * zoomLevels;

			var sliderClass = this.options.styleNS + '-slider',
				slider =  L.DomUtil.create('div', sliderClass + ' leaflet-bar-part', container);
			slider.style.height = (this._sliderHeight + 5) + "px";
			var body = L.DomUtil.create('div',
										sliderClass + '-body',
										slider);
			this._knob = L.DomUtil.create('div', sliderClass + '-knob', body);

			this._draggable = this._createDraggable();
			this._draggable.enable();

			L.DomEvent.on(body, 'click', this._onSliderClick, this);
		},

		_zoomIn: function (e) {
			this._map.zoomIn(e.shiftKey ? 3 : 1);
		},

		_zoomOut: function (e) {
			this._map.zoomOut(e.shiftKey ? 3 : 1);
		},

		_createZoomButton: function (zoomDir, end, container, fn) {
			var barPart = 'leaflet-bar-part',
				classes = this.options.styleNS + '-' + zoomDir
					+ ' ' + barPart
					+ ' ' + barPart + '-' + end,
				title = 'Zoom ' + zoomDir;
			return this._createButton(title, classes, container, fn, this);
		},

		_createButton: function (title, classDef, container, fn, context) {
			var link = L.DomUtil.create('a', classDef, container);
			link.href = '#';
			link.title = title;

			L.DomEvent
				.on(link, 'click', L.DomEvent.preventDefault)
				.on(link, 'click', fn, context);

			return link;
		},

		_createDraggable: function() {
			L.DomUtil.setPosition(this._knob, L.point(0, 0));
			L.DomEvent.disableClickPropagation(this._knob);

			var bounds = new L.Bounds(
				L.point(0, 0),
				L.point(0, this._sliderHeight)
			);
			var draggable = new L.BoundedDraggable(this._knob,
												   this._knob,
												   bounds)
					.on('drag', this._snap, this)
					.on('dragend', this._setZoom, this);

			return draggable;
		},

		_snap : function(){
			this._snapToSliderValue(this._posToSliderValue());
		},
		_setZoom: function() {
			this._map.setZoom(this._toZoomLevel(this._posToSliderValue()));
		},

		_onSliderClick: function(e){
			var first = (e.touches && e.touches.length === 1 ? e.touches[0] : e);
			var offset = first.offsetY
					? first.offsetY
					: L.DomEvent.getMousePosition(first).y
					- L.DomUtil.getViewportOffset(this._knob).y;
			var value = this._posToSliderValue(offset - this._knob.offsetHeight / 2);
			this._snapToSliderValue(value);
			this._map.setZoom(this._toZoomLevel(value));
		},

		_posToSliderValue: function(pos) {
			pos = isNaN(pos)
				? L.DomUtil.getPosition(this._knob).y
				: pos;
			return Math.round( (this._sliderHeight - pos) / this.options.stepHeight);
		},

		_snapToSliderValue: function(sliderValue) {
			this._updateDisabled();
			if(this._knob) {
				sliderValue = isNaN(sliderValue)
					? this._getSliderValue()
					: sliderValue;
				var y = this._sliderHeight
						- (sliderValue * this.options.stepHeight);
				L.DomUtil.setPosition(this._knob, L.point(0, y));
			}
		},
		_toZoomLevel: function (sliderValue) {
			return sliderValue + this._map.getMinZoom();
		},
		_toSliderValue: function (zoomLevel) {
			return zoomLevel - this._map.getMinZoom();
		},
		_getSliderValue: function () {
			return this._toSliderValue(this._map.getZoom());
		},

		_updateDisabled: function () {
			var map = this._map,
				className = this.options.styleNS + '-disabled';

			L.DomUtil.removeClass(this._zoomInButton, className);
			L.DomUtil.removeClass(this._zoomOutButton, className);

			if (map.getZoom() === map.getMinZoom()) {
				L.DomUtil.addClass(this._zoomOutButton, className);
			}
			if (map.getZoom() === map.getMaxZoom()) {
				L.DomUtil.addClass(this._zoomInButton, className);
			}
		}
	});
});


L.Map.mergeOptions({
    zoomControl: false,
    zoomsliderControl: true
});

L.Map.addInitHook(function () {
    if (this.options.zoomsliderControl) {
		L.control.zoomslider().addTo(this);
	}
});

L.control.zoomslider = function (options) {
    return new L.Control.Zoomslider(options);
};


