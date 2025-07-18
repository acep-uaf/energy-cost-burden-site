document.addEventListener("DOMContentLoaded", async () => {
    const censusTractCsvUrl = "/data/census-tract-input-vector.csv";
    const censusTractGeoJsonUrl = "/data/census-estimates.geojson";
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
  
    const nameColors = {
      "City of Fairbanks": "#1f78b4",
      "City of North Pole": "#33a02c",
      "Fort Wainwright Army Post": "#e31a1c",
      "Eielson Air Force Base": "#ff7f00"
    };
  
    const map = L.map('map');
    const overlays = {};
    const layerControl = L.control.layers(null, overlays, { collapsed: false }).addTo(map);
  
    await loadData();
    setupMap();
    addLegend();
    await loadOverlays();
    initializeInputs();
    setupSync();
    setupEventListeners();
    runCalculationAndRender();
  
    async function loadData() {
      const [censusTractCsvText, censusTractGeoJson] = await Promise.all([
        fetch(censusTractCsvUrl).then(res => res.text()),
        fetch(censusTractGeoJsonUrl).then(res => res.json())
      ]);
  
      const parsed = Papa.parse(censusTractCsvText, { header: true, skipEmptyLines: true });
      rawData = parsed.data;
  
      const geoByTractLong = {};
      censusTractGeoJson.features.forEach(f => geoByTractLong[f.properties.TractLong] = f.geometry);
      rawData.forEach(entry => entry.geometry = geoByTractLong[entry.TractLong]);
    }
  
    function setupMap() {
      map.setView([0, 0], 2);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    }
  
    function addLegend() {
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
    }
  
    async function loadOverlays() {
      const citiesData = await fetch('/data/cities.geojson').then(res => res.json());
      const citiesLayer = createGeoJsonOverlay(citiesData);
      overlays["Cities"] = citiesLayer;
      layerControl.addOverlay(citiesLayer, "Cities");
  
      const militaryData = await fetch('data/military-boundaries.geojson').then(res => res.json());
      const militaryLayer = createGeoJsonOverlay(militaryData);
      overlays["Military Boundaries"] = militaryLayer;
      layerControl.addOverlay(militaryLayer, "Military Boundaries");
  
      setTimeout(addOverlayHeader, 0);
    }
  
    function createGeoJsonOverlay(data) {
      return L.geoJSON(data, {
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
    }
  
    function addOverlayHeader() {
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
    }
  
    function setupEventListeners() {
      document.getElementById("price-form")
        .addEventListener("input", debounce(runCalculationAndRender, 300));
  
      document.getElementById("reset-button")
        .addEventListener("click", () => {
            initializeInputs();
            runCalculationAndRender();
        });

        
      document.getElementById("download-csv")
        .addEventListener("click", (e) => {
            const prices = getUserPrices();
            const csvRows = [["Fuel", "Price"]];

            for (const key in prices) {
                csvRows.push([key, prices[key]]);
            }

            const csvContent = csvRows.map(row => row.join(",")).join("\n");

            console.log(csvContent)

            const blob = new Blob([csvContent], { type: "text/csv" });
            const url = URL.createObjectURL(blob);

            const link = e.currentTarget;
            link.href = url;

            // Optional: Clean up object URL after download
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        });
    }
  
    function runCalculationAndRender() {
      const prices = getUserPrices();
      const dataWithResults = processData(rawData, prices);
  
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
          layer.setStyle({ fillColor: getColor(props.EnergyBurden) });
          layer.setPopupContent(popupContent(props));
        });
      }
    }
  
    function styleFeature({ properties }) {
      return {
        fillColor: getColor(properties.EnergyBurden),
        weight: 1,
        color: 'white',
        fillOpacity: 0.7
      };
    }
  
    function popupForFeature(feature, layer) {
      layer.bindPopup(popupContent(feature.properties));
    }
  
    function popupContent(props) {
      const burden = props.EnergyBurden?.toFixed(2) + "%" || "N/A";
      return `<strong>${props.Description}</strong><br>Energy Burden: ${burden}`;
    }
  
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
  
      const heatCostMMBTU = Object.values(fuels).reduce((s, f) => s + pricePerMMBTU(f) * f.share, 0);
  
      return data.map(entry => {
        entry.AnnualElectricityCost = safeMultiply(safeMultiply(kWhFromBTU, prices.electricity), entry.AnnualElectricityMmbtu);
        entry.AnnualSpaceHeatingCost = safeMultiply(entry.AnnualSpaceHeatingMmbtu, heatCostMMBTU);
        entry.AnnualElectricityCostHh = safeDivide(entry.AnnualElectricityCost, entry.OccupiedUnits);
        entry.AnnualSpaceHeatingCostHh = safeDivide(entry.AnnualSpaceHeatingCost, entry.OccupiedUnits);
        entry.AnnualEnergyUseCostHh = safeAdd(entry.AnnualElectricityCostHh, entry.AnnualSpaceHeatingCostHh);
        entry.EnergyBurden = safeMultiply(safeDivide(entry.AnnualEnergyUseCostHh, entry.MedianHouseholdIncome), 100);
        return entry;
      });
    }
  
    function updateSidebar(data) {
      if (!Array.isArray(data) || data.length === 0) return;
  
      const parsedData = data.map(d => ({
        ...d,
        AnnualSpaceHeatingCost: parseFloat(d.AnnualSpaceHeatingCost),
        AnnualSpaceHeatingMmbtu: parseFloat(d.AnnualSpaceHeatingMmbtu),
        AnnualElectricityCost: parseFloat(d.AnnualElectricityCost),
        AnnualElectricityMmbtu: parseFloat(d.AnnualElectricityMmbtu),
      }));
  
      const AnnualSpaceHeatingCost = parsedData.reduce((sum, d) => sum + (d.AnnualSpaceHeatingCost || 0), 0);
      const AnnualSpaceHeatingMmbtu = parsedData.reduce((sum, d) => sum + (d.AnnualSpaceHeatingMmbtu || 0), 0);
      const AverageAnnualSpaceHeatingCost = safeDivide(AnnualSpaceHeatingCost, AnnualSpaceHeatingMmbtu);
  
      const AnnualElectricityCost = parsedData.reduce((sum, d) => sum + (d.AnnualElectricityCost || 0), 0);
      const AnnualElectricityMmbtu = parsedData.reduce((sum, d) => sum + (d.AnnualElectricityMmbtu || 0), 0);
      const AverageAnnualElectricityCost = safeDivide(AnnualElectricityCost, AnnualElectricityMmbtu);
  
      document.getElementById("weighted_average_space_heating_cost").textContent =
        AverageAnnualSpaceHeatingCost != null ? `$${AverageAnnualSpaceHeatingCost.toFixed(2)}` : "N/A";
  
      document.getElementById("average_electricity_cost").textContent =
        AverageAnnualElectricityCost != null ? `$${AverageAnnualElectricityCost.toFixed(2)}` : "N/A";
    }
  
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
  
        r.addEventListener("input", () => {
          i.value = parseFloat(r.value).toFixed(2);
          runCalculationAndRender();
        });
  
        i.addEventListener("input", () => {
          r.value = parseFloat(i.value).toFixed(2);
          runCalculationAndRender();
        });
      }
    }
  
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
  });
  