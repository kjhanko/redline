//main js file

//Create the map
function createMap() {

  //creates a Leaflet map centered on CONUS
  var map = L.map('map', {
    center: [40, -95],
    zoom: 5,
  });

  //add OSM base tilelayer
  L.tileLayer('http://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> | &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
  }).addTo(map);

  //using Leaflet's ControlSearch with OSM to allow seaching of addresses
  map.addControl(new L.Control.Search({
    url: 'https://nominatim.openstreetmap.org/search?format=json&q={s}',
    jsonParam: 'json_callback',
    propertyName: 'display_name',
    propertyLoc: ['lat', 'lon'],
    marker: L.circleMarker([0, 0], { radius: 30 }),
    autoCollapse: true,
    autoType: false,
    minLength: 2,
    position: 'topleft',
    initial: false,
    zoom: 16,
  }));

  //call getData function
  // getData(map);
}

$(document).ready(createMap);
