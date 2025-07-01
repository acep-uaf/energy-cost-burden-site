const NUM_SLIDERS = 7;
const slidersContainer = document.getElementById('sliders');
const outputDiv = document.getElementById('output');
let prices = new Array(NUM_SLIDERS).fill(1.0);
let csvData = [];

// Create sliders
for (let i = 0; i < NUM_SLIDERS; i++) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <label>Price ${i + 1}: <span id="val-${i}">${prices[i]}</span></label>
    <input type="range" min="0" max="10" step="0.1" value="${prices[i]}" data-index="${i}" />
  `;
  slidersContainer.appendChild(wrapper);
}

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
fetch('data/data.csv')
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
    L.geoJSON(geojsonData, {
      onEachFeature: function (feature, layer) {
        // Optional: Bind popup to show properties
        if (feature.properties && feature.properties.name) {
          layer.bindPopup(feature.properties.name);
        }
      }
    }).addTo(map);
  })
  .catch(error => {
    console.error("Failed to load GeoJSON:", error);
  });
