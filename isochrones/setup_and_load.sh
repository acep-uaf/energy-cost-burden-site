createdb routing_db
psql routing_db -c "CREATE EXTENSION postgis;"
psql routing_db -c "CREATE EXTENSION pgrouting;"
psql routing_db -c "CREATE EXTENSION hstore;"

mkdir data/

curl -o data/mapconfig.xml https://raw.githubusercontent.com/pgRouting/osm2pgrouting/master/mapconfig.xml 

wget -P data -O data/alaska.osm.pbf https://download.geofabrik.de/north-america/us/alaska-latest.osm.pbf

osmium fileinfo data/alaska.osm.pbf
osmium cat data/alaska.osm.pbf -o data/alaska.osm

osm2pgrouting --f data/alaska.osm --conf data/mapconfig.xml --dbname routing_db --username dev --clean 

ogr2ogr -f "PostgreSQL" PG:"dbname=routing_db user=dev" ../static/data/fnsb.geojson -nln fnsb
ogr2ogr -f "PostgreSQL" PG:"dbname=routing_db user=dev" ../static/data/fnsb-tracts.geojson -nln fnsb_tracts
ogr2ogr -f "PostgreSQL" PG:"dbname=routing_db user=dev" data/bbox.geojson -nln bbox