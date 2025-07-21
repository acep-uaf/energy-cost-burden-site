# by default, R allocates only 512MB of memory for Java processes, which is not enough for large queries using r5r. 
# To increase available memory to 2GB, for example, we need to set the java.parameters option at the beginning of the script
options(java.parameters = "-Xmx2G")


library(osmextract)
library(sf)
library(rJavaEnv)
library(r5r)


# Set up for download
data_path <- "./r-scripts/data"
dir.create(data_path, recursive = TRUE, showWarnings = FALSE)

# Load the FNSB geojson, pull bounding box
fnsb_tracts <- st_read(dsn = 'static/data/census-estimates.geojson')
bbox <- st_bbox(fnsb_tracts)

# Download lines withing bounding box
# Save to disk
fnsb_lines <- oe_get(
  place = 'us/alaska', 
  download_directory = data_path, 
  boundary = bbox)


nrow(fnsb_lines)
head(fnsb_lines)


# Plot FNSB lines to check
par(mar = rep(0, 4))
plot(st_geometry(fnsb_lines))
