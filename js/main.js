//main js file


/*
var parcels = $.ajax({
    url: "data/Portland/parcels.geojson",
    dataType: "json",
    success: console.log("Parcels loaded"),
    error: function(xhr) {
        alert("Parcels: ${xhr.statusText}");
    }
});
*/




//Create the map

  //creates a Leaflet map centered on CONUS
  var map = L.map('map', {
    center: [45.5, -122.7],
    zoom: 6,
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
  
 



    var parcels = L.geoJson();
    var tileData = omnivore.topojson("data/Portland/parcels.topojson", null, parcels);
    tileData.on('ready', function() {
      console.log('parcel data ready');
      map.fitBounds(parcels.getBounds());



      //geojson-vt
      var tileOptions = {
        maxZoom: 20, // max zoom to preserve detail on
        tolerance: 7, // 5 simplification tolerance (higher means simpler)
        extent: 4096, //4096, // 4096 tile extent (both width and height)
        buffer: 64, // 64 default 64tile buffer on each side
        debug: 2, // logging level (0 to disable, 1 or 2)
        indexMaxZoom: 0, // 0 max zoom in the initial tile index
        indexMaxPoints: 100000, // 100000 max number of points per tile in the index
      };
      var data = parcels.toGeoJSON();
      var timeEnd = (Date.now() - timeStart)/1000;
      $('#mapDescription').append('<span style="color:red;font-weight:600;">32,329 Polygons loaded in ' + timeEnd.toFixed(2) + ' seconds</span><hr />')
      var tileIndex = geojsonvt(data, tileOptions);
      //take json output from geojson-vt and draw it with the now depricated (in leaflet-beta) L.canvasTiles and code from here - http://blog.sumbera.com/2015/05/31/geojson-vt-on-leaflet/
      var tileLayer = L.canvasTiles().params({
        debug: false,
        padding: 50
      }).drawing(drawingOnCanvas);
      var pad = 0;
      tileLayer.addTo(map);
      tileLayer.setZIndex(10);

      function drawingOnCanvas(canvasOverlay, params) {

        var bounds = params.bounds;
        params.tilePoint.z = params.zoom;

        var ctx = params.canvas.getContext('2d');
        ctx.globalCompositeOperation = 'source-over';


        //console.log('getting tile z' + params.tilePoint.z + '-' + params.tilePoint.x + '-' + params.tilePoint.y);

        var tile = tileIndex.getTile(params.tilePoint.z, params.tilePoint.x, params.tilePoint.y);
        if (!tile) {
          //console.log('tile empty');
          return;
        }

        ctx.clearRect(0, 0, params.canvas.width, params.canvas.height);

        var features = tile.features;

        ctx.strokeStyle = '#b2b2b2';


        for (var i = 0; i < features.length; i++) {
          var feature = features[i],
            type = feature.type;

          ctx.fillStyle = feature.tags.color ? feature.tags.color : 'transparent';
          ctx.beginPath();

          for (var j = 0; j < feature.geometry.length; j++) {
            var geom = feature.geometry[j];

            if (type === 1) {
              ctx.arc(geom[0] * ratio + pad, geom[1] * ratio + pad, 2, 0, 2 * Math.PI, false);
              continue;
            }

            for (var k = 0; k < geom.length; k++) {
              var p = geom[k];
              var extent = 4096;

              var x = p[0] / extent * 256;
              var y = p[1] / extent * 256;
              if (k) ctx.lineTo(x + pad, y + pad);
              else ctx.moveTo(x + pad, y + pad);
            }
          }

          if (type === 3 || type === 1) ctx.fill();
          ctx.stroke();
        }

      };

    });
