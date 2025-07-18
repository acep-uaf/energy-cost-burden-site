document.addEventListener("DOMContentLoaded", async () => {
  // === 1. DOM & Data Setup ===
  const censusTractCsvUrl = "/data/census-tract-input-vector-minus-4.csv";
  const censusTractGeoJsonUrl = "/data/census-estimates-minus-1.geojson";
  let rawData = [];
  let mapLayer;

  const defaultPrices = {
    electricity: 0.25,
    hfo: 4.40, 
    cord_wood: 425, 
    natural_gas: 2.29,
    pellet: 350, 
    coal: 143, 
    district_heat: 19.59
  };

  // Initialize map
  const map = L.map('map').setView([0, 0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

  // Load CSV + GeoJSON
  const [censusTractCsvText, censusTractGeoJson] = await Promise.all([
    fetch(censusTractCsvUrl).then(res => res.text()),
    fetch(censusTractGeoJsonUrl).then(res => res.json())
  ]);

  // Parse CSV
  const parsed = Papa.parse(censusTractCsvText, { header: true, skipEmptyLines: true });
  rawData = parsed.data;

  // Map TractLong → geometry
  const geoByTractLong = {};
  censusTractGeoJson.features.forEach(f => geoByTractLong[f.properties.TractLong] = f.geometry);
  rawData.forEach(entry => entry.geometry = geoByTractLong[entry.TractLong]);


  // === Add Legend Control ===
  const legend = L.control({ position: 'bottomright' });

  legend.onAdd = function (map) {
    const div = L.DomUtil.create('div', 'info legend');
    const grades = [0.00, 0.02, 0.04, 0.06, 0.08, 0.10, 0.12, 0.15];
  
    div.innerHTML += '<h4>Estimated Energy Burden</h4>';
  
    for (let i = 0; i < grades.length; i++) {
      const from = grades[i];
      const to = grades[i + 1];
  
      div.innerHTML +=
        `<div><span class="legend-color" style="background:${getColor((from + 0.0001) * 100)}"></span> ` +
        `${(from * 100).toFixed(0)}%${to ? `–${(to * 100).toFixed(0)}%` : '+'}</div>`;
    }
  
    return div;
  };

  legend.addTo(map);


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

  // Load and add Cities layer
  fetch('/data/cities.geojson')
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
    overlays["Cities"] = citiesLayer;
    layerControl.addOverlay(citiesLayer, "Cities");
    // citiesLayer.addTo(map); // optionally show by default
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
    
    // Add "Additional Layers" title above the overlays list
    setTimeout(() => {
      const overlaysList = document.querySelector('.leaflet-control-layers-overlays');
      if (overlaysList) {
        const title = document.createElement('div');
        title.textContent = 'Additional Layers';
        title.style.fontWeight = 'bold';
        title.style.fontSize = '16px';
        title.style.padding = '4px 8px';
        title.style.background = '#fff';
        title.style.borderBottom = '1px solid #ccc';
        overlaysList.parentNode.insertBefore(title, overlaysList);
      }
    }, 0);
  });

  // Setup UI
  initializeInputs();
  setupSync();

  // Initial render
  runCalculationAndRender();

  // === 2. Event Listeners ===
  document.getElementById("price-form")
    .addEventListener("input", debounce(runCalculationAndRender, 300));

  document.getElementById("reset-button")
    .addEventListener("click", () => {
      initializeInputs();
      runCalculationAndRender();
    });

  // === 3. Core Render Function ===
  function runCalculationAndRender() {
    const prices = getUserPrices();
    const dataWithResults = processData(rawData, prices);

    console.log("🔎 Example result:", dataWithResults?.[0]);

    updateSidebar(dataWithResults);
    renderMapLayer(dataWithResults);
  }

  function renderMapLayer(data) {
    const features = data.map(entry => ({
      type: "Feature",
      properties: entry,
      geometry: entry.geometry
    }));

    if (!mapLayer) {
      mapLayer = L.geoJSON(features, {
        style: styleFeature,
        onEachFeature: popupForFeature
      }).addTo(map);
      map.fitBounds(mapLayer.getBounds());
    } else {
      mapLayer.eachLayer(layer => {
        layer.feature = features.find(f => f.properties.TractLong === layer.feature.properties.TractLong);
        const props = layer.feature.properties;
        layer.setStyle({ fillColor: getColor(props.energyBurden) });
        layer.setPopupContent(popupContent(props));
      });
    }
  }

  function styleFeature({ properties }) {
    return {
      fillColor: getColor(properties.energyBurden),
      weight: 1,
      color: 'white',
      fillOpacity: 0.7
    };
  }

  function popupForFeature(feature, layer) {
    layer.bindPopup(popupContent(feature.properties));
  }

  function popupContent(props) {
    const burden = props.energyBurden?.toFixed(2) + "%" || "N/A";
    return `<strong>${props.Description}</strong><br>Energy Burden: ${burden}`;
  }

  // === 4. Data + Calculation ===
  function getUserPrices() {
    return {
      electricity: parseFloat(document.getElementById("electricity_input").value),
      hfo: parseFloat(document.getElementById("hfo_input").value),
      cord_wood: parseFloat(document.getElementById("cord_wood_input").value),
      natural_gas: parseFloat(document.getElementById("natural_gas_input").value),
      pellet: parseFloat(document.getElementById("pellet_input").value),
      coal: parseFloat(document.getElementById("coal_input").value),
      district_heat: parseFloat(document.getElementById("district_heat_input").value)
    };
  }

  function processData(data, prices) {
    const kWhFromBTU = safeDivide(1_000_000, 3412);
    const fuels = {
      hfo: { price: prices.hfo, efficiency: 0.85, share: 0.73, btu_per_unit: 137400 },
      cord_wood: { price: prices.cord_wood, efficiency: 0.7, share: 0.235, btu_per_unit: 17750000 },
      natural_gas: { price: prices.natural_gas, efficiency: 0.85, share: 0.006, btu_per_unit: 101000 },
      pellet: { price: prices.pellet, efficiency: 0.85, share: 0.009, btu_per_unit: 16000000 },
      coal: { price: prices.coal, efficiency: 0.55, share: 0.005, btu_per_unit: 15200000 },
      district_heat: { price: prices.district_heat, efficiency: 1.0, share: 0.016, btu_per_unit: 1066000 }
    };

    function pricePerMMBTU(fuel) {
      return (1_000_000 / (fuel.btu_per_unit * fuel.efficiency)) * fuel.price;
    }
    const heatCostMMBTU = Object.values(fuels).reduce((s, f) => s + pricePerMMBTU(f)*f.share, 0);

    return data.map(entry => {
      entry.AnnualElectricity_cost = safeMultiply(safeMultiply(kWhFromBTU, prices.electricity), entry.AnnualElectricity_mmbtu);
      entry.AnnualSpaceHeating_cost = safeMultiply(entry.AnnualSpaceHeating_mmbtu, heatCostMMBTU);
      entry.AnnualElectricity_cost_hh = safeDivide(entry.AnnualElectricity_cost, entry.OccupiedUnits);
      entry.AnnualSpaceHeating_cost_hh = safeDivide(entry.AnnualSpaceHeating_cost, entry.OccupiedUnits);
      entry.AnnualEnergyUse_cost_hh = safeAdd(entry.AnnualElectricity_cost_hh, entry.AnnualSpaceHeating_cost_hh);
      entry.energyBurden = safeMultiply(safeDivide(entry.AnnualEnergyUse_cost_hh, entry.MedianHouseholdIncome), 100);
      return entry;
    });

    
  }

  // === 5. Sidebar ===
  function updateSidebar(data) {
    if (!Array.isArray(data) || data.length === 0) {
      console.warn("updateSidebar skipped — data is empty or invalid", data);
      return;
    }
    
    // Make sure all key numbers are parsed
    const parsedData = data.map(d => ({
      ...d,
      AnnualSpaceHeating_cost: parseFloat(d.AnnualSpaceHeating_cost),
      AnnualSpaceHeating_mmbtu: parseFloat(d.AnnualSpaceHeating_mmbtu),
      AnnualElectricity_cost: parseFloat(d.AnnualElectricity_cost),
      AnnualElectricity_mmbtu: parseFloat(d.AnnualElectricity_mmbtu),
    }));
  
    // === Totals ===
    const totalSpaceHeatingCost = parsedData.reduce((sum, d) => sum + (d.AnnualSpaceHeating_cost || 0), 0);
    const totalSpaceHeatingMMBTU = parsedData.reduce((sum, d) => sum + (d.AnnualSpaceHeating_mmbtu || 0), 0);
    const avgHeatingCost = safeDivide(totalSpaceHeatingCost, totalSpaceHeatingMMBTU);
  
    const totalElectricityCost = parsedData.reduce((sum, d) => sum + (d.AnnualElectricity_cost || 0), 0);
    const totalElectricityMMBTU = parsedData.reduce((sum, d) => sum + (d.AnnualElectricity_mmbtu || 0), 0);
    const avgElectricityCost = safeDivide(totalElectricityCost, totalElectricityMMBTU);
  
    // === Output ===
    document.getElementById("weighted_average_space_heating_cost").textContent =
      avgHeatingCost != null ? `$${avgHeatingCost.toFixed(2)}` : "N/A";
  
    document.getElementById("average_electricity_cost").textContent =
      avgElectricityCost != null ? `$${avgElectricityCost.toFixed(2)}` : "N/A";
  
    // === Debugging Logs ===
    // console.log("Space Heating: cost =", totalSpaceHeatingCost, "mmbtu =", totalSpaceHeatingMMBTU);
    // console.log("Electricity: cost =", totalElectricityCost, "mmbtu =", totalElectricityMMBTU);
    // console.log("Averages:", { avgHeatingCost, avgElectricityCost });
  }

  // === 6. Utilities ===
  function safeDivide(a, b) {
    const x = parseFloat(a), y = parseFloat(b);
    return (!isNaN(x) && !isNaN(y) && y > 0) ? x / y : null;
  }
  function safeMultiply(a, b) {
    const x = parseFloat(a), y = parseFloat(b);
    return (!isNaN(x) && !isNaN(y)) ? x * y : null;
  }
  function safeAdd(a, b) {
    const x = parseFloat(a), y = parseFloat(b);
    return (!isNaN(x) && !isNaN(y)) ? x + y : null;
  }
  function debounce(fn, ms) {
    let id;
    return (...args) => {
      clearTimeout(id);
      id = setTimeout(() => fn(...args), ms);
    };
  }

  function getColor(d) {
    return d > 15 ? '#800026' :
           d > 12 ? '#BD0026' :
           d > 10 ? '#E31A1C' :
           d > 8  ? '#FC4E2A' :
           d > 6  ? '#FD8D3C' :
           d > 4  ? '#FEB24C' :
           d > 2  ? '#FED976' :
                    '#FFEDA0';
  }

  // === 7. Initialize inputs + sliders ===

  function initializeInputs() {
    for (const key in defaultPrices) {
      const r = document.getElementById(`${key}_price`);
      const i = document.getElementById(`${key}_input`);
      if (r) r.value = defaultPrices[key].toFixed(2);
      if (i) i.value = defaultPrices[key].toFixed(2);
    }
  }

  function setupSync() {
    for (const key in defaultPrices) {
      const r = document.getElementById(`${key}_price`);
      const i = document.getElementById(`${key}_input`);
      if (!r || !i) continue;
  
      // Slider changes → update input AND trigger calculation
      r.addEventListener("input", () => {
        i.value = parseFloat(r.value).toFixed(2);
        runCalculationAndRender(); // trigger directly
      });
  
      // Input changes → update slider (but don't re-trigger input)
      i.addEventListener("input", () => {
        r.value = parseFloat(i.value).toFixed(2);
        runCalculationAndRender(); // trigger directly
      });
    }
  }
});