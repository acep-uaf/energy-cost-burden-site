#!/bin/bash

for tbl in isochrone_eielson_summer isochrone_eielson_winter isochrone_wainwright_summer isochrone_wainwright_winter; do
  ogr2ogr -f GeoJSON ../static/data/${tbl}.geojson \
    PG:"dbname=routing_db user=dev host=localhost" \
    public.$tbl
done