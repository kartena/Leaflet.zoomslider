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

			this._body = L.DomUtil.create('div',
										  this.options.styleNS + '-body',
										  element);
			this._body.style.height = this._height + "px";
			L.DomEvent.on(this._body, 'click', this._onClick, this);
			this._knob = this._createKnob(this._body);
			this._knob.enable();

			this.setValue(value);
		},

		setValue: function (value) {
			this._setKnobPos(this._valueToPos(value));
		},
		getValue: function() {
			return this._posToValue(this._getKnobPos());
		},

		_createKnob: function (parent) {
			var elem = L.DomUtil.create('div', this.options.styleNS + '-knob', parent);
			L.DomEvent.disableClickPropagation(elem);

			var bounds = new L.Bounds(L.point(0, 0),
									  L.point(0, this._height));
			return new BoundedDraggable(elem, elem, bounds)
				.on('drag', function () {
					this._setKnobPos(this._snap(this._getKnobPos()));
				}, this)
				.on('dragend', function () {
					this.fire("update", { value: this.getValue() } );
				}, this);
		},

		_onClick: function (e) {
			var first = (e.touches && e.touches.length === 1 ? e.touches[0] : e);
			var y = L.DomEvent.getMousePosition(first).y
					- L.DomUtil.getViewportOffset(this._body).y; // Cache this?
			this._setKnobPos(this._snap(y));
			this.fire("update", { value: this.getValue() } );
		},

		// Helpers
		_getKnobPos: function () {
			return L.DomUtil.getPosition(this._knob.getElement()).y
				+ this._knob.getElement().offsetHeight/2;
		},
		_setKnobPos: function (pos) {
			L.DomUtil.setPosition(
				this._knob.getElement(),
				L.point(0, pos - this._knob.getElement().offsetHeight/2)
			);
		},

		_snap: function(pos) {
			var h = this.options.stepHeight,
				mod = pos % h;
			return mod < h / 2
				? pos - mod
				: pos - mod + h;
		},
		// Assumes a snapped pos
		_posToValue: function(pos) {
			return (this._height - pos) / this.options.stepHeight;
		},
		_valueToPos: function(value){
			return this._height - (value * this.options.stepHeight);
		}
	});

	var Zoomslider = L.Control.extend({
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

			this._sliderElem = L.DomUtil.create(
				'div',
				this.options.styleNS + "-slider leaflet-bar-part",
				container);

			this._zoomOutButton = this._createZoomButton(
				'out', 'bottom', container, this._zoomOut);

			map .on('layeradd layerremove', this._refresh, this)
				.on("zoomend", this._updateSlider, this)
				.on("zoomend", this._updateDisabled, this)
				.whenReady(this._createSlider, this);

			return container;
		},

		onRemove: function (map) {
			map .off("zoomend", this._updateSlider)
				.off("zoomend", this._updateDisabled)
				.off('layeradd layerremove', this._refresh);
		},

		_refresh: function () {
			// TODO: just refresh the slider
			this._map
				.removeControl(this)
				.addControl(this);
		},

		_createSlider: function () {
			var zoomLevels = this._map.getMaxZoom() - this._map.getMinZoom();
			// This means we have no tilelayers (or that they are setup in a strange way).
			// Either way we don't want to add a slider here.
			if(zoomLevels == Infinity){
				return;
			}
			this._slider = new Slider(
				this._sliderElem,
				zoomLevels,
				this._toSliderValue(this._map.getZoom())
			).on("update", this._updateZoom, this);
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
		_toZoomLevel: function (sliderValue) {
			return sliderValue + this._map.getMinZoom();
		},
		_toSliderValue: function (zoomLevel) {
			return zoomLevel - this._map.getMinZoom();
		},
		_updateZoom: function(e){
			this._map.setZoom(this._toZoomLevel(e.value));
		},
		_updateSlider: function(){
			if(this._slider){
				this._slider.setValue(this._toSliderValue(this._map.getZoom()));
			}
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
	return Zoomslider;
})();

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
