const sliderConfig = [
    { label: 'Price of Heating Oil (per gallon)', min: 0, max: 10, step: 0.01, default: 3.21 },
    { label: 'Price of Cordwood (cord)',        min: 0, max: 600, step: 1,   default: 450 },
    { label: 'Price of Electricity (cents/kWh)',      min: 0, max: 100,  step: 1, default: 20 }
  ];


  const slidersContainer = document.getElementById('sliders');
  const outputDiv = document.getElementById('output');
  let prices = sliderConfig.map(cfg => cfg.default);
  let csvData = [];
  
  sliderConfig.forEach((cfg, i) => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <label>${cfg.label}: <span id="val-${i}">${cfg.default}</span></label>
      <input 
        type="range" 
        min="${cfg.min}" 
        max="${cfg.max}" 
        step="${cfg.step}" 
        value="${cfg.default}" 
        data-index="${i}" />
    `;
    slidersContainer.appendChild(wrapper);
  });

// Event listeners
document.querySelectorAll('input[type="range"]').forEach(slider => {
  slider.addEventListener('input', (e) => {
    const index = parseInt(e.target.dataset.index);
    prices[index] = parseFloat(e.target.value);
    document.getElementById(`val-${index}`).textContent = prices[index];
    updateOutput();
  });
});

// Load CSV
fetch('data/census_info.csv')
  .then(response => response.text())
  .then(text => {
    csvData = text.trim().split('\n').map(row => row.split(',').map(Number));
    updateOutput();
  });

// Dummy calculation
function updateOutput() {
  if (!csvData.length) return;

  let total = 0;
  for (let row of csvData) {
    for (let i = 0; i < row.length; i++) {
      total += row[i] * (prices[i] || 1);
    }
  }

  outputDiv.textContent = `Calculated total: ${total.toFixed(2)}`;
}

// Initialize Leaflet map
const map = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Load GeoJSON and add to map
fetch('data/boroughs.geojson')
  .then(response => response.json())
  .then(geojsonData => {
    // Filter to include only the feature with fips_code '02090'
    const filteredData = {
      ...geojsonData,
      features: geojsonData.features.filter(
        feature => feature.properties.fips_code === '02090'
      )
    };

    // Create the layer separately so we can access its bounds
    const layer = L.geoJSON(filteredData, {
      onEachFeature: function (feature, layer) {
        if (feature.properties && feature.properties.name) {
          layer.bindPopup(feature.properties.name);
        }
      }
    }).addTo(map);

    // Zoom to the bounds of the feature
    map.fitBounds(layer.getBounds());
  })
  .catch(error => {
    console.error("Failed to load GeoJSON:", error);
  });