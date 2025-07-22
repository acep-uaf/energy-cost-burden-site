# by default, R allocates only 512MB of memory for Java processes, which is not enough for large queries using r5r. 
# To increase available memory to 2GB, for example, we need to set the java.parameters option at the beginning of the script
options(java.parameters = "-Xmx2G")


library(osmextract)
library(sf)
library(rJavaEnv)
library(r5r)

rJavaEnv::java_quick_install(version = 21)
rJavaEnv::java_check_version_rjava()




########### Get lines ############

# Set up for download
data_path <- "./r-scripts/data"
dir.create(data_path, recursive = TRUE, showWarnings = FALSE)

# Load the FNSB geojson, pull bounding box
fnsb_tracts <- st_read(dsn = 'static/data/fnsb-tracts.geojson')
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



######### Crop PBF file #############
# Our bounding box limited the data returned, but not the bounding box
# So our PBF file has a bounding box of the state of AK, throwing an error for r5r (too big)
# Have to crop the bounding box manually
fnsb_union <- st_union(fnsb_tracts)
st_write(fnsb_union, "static/data/fnsb.geojson", delete_dsn = TRUE)



# Bash block to run osmium and crop to the FNSB bounding box
if (Sys.which("osmium") == "") {
  stop("Osmium is not installed or not on your system PATH.")
}

cmd <- paste(
  "osmium extract",
  "-p", "static/data/fnsb.geojson",
  "-o", "r-scripts/data/fnsb.osm.pbf",
  "r-scripts/data/geofabrik_alaska-latest.osm.pbf"
)
system(cmd)

# Delete AK-wide files, otherwise throws error 'layer exceeds limit of 975000 km2' in next step
file.remove("r-scripts/data/geofabrik_alaska-latest.osm.pbf")
file.remove("r-scripts/data/geofabrik_alaska-latest.gpkg")





######### Calculate Isochrones ###########


# Point towards data
r5r_core <- setup_r5("./r-scripts/data")





