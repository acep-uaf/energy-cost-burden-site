DROP TABLE IF EXISTS public.isochrone_eielson_winter;
CREATE TABLE public.isochrone_eielson_winter AS
WITH

    start_node_eielson AS (
        SELECT id AS start_vid
        FROM public.start_node_eielson
    ),

    points AS (
        SELECT
            dd.*,
            wv.the_geom
        FROM
            pgr_drivingDistance(
                'SELECT osm_id AS id, source, target, (cost_s / (SELECT winter_speed FROM public.params)) AS cost, (reverse_cost_s / (SELECT winter_speed FROM public.params)) AS cost FROM ways_fnsb',
                (SELECT start_vid FROM start_node_eielson),
                (SELECT seconds FROM public.params),
                false
            ) AS dd
        JOIN
            ways_vertices_pgr_fnsb AS wv
        ON
            dd.node = wv.id  
    ),

    hull AS (
        SELECT
            ST_SetSRID(ST_ConcaveHull(ST_Collect(the_geom), (SELECT edge_ratio FROM public.params)), 4326) AS isochrone_area
        FROM
            points
    )
SELECT * FROM hull;





DROP TABLE IF EXISTS public.isochrone_wainwright_winter;
CREATE TABLE public.isochrone_wainwright_winter AS
WITH

    start_node_wainwright AS (
        SELECT id AS start_vid
        FROM public.start_node_wainwright
    ),

    points AS (
        SELECT
            dd.*,
            wv.the_geom
        FROM
            pgr_drivingDistance(
                'SELECT osm_id AS id, source, target, (cost_s / (SELECT winter_speed FROM public.params)) AS cost, (reverse_cost_s / (SELECT winter_speed FROM public.params)) AS cost FROM ways_fnsb',
                (SELECT start_vid FROM start_node_wainwright),
                (SELECT seconds FROM public.params),
                false
            ) AS dd
        JOIN
            ways_vertices_pgr_fnsb AS wv
        ON
            dd.node = wv.id  
    ),

    hull AS (
        SELECT
            ST_SetSRID(ST_ConcaveHull(ST_Collect(the_geom), (SELECT edge_ratio FROM public.params)), 4326) AS isochrone_area
        FROM
            points
    )
SELECT * FROM hull;