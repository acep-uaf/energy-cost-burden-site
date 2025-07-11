library(tidyverse)

census_tract_input_vector <- read_csv('static/data/census-tract-input-vector.csv')

census_tract_input_vector_minus_1 <- select(census_tract_input_vector, !c(fid, Tract, TotalHousingUnits, EnergyBurden))
write_csv(census_tract_input_vector_minus_1, 'static/data/census-tract-input-vector-minus-1.csv')



census_tract_input_vector_minus_2 <- select(census_tract_input_vector_minus_1, !ends_with('_hh'))
write_csv(census_tract_input_vector_minus_2, 'static/data/census-tract-input-vector-minus-2.csv')


census_tract_input_vector_minus_3 <- select(census_tract_input_vector_minus_2, !c(AnnualElectricity_cost))
write_csv(census_tract_input_vector_minus_3, 'static/data/census-tract-input-vector-minus-3.csv')


debug <- select(census_tract_input_vector, 
  c(Description,
    AnnualElectricity_cost,

    AnnualElectricity_mmbtu_hh,
    AnnualElectricity_cost_hh,

    AnnualSpaceHeating_mmbtu_hh,
    AnnualSpaceHeating_cost_hh,

    AnnualEnergyUse_mmbtu_hh,
    AnnualEnergyUse_cost_hh,

    MedianHouseholdIncome,
    EnergyBurden))

write_csv(debug, 'static/data/debug.csv')
