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
fetch('data/census-estimates.geojson')
  .then(response => response.json())
  .then(geojsonData => {
    const layer = L.geoJSON(geojsonData, {
      onEachFeature: function (feature, layer) {
        if (feature.properties && feature.properties.Description) {
          layer.bindPopup(feature.properties.Description);
        }
      }
    }).addTo(map);

    map.fitBounds(layer.getBounds());
  })
  .catch(error => {
    console.error("Failed to load GeoJSON:", error);
  });


// Run setup on page load
initializeInputs();
setupSync();
displayInitialResult();