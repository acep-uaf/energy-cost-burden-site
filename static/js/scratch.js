const inputs = {
    hfoPrice: 4.40,
    cordwoodPrice: 425.00,
    naturalGasPrice: 2.29,
    pelletPrice: 350.00,
    coalPrice: 143.00,
    districtHeatPrice: 19.59,
    electricityPrice: 0.25
  };






    
  
    const annualElectricityCost = electricityPriceUserInput * 293.071;

  

  
  











document.addEventListener("DOMContentLoaded", () => {
    const csvUrl = "/data/census-tract-input-vector-minus-3.csv"; 
  
    let electricityPriceUserInput = 0.2513963

    fetch(csvUrl)
        .then(r => r.text())
        .then(text => Papa.parse(text, { header: true, skipEmptyLines: true }))
        .then(parsed => {
            let data = parsed.data;
            data = calculateAnnualannualElectricityCosts(data, electricityPriceUserInput);
            data = calculateHouseholdLevelMetrics(data);
            calculateEnergyBurden(data);
    });



// Function to streamline and safeguard division
    function safeDivide(numerator, denominator) {
        const num = parseFloat(numerator);
        const denom = parseFloat(denominator);
        return (!isNaN(num) && !isNaN(denom) && denom > 0) ? num / denom : null;
    }

// Function to streamline and safeguard multiplication
    function safeMultiply(factorA, factorB) {
        const a = parseFloat(factorA);
        const b = parseFloat(factorB);
        return (!isNaN(a) && !isNaN(b)) ? a * b : null;
    }

// Function to streamline and safeguard addition
    function safeAdd(a, b) {
        const x = parseFloat(a);
        const y = parseFloat(b);
        return (!isNaN(x) && !isNaN(y)) ? x + y : null;
      }



    function calculateAnnualSpaceHeatingCost({
        hfoPrice = 4.40,
        cordwoodPrice = 425.00,
        naturalGasPrice = 2.29,
        pelletPrice = 350.00,
        coalPrice = 143.00,
        districtHeatPrice = 19.59,
        electricityPriceUserInput
    }) {
        const fuels = {
            hfo: { price: hfoPrice, efficiency: 0.85, share: 0.73, btu_per_unit: 137400 },
            cord_wood: { price: cordwoodPrice, efficiency: 0.7, share: 0.235, btu_per_unit: 17750000 },
            natural_gas: { price: naturalGasPrice, efficiency: 0.85, share: 0.006, btu_per_unit: 101000 },
            pellet: { price: pelletPrice, efficiency: 0.85, share: 0.009, btu_per_unit: 16000000 },
            coal: { price: coalPrice, efficiency: 0.55, share: 0.005, btu_per_unit: 15200000 },
            district_heat: { price: districtHeatPrice, efficiency: 1.0, share: 0.016, btu_per_unit: 1066000 }
        };
        
        function pricePerMMBTUUseful(fuel) {
            return (1_000_000 / (fuel.btu_per_unit * fuel.efficiency)) * fuel.price;
        }
        
        let weightedSum = 0;
        for (const fuel of Object.values(fuels)) {
            weightedSum += pricePerMMBTUUseful(fuel) * fuel.share;
        }
        

        return data.map(etnry => {
            entry.AnnualSpaceHeating_cost = calculateAnnualSpaceHeatingCost(inputs)
            entry.annualElectricityCost = electricityPriceUserInput * 293.071;
        return entry;
        })
         
        }   

    
      





// Calculate AnnualSpaceHeating_cost
    //   function calculateAnnualSpaceHeating_cost(data, )
    

// Calculate AnnualElectricity_cost
    function calculateAnnualannualElectricityCosts(data, electricityPriceUserInput) {
        const kWhFromBTU = safeDivide(1000000, 3412);
        return data.map(entry => {
            entry.AnnualElectricity_cost = safeMultiply(safeMultiply(kWhFromBTU, electricityPriceUserInput), entry.AnnualElectricity_mmbtu)
        return entry;
        });
    }



// Calculate household metrics by dividing by occupied units for each tract
    function calculateHouseholdLevelMetrics(data) {
        return data.map(entry => {
            entry.AnnualElectricity_mmbtu_hh    = safeDivide(entry.AnnualElectricity_mmbtu, entry.OccupiedUnits);
            entry.AnnualElectricity_cost_hh     = safeDivide(entry.AnnualElectricity_cost, entry.OccupiedUnits);

            entry.AnnualSpaceHeating_mmbtu_hh   = safeDivide(entry.AnnualSpaceHeating_mmbtu, entry.OccupiedUnits);
            entry.AnnualSpaceHeating_cost_hh    = safeDivide(entry.AnnualSpaceHeating_cost, entry.OccupiedUnits);

            entry.AnnualEnergyUse_mmbtu_hh      = safeDivide(safeAdd(entry.AnnualSpaceHeating_mmbtu, entry.AnnualElectricity_mmbtu), entry.OccupiedUnits);
            entry.AnnualEnergyUse_cost_hh       = safeDivide(safeAdd(entry.AnnualSpaceHeating_cost, entry.AnnualElectricity_cost), entry.OccupiedUnits);

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

            console.log({
                Description: entry.Description,

                AnnualElectricity_cost: entry.AnnualElectricity_cost,

                AnnualElectricity_mmbtu_hh: entry.AnnualElectricity_mmbtu_hh,
                AnnualElectricity_cost_hh: entry.AnnualElectricity_cost_hh,

                AnnualSpaceHeating_mmbtu_hh: entry.AnnualSpaceHeating_mmbtu_hh,
                AnnualSpaceHeating_cost_hh: entry.AnnualSpaceHeating_cost_hh,

                AnnualEnergyUse_mmbtu_hh: entry.AnnualEnergyUse_mmbtu_hh,
                AnnualEnergyUse_cost_hh: entry.AnnualEnergyUse_cost_hh,

                MedianHouseholdIncome: entry.MedianHouseholdIncome,
                EnergyBurden: entry.energyBurden
              });
        });
    }

})
