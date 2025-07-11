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
        runEnergyCalculations(results);
      })
      .catch(error => console.error("Error loading CSV:", error));
  });




  function runEnergyCalculations(data) {
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





  