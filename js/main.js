function addCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function resetSwitcher() {
    $(".redline-layers .btn").removeClass("active");
    $(".redline-layers .btn.parcels").addClass("active");
}

function clearInfo() {
    $(".addr,.val,.med").html("");
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

    map.addControl(geocoder,'top-left');

    var nav = new mapboxgl.NavigationControl({showCompass:false});
    map.addControl(nav,'top-left');
    var hoveredStateId = null;

    var drop = document.getElementById("change_city");
    drop.addEventListener("change", makeCity);

    $(".info").on("click",function() {
        $(this).hide();
    })

    $(".dropdown-item.city").click(function() {
        var city = $(this).html();
        console.log(city);
        $('#dropdownMenuButton').text($(this).text());
        makeCity(city);
    });

    map.on('load',function() {
    })

    function makeCity(city, event) {
        resetSwitcher();
        $('.info').hide();
        // var city = $('dropdown-item.c');
        var citylower = city.toLowerCase();
        var breaks = cityData[city].breaks;
        geocoder.setPlaceholder('Search '+city+' addresses');
        map.fitBounds(cityData[city].bbox, {padding: {top: 100, bottom: 100, left: 150, right: 5} });
        map.addLayer({
            'id': citylower+'-holc-map',
            'type': 'raster',
            'source': {
                'type': 'raster',
                'tiles': ['https://api.mapbox.com/v4/mfriesenwisc.' + cityData[city].holc_map + '/{z}/{x}/{y}.png?access_token='+mapboxgl.accessToken],
            },
            'layout': { 'visibility': 'none' }
        })

        map.addSource(citylower+'-holc-shapes', {
            'type': 'geojson',
            'data': 'data/'+citylower+'_holc.geojson'
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
            'layout': { 'visibility': 'none' },
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
            'layout': { 'visibility': 'visible'},
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
            clearInfo();
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
            clearInfo();

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
        legendblock = "<div class='legend_parcels'><div class='legend-hed'>PROPERTY VALUE KEY</div>"+legendblock+"<div class='note'>" + cityData[city].name +" median single family home value: $"+addCommas(breaks[4])+"</div></div>";

        legendblock += "<div class='legend_demographics'><div class='legend-hed'>NON-WHITE POPULATION</div>"
        +        "<div class='legend-scale'>"
        +            "<ul class='YlGnBu legend-labels'>"
        +                "<li>"
        +                    "<span class='q0-5'></span>"
        +                "</li>"
        +                "<li>"
        +                    "<span class='q1-5'></span>"
        +                "</li>"
        +                "<li>"
        +                    "<span class='q2-5'></span>"
        +                "</li>"
        +                "<li>"
        +                    "<span class='q3-5'></span>"
        +                "</li>"
        +                "<li>"
        +                    "<span class='q4-5'></span>"
        +                "</li>"
        +            "</ul>"
        +            "<ul class='legend-labels tick-values'>"
        +                "<li style='width:10%'></li>"
        +                "<li>25%</li>"
        +                "<li>40%</li>"
        +                "<li>60%</li>"
        +                "<li>80%</li>"
        +            "</ul>"
        +        "</div>"
        +   "</div>";


        
        $("#legend").html(legendblock);
        $("#legend").show();



        //Code for layer toggle
        $(".redline-layers").show();
        $(".btn").on("click",function() {
            var thisLayer = $(this).data("layer");
            if ((thisLayer=='demographics')||(thisLayer=='parcels')) {
                $("#legend,.legend_"+thisLayer).show();
            }
            var clickedLayer = citylower+"-"+thisLayer;
            $(".btn."+thisLayer).toggleClass("active");
            var visibility = map.getLayoutProperty(clickedLayer,'visibility');
            if (visibility === 'visible') {
                $(".btn."+thisLayer).removeClass("active");
                map.setLayoutProperty(clickedLayer, 'visibility', 'none');
            } else {
                $(".btn."+thisLayer).addClass("active");
                map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
            }
 
            if ($(".btn.parcels").hasClass("active")) {
                $(".legend_parcels").show();
            } else {
                $(".legend_parcels").hide();
            }
            if ($(".btn.demographics").hasClass("active")) {
                $(".legend_demographics").show();
            } else {
                $(".legend_demographics").hide();
            }
            if ((!$(".btn.parcels").hasClass("active")) && (!$(".btn.demographics").hasClass("active"))) {
                $("#legend").hide();
            }
            
            
        })


    }
