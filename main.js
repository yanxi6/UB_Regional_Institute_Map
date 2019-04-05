var layers = [];
var polyFeatures = [];
var secFeatures = [];
var boundFeatures = [];
var neiFeatures = [];
var roadFeatures = [];
var stateRoute = {};
var interState = {};
var USRoute = {};

var myStyle = {
    color: "#ffffff",
    weight: 3
};

var myStyle2 = {
    color: "#838789",
    weight: 3
};

function mouseDown() {
    map.dragging.disable();
}
function mouseUp() {
    map.dragging.enable();
}

function createStyle(pov) {
    return {
        color: getColor(pov),
        weight: 0.2,
        fillOpacity: 0.7
    };
}

function getColor(pov) {
    if (0 <= pov && pov <= 0.25) {
        return "#f0dbea";
    } else if (0.25 < pov && pov <= 0.5) {
        return "#c78cbe";
    } else if (0.5 < pov && pov <= 0.75) {
        return "#a654a0";
    } else if (0.75 < pov && pov <= 1.0) {
        return "#9a3f98";
    }
}

function getData(url, type) {
    $.getJSON(url, function(result) {
        if (type == 1) polyFeatures = result;
        if (type == 2) secFeatures = result;
        if (type == 3) boundFeatures = result;
        if (type == 4) neiFeatures = result;
        if (type == 5) roadFeatures = result;
    });
}

function getSVG(url, type) {
    $.get(
        url,
        function(svg) {
            if (type == 1) stateRoute = svg;
            if (type == 2) interState = svg;
            if (type == 3) USRoute = svg;
        },
        "text"
    );
}

function handlePolygonData(data) {
    return L.geoJSON(data, {
        style: function(feature) {
            var pov = feature.properties.InNrPov17;
            return createStyle(pov);
        },
        onEachFeature: function(feature, layer) {
            layers.push(layer);
        },
        coordsToLatLng: function(coord) {
            return new L.LatLng(coord[1], coord[0]);
        }
    });
}

function handlePolylineData(data, style) {
    return L.geoJSON(data, {
        style: style,
        onEachFeature: function(feature, layer) {
            layers.push(layer);
        }
    });
}

function svgStyle(svgString, textString) {
    var position = svgString.length - 7;
    var b = textString;
    var newS = svgString.substr(0, position) + b + svgString.substr(position);
    return newS;
}

function handleRoadData(data, style) {
    return L.geoJSON(data, {
        style: style,
        onEachFeature: function(feature, layer) {
            var box = layer.getBounds();
            var coorArr = feature.geometry.coordinates;
            var len = coorArr.length;
            var total = 0;
            var coor = [];
            for (var i = 0; i < len; i++) {
                total += coorArr[i].length;
            }
            total = parseInt(total / 2);
            for (var i = 0; i < len; i++) {
                var tmpLen = coorArr[i].length;
                if (total > tmpLen) {
                    total -= tmpLen;
                } else {
                    coor = {
                        lat: coorArr[i][tmpLen - total][1],
                        lng: coorArr[i][tmpLen - total][0]
                    };
                    break;
                }
            }

            if (feature.properties.SymbolType === "Street Name") {
                L.marker(coor, { icon: new L.icon({ iconUrl: "null" }) })
                    .bindTooltip(feature.properties.NameLabel, {
                        permanent: true,
                        direction: "center",
                        className: "road-labels"
                    })
                    .addTo(map);
            } else {
                var routeUrl = "data:image/svg+xml;base64,";

                if (feature.properties.SymbolType === "State Route") {
                    var textString;
                    if (feature.properties.NameLabel.length <= 2) {
                        textString =
                            "<text x='60' y='100' style='font-size: 90px;'>" +
                            feature.properties.NameLabel +
                            "</text>";
                    } else {
                        textString =
                            "<text x='50' y='100' style='font-size: 80px;'>" +
                            feature.properties.NameLabel +
                            "</text>";
                    }
                    routeUrl += btoa(svgStyle(stateRoute, textString));
                } else if (feature.properties.SymbolType === "Interstate") {
                    var textString;
                    if (feature.properties.NameLabel.length <= 2) {
                        textString =
                            "<text x='65' y='150' style='font-size: 90px; fill: white;'>" +
                            feature.properties.NameLabel +
                            "</text>";
                    } else {
                        textString =
                            "<text x='50' y='150' style='font-size: 90px; fill: white;'>" +
                            feature.properties.NameLabel +
                            "</text>";
                    }

                    routeUrl += btoa(svgStyle(interState, textString));
                } else if (feature.properties.SymbolType === "US Route") {
                    var textString;
                    if (feature.properties.NameLabel.length <= 2) {
                        textString =
                            "<text x='55' y='130' style='font-size: 90px;'>" +
                            feature.properties.NameLabel +
                            "</text>";
                    } else {
                        textString =
                            "<text x='50' y='130' style='font-size: 75px;'>" +
                            feature.properties.NameLabel +
                            "</text>";
                    }

                    routeUrl += btoa(svgStyle(USRoute, textString));
                }

                var routeIcon = L.icon({
                    iconUrl: routeUrl,
                    iconSize: [36, 36],
                    iconAnchor: [18, 18],
                    popupAnchor: [0, -18],
                    labelAnchor: [14, 0] // as I want the label to appear 2px past the icon (18 + 2 - 6)
                });
                label = String(feature.properties.NameLabel);
                L.marker(layer.getBounds().getCenter(), {
                    icon: routeIcon
                }).addTo(map);
            }
        }
    });
}

function handleNeiData(data) {
    return L.geoJSON(data, {
        pointToLayer: function(feature, latlng) {
            label = String(feature.properties.Neighborhd); // Must convert to string, .bindTooltip can't use straight 'feature.properties.attribute'
            return new L.circleMarker(latlng, { radius: 0, weight: 0 })
                .bindTooltip(label, {
                    permanent: true,
                    direction: "center",
                    className: "my-labels"
                })
                .openTooltip();
        }
    });
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
    var div = L.DomUtil.create("ul", "info legend"),
        grades = [0.1, 0.26, 0.51, 0.76],
        percentage = ["0%", "25%", "25%", "50%", "50%", "75%", "75%", "100%"];
    labels = [];
    div.innerHTML += "<h5>Population In or Near porverty</h5>";

    // loop through our density intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<li><i style="background:' +
            getColor(grades[i]) +
            '"></i> ' +
            percentage[2 * i] +
            ("&ndash;" + percentage[2 * i + 1] + "</li>");
    }

    div.innerHTML +=
        "<p style='color: black; font-size: 10px;'>Source: US Census, American Community Survey, 5-year estimates</p>";
    return div;
}
