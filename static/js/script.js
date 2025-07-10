// Default prices from the original study
const defaultPrices = {
  hfo: 4.40,
  cord_wood: 425.00,
  natural_gas: 2.29,
  pellet: 350.00,
  coal: 143.00,
  district_heat: 19.59,
  electricity: 0.25
};

// Initialize sliders and number inputs with default values
function initializeInputs() {
  for (const fuel in defaultPrices) {
    const value = defaultPrices[fuel].toFixed(2);

    const range = document.getElementById(`${fuel}_price`);
    const input = document.getElementById(`${fuel}_input`);

    if (range && input) {
      range.value = value;
      input.value = value;
    }
  }
}

// Sync sliders and inputs both ways
function setupSync() {
  for (const fuel in defaultPrices) {
    const range = document.getElementById(`${fuel}_price`);
    const input = document.getElementById(`${fuel}_input`);

    if (range && input) {
      range.addEventListener("input", () => {
        input.value = parseFloat(range.value).toFixed(2);
      });

      input.addEventListener("input", () => {
        range.value = parseFloat(input.value).toFixed(2);
      });
    }
  }
}

function heatCostEstimate({
  hfo_price,
  cord_wood_price,
  natural_gas_price,
  pellet_price,
  coal_price,
  district_heat_price
}) {
  const fuels = {
    hfo: { price: hfo_price, efficiency: 0.85, share: 0.73, btu_per_unit: 137400 },
    cord_wood: { price: cord_wood_price, efficiency: 0.7, share: 0.235, btu_per_unit: 17750000 },
    pellet: { price: pellet_price, efficiency: 0.85, share: 0.009, btu_per_unit: 16000000 },
    natural_gas: { price: natural_gas_price, efficiency: 0.85, share: 0.006, btu_per_unit: 101000 },
    coal: { price: coal_price, efficiency: 0.55, share: 0.005, btu_per_unit: 15200000 },
    district_heat: { price: district_heat_price, efficiency: 1.0, share: 0.016, btu_per_unit: 1066000 }
  };

  function pricePerMMBTUUseful(fuel) {
    return (1_000_000 / (fuel.btu_per_unit * fuel.efficiency)) * fuel.price;
  }

  let weightedSum = 0;
  for (const fuel of Object.values(fuels)) {
    weightedSum += pricePerMMBTUUseful(fuel) * fuel.share;
  }

  return weightedSum;
}

// Handle form submission
document.getElementById("price-form").addEventListener("submit", function(event) {
  event.preventDefault();

  const inputs = {
    hfo_price: parseFloat(document.getElementById("hfo_input").value),
    cord_wood_price: parseFloat(document.getElementById("cord_wood_input").value),
    natural_gas_price: parseFloat(document.getElementById("natural_gas_input").value),
    pellet_price: parseFloat(document.getElementById("pellet_input").value),
    coal_price: parseFloat(document.getElementById("coal_input").value),
    district_heat_price: parseFloat(document.getElementById("district_heat_input").value)
  };

  const heatCost = heatCostEstimate(inputs);
  document.getElementById("result").textContent = "$" + heatCost.toFixed(2);

  const electricityPrice = parseFloat(document.getElementById("electricity_input").value);
  const electricityCost = electricityPrice * 293.071;
  document.getElementById("electricity_result").textContent = "$" + electricityCost.toFixed(2);
});

// Run the calculation once on page load using default values
function displayInitialResult() {
  const inputs = {
    hfo_price: defaultPrices.hfo,
    cord_wood_price: defaultPrices.cord_wood,
    natural_gas_price: defaultPrices.natural_gas,
    pellet_price: defaultPrices.pellet,
    coal_price: defaultPrices.coal,
    district_heat_price: defaultPrices.district_heat
  };

  const heatCost = heatCostEstimate(inputs);
  document.getElementById("result").textContent = "$" + heatCost.toFixed(2);

  const electricityCost = defaultPrices.electricity * 293.071;
  document.getElementById("electricity_result").textContent = "$" + electricityCost.toFixed(2);
}

// Reset button functionality
document.getElementById("reset-button").addEventListener("click", () => {
  initializeInputs();
  displayInitialResult();
});


// Initialize Leaflet map
const map = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Initialize Overlays and Layer Control
const overlays = {};
const layerControl = L.control.layers(null, overlays, { collapsed: false }).addTo(map);

// Defining fill colors
const nameColors = {
  "City of Fairbanks": "#1f78b4",
  "City of North Pole": "#33a02c",
  "Fort Wainwright Army Post": "#e31a1c",
  "Eielson Air Force Base": "#ff7f00"
};


// Load GeoJSON and add to map
fetch('data/census-estimates.geojson')
  .then(response => response.json())
  .then(geojsonData => {
    const layer = L.geoJSON(geojsonData, {
      style: function(feature) {
        const value = feature.properties.EnergyBurden;
        return {
          fillColor: getColor(value),
          weight: 1,
          opacity: 1,
          color: 'white',
          fillOpacity: 0.7
        };
      },
      onEachFeature: function (feature, layer) {
        const desc = feature.properties.Description || "Unknown";
        const burden = (feature.properties.EnergyBurden * 100)?.toFixed(2) || "N/A";
        layer.bindPopup(`<strong>${desc}</strong><br>Energy Burden: ${burden}%`);
      }
    }).addTo(map);

    map.fitBounds(layer.getBounds());
  })
  .catch(error => {
    console.error("Failed to load GeoJSON:", error);
  });

// Load and add Cities layer
fetch('data/cities.geojson')
  .then(response => response.json())
  .then(data => {
    const citiesLayer = L.geoJSON(data, {
      style: feature => ({
        color: "#333",
        weight: 1.5,
        dashArray: "4",
        fillColor: nameColors[feature.properties.NAME] || "#cccccc",
        fillOpacity: 0.5
      }),
      onEachFeature: (feature, layer) => {
        if (feature.properties && feature.properties.NAME) {
          layer.bindPopup(`<strong>${feature.properties.NAME}</strong>`);
        }
      }
    });
    // citiesLayer.addTo(map); // uncomment to display layer by default
    overlays["Cities"] = citiesLayer;
    layerControl.addOverlay(citiesLayer, "Cities");
  });

// Load and add Military Boundaries layer
fetch('data/military-boundaries.geojson')
  .then(response => response.json())
  .then(data => {
    const militaryLayer = L.geoJSON(data, {
      style: feature => ({
        color: "#333",
        weight: 1.5,
        dashArray: "4",
        fillColor: nameColors[feature.properties.NAME] || "#cccccc",
        fillOpacity: 0.5
      }),
      onEachFeature: (feature, layer) => {
        if (feature.properties && feature.properties.NAME) {
          layer.bindPopup(`<strong>${feature.properties.NAME}</strong>`);
        }
      }
    });
    // militaryLayer.addTo(map); // uncomment to display layer by default
    overlays["Military Boundaries"] = militaryLayer;
    layerControl.addOverlay(militaryLayer, "Military Boundaries");
  });

// Functions for creating the legend for the energy cost burden layer
function getColor(d) {
  return d > 0.15 ? '#800026' :
         d > 0.12 ? '#BD0026' :
         d > 0.10 ? '#E31A1C' :
         d > 0.08  ? '#FC4E2A' :
         d > 0.06  ? '#FD8D3C' :
         d > 0.04  ? '#FEB24C' :
         d > 0.02  ? '#FED976' :
                  '#FFEDA0';
}

const legend = L.control({ position: 'bottomright' });

legend.onAdd = function (map) {
  const div = L.DomUtil.create('div', 'info legend');
  const grades = [0.00, 0.02, 0.04, 0.06, 0.08, 0.10, 0.12, 0.15];

  div.innerHTML += '<h4>Estimated Energy Burden</h4>';

  for (let i = 0; i < grades.length; i++) {
    const from = grades[i];
    const to = grades[i + 1];

    div.innerHTML +=
      `<div><span class="legend-color" style="background:${getColor(from + 0.0001)}"></span> ` +
      `${(from * 100).toFixed(0)}%${to ? `–${(to * 100).toFixed(0)}%` : ''}</div>`;
  }

  return div;
};

legend.addTo(map);


// Run setup on page load
initializeInputs();
setupSync();
displayInitialResult();