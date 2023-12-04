// Constants
const TILE_LAYER_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const EARTHQUAKE_API_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson';
const MAP_CENTER = [37.09, -95.71];
const MAP_ZOOM = 5;

let map; // Declare map globally

// Function to scale magnitude to radius for circle markers
const getRadius = magnitude => magnitude * 10000; // Example scaling factor

// Function to determine circle color based on earthquake depth
const getDepth = depth => depth > 40 ? '#a50f15' : depth > 20 ? '#de2d26' : depth > 10 ? '#fb6a4a' : depth > 5 ? '#FFD580' : depth > -10 ? '#90EE90' : '#AAFF00';

// Function to create and add the map
function createMap(earthquakeLayer) {
    let background = L.tileLayer(TILE_LAYER_URL, { attribution: '&copy; OpenStreetMap contributors' });
    let baseMaps = { "Background": background };
    let overlayMaps = { "Earthquakes": earthquakeLayer };

    map = L.map("map", { center: MAP_CENTER, zoom: MAP_ZOOM, layers: [background, earthquakeLayer] });
    L.control.layers(baseMaps, overlayMaps, { collapsed: false }).addTo(map);
    addLegend(map);
}

// Function to create earthquake markers
function createMarkers(response) {
    let earthquakeMarkers = response.features.map(feature => {
        let [lng, lat, depth] = feature.geometry.coordinates;
        return L.circle([lat, lng], { 
            radius: getRadius(feature.properties.mag), 
            fillColor: getDepth(depth), 
            fillOpacity: 0.6,
            color: 'none'
        }).bindPopup(`Magnitude: ${feature.properties.mag}<br>Depth: ${depth} km<br>Location: ${feature.properties.place}`);
    });
    createMap(L.layerGroup(earthquakeMarkers));
}

// Function to add a color legend to the map
function addLegend(map) {
    let legend = L.control({ position: 'bottomright' });
    legend.onAdd = function () {
        let div = L.DomUtil.create('div', 'info legend');
        div.style = 'background: white; padding: 10px; border: 1px solid #ccc; border-radius: 5px;';
        let depthRanges = [-10, 5, 10, 20, 40];
        let labels = depthRanges.map((from, i) => {
            let to = depthRanges[i + 1];
            return `<i style="background:${getDepth(from + 1)}; width: 18px; height: 18px; float: left; margin-right: 5px; opacity: 0.9;"></i> ${from}${to ? '&ndash;' + to : '+'} km`;
        });
        div.innerHTML = labels.join('<br style="clear: both;">');
        return div;
    };
    legend.addTo(map);
}

// API call to get earthquake information and create markers
d3.json(EARTHQUAKE_API_URL)
  .then(createMarkers)
  .catch(error => console.error('Error fetching earthquake data:', error));