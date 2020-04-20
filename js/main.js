//main js file

//Step 1: Create the Leaflet map
function createMap() {

  //create the map
  var map = L.map('map', {
    center: [40, -95],
    zoom: 5,
  });

  //add OSM base tilelayer
  L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> | &copy; <a href="http://cartodb.com/attributions">CartoDB</a> | <a href="https://www.census.gov">US Census Data</a>'
  }).addTo(map);

  //call getData function
  // getData(map);
}

$(document).ready(createMap);
