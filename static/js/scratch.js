document.addEventListener("DOMContentLoaded", () => {
    const csvUrl = "/data/census-tract-input-vector-minus-1.csv"; 
  
    fetch(csvUrl)
        .then(response => response.text())
        .then(csvText => {
            const parsed = Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true
            });
  
            const results = parsed.data;
            const enrichedData = calculateHouseholdLevelMetrics(results);
            calculateEnergyBurden(enrichedData);
        })
        .catch(error => console.error("Error loading CSV:", error));
    });

// Lots of division in this script, streamline and safeguard
    function safeDivide(numerator, denominator) {
        const num = parseFloat(numerator);
        const denom = parseFloat(denominator);
        return (!isNaN(num) && !isNaN(denom) && denom > 0) ? num / denom : null;
    }


// Calculate household metrics by dividing by occupied units for each tract
    function calculateHouseholdLevelMetrics(data) {
        return data.map(entry => {
            entry.AnnualSpaceHeating_mmbtu_hh   = safeDivide(entry.AnnualSpaceHeating_mmbtu, entry.OccupiedUnits);
            entry.AnnualElectricity_mmbtu_hh    = safeDivide(entry.AnnualElectricity_mmbtu, entry.OccupiedUnits);
            entry.AnnualEnergyUse_mmbtu_hh      = safeDivide(entry.AnnualEnergyUse_mmbtu, entry.OccupiedUnits);

            entry.AnnualSpaceHeating_cost_hh    = safeDivide(entry.AnnualSpaceHeating_cost, entry.OccupiedUnits);
            entry.AnnualElectricity_cost_hh     = safeDivide(entry.AnnualElectricity_cost, entry.OccupiedUnits);
            entry.AnnualEnergyUse_cost_hh       = safeDivide(entry.AnnualEnergyUse_cost, entry.OccupiedUnits);

            return entry;
        });
    }


// Calculate energy burden and print to console
    function calculateEnergyBurden(data) {
        data.forEach(entry => {
            entry.energyBurden = safeDivide(entry.AnnualEnergyUse_cost_hh, entry.MedianHouseholdIncome) * 100;
      
            if (entry.energyBurden != null) {
                console.log(`${entry.Description} has a ${entry.energyBurden.toFixed(2)}% energy burden`);
            } else {
                console.warn(`Could not calculate energy burden for ${entry.Description}`);
            }
        });
    }
