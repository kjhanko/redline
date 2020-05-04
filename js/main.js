function addCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

    var cityData = {};


    $.ajax({
        type: 'GET',
        async: false,
        url: 'data/city_data.geojson',
        data: { get_param: 'value' },
        dataType: 'json',
        success: function (data) {
            $.each(data.features, function(k, v) {
                p = v.properties;
                g = v.geometry;
                bbox = turf.extent(g);
                cityData[p.city] = {
                    "name": p.city,
                    "holc_map": p.holc_map,
                    "parcel_map": p.parcel_map,
                    "breaks": p.breaks,
                    "bbox": bbox
                }
            });
        }
    });
    var colors = ['#d73027','#f46d43','#fdae61','#fee08b','#d9ef8b','#a6d96a','#66bd63','#1a9850'];
    mapbox_path = "mapbox://mfriesenwisc.";

    mapboxgl.accessToken = 'pk.eyJ1IjoibWZyaWVzZW53aXNjIiwiYSI6ImNqenhjcjAzYjBlc3QzbmtpODI1YXZxNmgifQ.Zz-z-Ykof8NbNaQOdR6ouQ';
    var map = new mapboxgl.Map({
      container: 'map', // container id
      style: 'mapbox://styles/mapbox/light-v10',
      center: [-98.5795,38.8283],
      zoom: 3
    });

    var geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl
      });

    geocoder.on('result',function(e) {
        console.log(e.result.center);
    })

    map.addControl(geocoder,'bottom-left');

    var nav = new mapboxgl.NavigationControl({showCompass:false});
    map.addControl(nav,'top-left');
    var hoveredStateId = null;

    var drop = document.getElementById("change_city");
    drop.addEventListener("change", makeCity);




    map.on('load',function() {
    })

    function makeCity(event) {
        $('#menu').empty();
        $('.info').hide();
        var city = drop.value;
        var citylower = city.toLowerCase();
        var breaks = cityData[city].breaks;
        geocoder.setPlaceholder('Search '+city+' addresses');
        map.fitBounds(cityData[city].bbox, {padding: 150});
        map.addLayer({
            id: citylower+'-holc-map',
            type: 'raster',
            source: {
                type: 'raster',
                tiles: ['https://api.mapbox.com/v4/mfriesenwisc.' + cityData[city].holc_map + '/{z}/{x}/{y}.png?access_token='+mapboxgl.accessToken],
            },
            layout: { 'visibility': 'none' }
        })

        map.addSource(citylower+'-holc-shapes', {
            type: 'geojson',
            data: 'data/'+citylower+'_holc.geojson'
        });

        map.addLayer({
            'id': citylower+'-holc',
            'type': 'fill',
            'source': citylower+'-holc-shapes',
            'layout': { 'visibility': 'none' },
            'paint': {
                'fill-opacity': 0.6,
                'fill-color': [
                    'match',
                    ['get','holc_grade'],
                    'A',
                    '#66c2a5',
                    'B',
                    '#3288bd',
                    'C',
                    '#fee08b',
                    'D',
                    '#d53e4f',
                    '#ccc'
                ],
            }
        })

        map.addSource(citylower+'-demographics', {
            type: 'geojson',
            data: 'data/'+citylower+'_demo.geojson'
        });

        map.addLayer({
            'id': citylower+'-demographics',
            'type': 'fill',
            'source': citylower+'-demographics',
            'paint': {
                'fill-opacity': 0.6,
                'fill-color': [
                    'interpolate',
                    ['linear'],
                    ['/',['-',['get','TOTPOP_CY'],['get','NHSPWHT_CY']],['get','TOTPOP_CY']],
                    0,
                    '#ffffcc',
                    .25,
                    '#a1dab4',
                    .40,
                    '#41b6c4',
                    .60,
                    '#2c7fb8',
                    .80,
                    '#253494'
                ],
            }
        })

        map.addSource(citylower+'-parcels', {
            type: 'vector',
            url: mapbox_path + cityData[city].parcel_map
        })

        map.addLayer({
            'id': citylower+'-parcels',
            'type': 'fill',
            'source': citylower+'-parcels',
            'source-layer': citylower + '_parcels',
            'layout': { 'visibility': 'none'},
            'paint': {
                'fill-color': [
                    'interpolate',
                    ['linear'],
                    ['get','value'],
                    breaks[0],
                    colors[0],
                    breaks[1],
                    colors[1],
                    breaks[2],
                    colors[2],
                    breaks[3],
                    colors[3],
                    breaks[4],
                    colors[4],
                    breaks[5],
                    colors[5],
                    breaks[6],
                    colors[6],
                    breaks[7],
                    colors[7],
                ],
            }
        });

        map.addLayer({
            'id': citylower+'-parcel-borders',
            'type':'line',
            'source': citylower+'-parcels',
            'source-layer': citylower + '_parcels',
            'paint': {
                'line-color': '#999999',
                'line-width': [
                    'case',
                    ['boolean', ['feature-state','hover'], false],
                    1,
                    0
                ]
            }
        })

        map.on('click',citylower+'-parcels',function(e) {
            var p = e.features[0].properties;
            var value = p.value;
            var addr = p.siteaddr;
            var median = breaks[4];
            var pctdiff = ((value-median)/median)*100;
            var difference = "<strong>Same</strong> as the city average";
            if (pctdiff>0) {
                difference = "<strong class='above'>"+Math.abs(pctdiff).toFixed(1)+"% above</strong> the city average";
            } else if (pctdiff<0) {
                difference = "<strong class='below'>"+Math.abs(pctdiff).toFixed(1)+"% below</strong> the city average";
            }
            $(".addr").text(addr);
            $(".val").text("Value: $"+addCommas(value));
            $(".med").html(difference);
            $(".info").show();
        })


        map.on('click',citylower+'-demographics',function(e) {

//             console.log(e.features[0].properties.TOTPOP_CY/e.features[0].properties.TOTPOP_CY);
            var p = e.features[0].properties;
            var pop = p.TOTPOP_CY;
            var white = p.NHSPWHT_CY;
            var inc = p.MEDHINC_CY;
            var nw = ((pop-white)/pop)*100;
            $(".val").html("<div>Population: <strong>"+addCommas(pop)+"</strong></div><div>Non-white population: <strong>"+nw.toFixed(1)+"%</strong></div><div>Median household income: <strong>$"+addCommas(inc)+"</strong></div>");
            $(".info").show();
        });

        map.on('mouseenter', citylower+'-parcels', function() {
            map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mousemove', citylower+'-parcel-borders', function(e) {
            if (e.features.length > 0) {
                if (hoveredStateId) {
                    map.setFeatureState(
                        { source: citylower+'-parcels', id: hoveredStateId },
                        { hover: false }
                    );
                }
                hoveredStateId = e.features[0].id;
                map.setFeatureState(
                    { source: citylower+'-parcels', id: hoveredStateId },
                    { hover: true }
                );
            }
        });

        map.on('mouseleave', citylower+'-parcel-borders', function() {
            map.getCanvas().style.cursor = '';
            if (hoveredStateId) {
                map.setFeatureState(
                    { source: citylower+'-parcels', id: hoveredStateId },
                    { hover: false }
                );
            }
        });

//             make legend
        // make a pointer cursor
        map.getCanvas().style.cursor = 'default';
        var legendblock = "";
        $.each(colors, function(k,v) {
            var legend_break;
            if (k==0) {
                legend_break = "<$"+addCommas(breaks[1]);
            } else if (k==7) {
                legend_break = ">$"+addCommas(breaks[7]);
            } else {
                legend_break = "$" + addCommas(breaks[k]) + "-$" + addCommas(breaks[k+1]-1);
            }
            legendblock += "<div>"
                + "<span class='legend-key' style='background-color:"+v+"'></span>"
                + "<span class='legend-val'>"+legend_break+"</span>"
                + "</div>";
        })
        legendblock = "<div class='legend-hed'>PROPERTY VALUE KEY</div>"+legendblock+"<div class='note'>" + cityData[city].name +" median single family home value: $"+addCommas(breaks[4])+"</div>";
        $("#legend").html(legendblock).show();


        //Code for layer toggle












        // enumerate ids of the layers
        var toggleableLayerIds = [citylower+'-parcels', citylower+'-holc-map'];
        // set up the corresponding toggle button for each layer
        for (var i = 0; i < toggleableLayerIds.length; i++) {
            var id = toggleableLayerIds[i];
            var link = document.createElement('a');
            link.href = '#';
            if (id==citylower+'-parcels') {
                link.className = 'active';
                link.textContent = 'Parcels';
            }
            else if (id==citylower+'-holc-map') {
              link.textContent = 'HOLC Map';
            }

/*
            var layers = document.getElementById('menu');
            layers.appendChild(link);
*/

            link.onclick = function(e) {
                if (this.textContent == 'Parcels') {
                  var clickedLayer = citylower+'-parcels';
                }
                else if (this.textContent == 'HOLC Map') {
                  var clickedLayer = citylower+'-holc-map';
                }

                e.preventDefault();
                e.stopPropagation();

                var visibility = map.getLayoutProperty(clickedLayer, 'visibility');

                // toggle layer visibility by changing the layout object's visibility property
                if (visibility === 'visible') {
                    map.setLayoutProperty(clickedLayer, 'visibility', 'none');
                    this.className = '';
                } else {
                    this.className = 'active';
                    map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
                }
            };

        }
    }
