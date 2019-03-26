function createStyle(pov) {
    return {
        color: getColor(pov),
        weight: 5,
        fillOpacity: 1
    };
}

function getColor(pov) {
    if (0.1 <= pov && pov <= 0.25) {
        return "#f0dbea";
    } else if (0.26 <= pov && pov <= 0.5) {
        return "#c78cbe";
    } else if (0.51 <= pov && pov <= 0.75) {
        return "#a654a0";
    } else if (0.76 <= pov && pov <= 1.0) {
        return "#9a3f98";
    } else {
        return "#ffffff";
    }
}

function getData() {
    return $.ajax({
        url: "GeoJSON/Niagara_Falls_GeoJSON.geojson",
        type: "GET"
    });
}

function handleData(data) {
    L.geoJSON(data, {
        style: function(feature) {
            features.push(feature);
            var pov = feature.properties.InNrPov11;
            return createStyle(pov);
        },
        onEachFeature: function(feature, layer) {
            features.push(feature);
            layers.push(layer);
        },
        coordsToLatLng: function(coord) {
            return new L.LatLng(coord[1], coord[0]);
        }
    }).addTo(map);
}

function getPovAttribute(feature, value) {
    var pov = 0;
    switch (value) {
        case "2011.00":
            pov = feature.properties.InNrPov11;
            break;
        case "2012.00":
            pov = feature.properties.InNrPov12;
            break;
        case "2013.00":
            pov = feature.properties.InNrPov13;
            break;
        case "2014.00":
            pov = feature.properties.InNrPov14;
            break;
        case "2015.00":
            pov = feature.properties.InNrPov15;
            break;
        case "2016.00":
            pov = feature.properties.InNrPov16;
            break;
        case "2017.00":
            pov = feature.properties.InNrPov17;
            break;
    }
    return pov;
}

function createLegend(map) {
    var div = L.DomUtil.create("div", "info legend"),
        grades = [0.1, 0.25, 0.5, 0.75],
        percentage = ["10%", "25%", "26%", "50%", "51", "75%", "76%", "100%"];
    labels = [];

    // loop through our density intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' +
            getColor(grades[i]) +
            '"></i> ' +
            percentage[2 * i] +
            ("&ndash;" + percentage[2 * i + 1] + "<br>");
    }
    div.innerHTML +=
        "<i style='color: black; width: 100px; font-size: 10px;'>Source: lorem ipsum</i>";
    return div;
}
