// Load and parse CSV using PapaParse
document.addEventListener("DOMContentLoaded", () => {
    const csvUrl = "/data/census-tract-input-vector.csv"; // relative to Hugo's "static" dir
  
    fetch(csvUrl)
      .then(response => response.text())
      .then(csvText => {
        const parsed = Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true
        });
  
        const results = parsed.data;
        calculateAnnualEnergyUse_cost_hh(results);
        calculateEnergyBurden(results);
      })
      .catch(error => console.error("Error loading CSV:", error));
  });



  function calculateAnnualEnergyUse_cost_hh(data) {
    data.forEach(entry => {
      const AnnualEnergyUse_cost = parseFloat(entry.AnnualEnergyUse_cost)
      const OccupiedUnits = parseFloat(entry.OccupiedUnits)

      if (!isNaN(AnnualEnergyUse_cost) && !isNaN(OccupiedUnits) && OccupiedUnits > 0) {
        const AnnualEnergyUse_cost_hh = (AnnualEnergyUse_cost / OccupiedUnits);

        entry.AnnualEnergyUse_cost_hh = AnnualEnergyUse_cost_hh;

        console.log(`${entry.Description} has a ${AnnualEnergyUse_cost_hh.toFixed(2)} annual energy use cost per household`);
      } else {
        console.warn("Invalid data for tract:", entry);
      }
    })
  }




// energyBurden = AnnualEnergyUse_cost_hh / MedianHouseholdIncome
  function calculateEnergyBurden(data) {
    data.forEach(entry => {
      const MedianHouseholdIncome = parseFloat(entry.MedianHouseholdIncome);
      const AnnualEnergyUse_cost_hh = parseFloat(entry.AnnualEnergyUse_cost_hh);
  
      if (!isNaN(MedianHouseholdIncome) && !isNaN(AnnualEnergyUse_cost_hh) && MedianHouseholdIncome > 0) {
        const energyBurden = (AnnualEnergyUse_cost_hh / MedianHouseholdIncome) * 100;
        console.log(`${entry.Description} has a ${energyBurden.toFixed(2)}% energy burden`);
      } else {
        console.warn("Invalid data for tract:", entry);
      }
    });
  }
