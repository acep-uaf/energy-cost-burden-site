DROP TABLE IF EXISTS public.start_node_eielson;
CREATE TABLE public.start_node_eielson AS
    SELECT *
    FROM ways_vertices_pgr 
    ORDER BY the_geom <-> ST_SetSRID(ST_MakePoint(-147.09262899468754, 64.67450103456017), 4326)
    LIMIT 1;


DROP TABLE IF EXISTS public.start_node_wainwright;
CREATE TABLE public.start_node_wainwright AS
    SELECT *
    FROM ways_vertices_pgr 
    ORDER BY the_geom <-> ST_SetSRID(ST_MakePoint(-147.64304522120645, 64.82774852372832), 4326)
    LIMIT 1;

