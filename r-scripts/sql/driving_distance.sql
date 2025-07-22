CREATE OR REPLACE VIEW public.driving_distance AS WITH 
    start_node AS (
        SELECT id AS start_vid
        FROM ways_vertices_pgr
        ORDER BY the_geom <-> ST_SetSRID(ST_MakePoint(-147.09262899468754, 64.67450103456017), 4326)
        LIMIT 1
    )

    SELECT *
    FROM pgr_drivingDistance(
    'SELECT osm_id AS id, source, target, cost_s AS cost, reverse_cost_s AS cost FROM ways',
    (SELECT start_vid FROM start_node),
    360,
    false
    );
