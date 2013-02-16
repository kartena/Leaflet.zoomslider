L.Control.Zoomslider = (function(){

	var Knob = L.Draggable.extend({
		initialize: function (element, steps, stepHeight) {
			var sliderHeight = steps * stepHeight,
				knobHeight = 5 ; // element.offsetHeight; // TODO: Not inited yet. fix
			L.Draggable.prototype.initialize.call(this, element, element);

			this._element = element;
			this._maxValue = steps - 1;

			// conversion parameters
			this._k = -stepHeight;
			this._m = sliderHeight - (stepHeight + knobHeight) / 2;

			this.on('predrag', function() {
				this._newPos.x = 0;
				this._newPos.y = this._adjust(this._newPos.y);
			}, this);
		},

		_adjust: function (y) {
			var value = Math.round(this._toValue(y));
			value = Math.max(0, Math.min(this._maxValue, value));
			return this._toY(value);
		},

		// y = k*v + m
		_toValue: function (y) {
			return (y - this._m) / this._k;
		},
		// v = (y - m) / k
		_toY: function (value) {
			return this._k * value + this._m;
		},

		setPosition: function (y) {
			L.DomUtil.setPosition(this._element,
								  L.point(0, this._adjust(y)));
		},

		setValue: function (v) {
			L.DomUtil.setPosition(this._element,
								  L.point(0, this._toY(v)));
		},

		getValue: function () {
			return this._toValue(L.DomUtil.getPosition(this._element).y);
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
				.whenReady(this._createSlider, this)
				.whenReady(this._createKnob, this)
				.whenReady(this._updateSlider, this)
				.whenReady(this._updateDisabled, this);

			return container;
		},

		onRemove: function (map) {
			map .off("zoomend", this._updateSlider)
				.off("zoomend", this._updateDisabled)
				.off('layeradd layerremove', this._refresh);
		},

		_refresh: function () {
			// TODO: listen to zoomlevelschange-event instead in 0.6.x
			this._map
				.removeControl(this)
				.addControl(this);
		},
		_zoomLevels: function(){
			return this._map.getMaxZoom() - this._map.getMinZoom() + 1;
		},

		_createSlider: function () {
			var knobElem,
				zoomLevels = this._zoomLevels();

			// This means we have no tilelayers (or that they are setup in a strange way).
			// Either way we don't want to add a slider here.
			if(zoomLevels == Infinity){
				return;
			}

			this._sliderBody = L.DomUtil.create('div',
												this.options.styleNS + '-slider-body',
												this._sliderElem);
			this._sliderBody.style.height
				= (this.options.stepHeight * zoomLevels) + "px";
			L.DomEvent.on(this._sliderBody, 'click', this._onSliderClick, this);

		},

		_createKnob: function(){
			var elem = L.DomUtil.create('div', this.options.styleNS + '-slider-knob',
										this._sliderBody);
			L.DomEvent.disableClickPropagation(elem);

			this._knob = new Knob(elem, this._zoomLevels(), this.options.stepHeight)
				.on('dragend', this._updateZoom, this);
			this._knob.enable();
		},

		_onSliderClick: function (e) {
			var first = (e.touches && e.touches.length === 1 ? e.touches[0] : e);
			var y = L.DomEvent.getMousePosition(first).y
	  				- L.DomUtil.getViewportOffset(this._sliderBody).y; // Cache this?
			this._knob.setPosition(y);
			this._updateZoom();
		},

		_zoomIn: function (e) {
			this._map.zoomIn(e.shiftKey ? 3 : 1);
		},
		_zoomOut: function (e) {
			this._map.zoomOut(e.shiftKey ? 3 : 1);
		},

		_createZoomButton: function (zoomDir, end, container, fn) {
			var barPart = 'leaflet-bar-part',
				classDef = this.options.styleNS + '-' + zoomDir
					+ ' ' + barPart
					+ ' ' + barPart + '-' + end,
				title = 'Zoom ' + zoomDir,
				link = L.DomUtil.create('a', classDef, container);
			link.href = '#';
			link.title = title;

			L.DomEvent
				.on(link, 'click', L.DomEvent.preventDefault)
				.on(link, 'click', fn, this);

			return link;
		},
		_toZoomLevel: function (sliderValue) {
			return sliderValue + this._map.getMinZoom();
		},
		_toSliderValue: function (zoomLevel) {
			return zoomLevel - this._map.getMinZoom();
		},

		_updateZoom: function(){
			this._map.setZoom(this._toZoomLevel(this._knob.getValue()));
		},
		_updateSlider: function(){
			if(this._knob){
				this._knob.setValue(this._toSliderValue(this._map.getZoom()));
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
