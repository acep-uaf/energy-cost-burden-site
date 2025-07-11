library(tidyverse)

census_tract_input_vector <- read_csv('static/data/census-tract-input-vector.csv')

census_tract_input_vector_minus_1 <- select(census_tract_input_vector, !ends_with('_hh'))
write_csv(census_tract_input_vector_minus_1, 'static/data/census-tract-input-vector-minus-1.csv')
