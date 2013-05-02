describe('Control', function() {
  var map;

  it('Should add itself to the map unless zoomSliderControl is false', function() {
    map = L.map(document.createElement('div'), { zoomAnimation: false }).setView([0,0], 16);
    expect(map.zoomsliderControl).to.be.an(L.Control.Zoomslider);
  });

  it('Should not add itself to the map if zoomSliderControl is set to false', function() {
    map = L.map(document.createElement('div'), { zoomAnimation: false, zoomsliderControl: false }).setView([0,0], 16);
    expect(map.zoomsliderControl).to.be(undefined);
  });
});
