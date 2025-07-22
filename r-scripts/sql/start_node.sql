CREATE OR REPLACE VIEW public.start_node AS
    SELECT *
    FROM ways_vertices_pgr 
    ORDER BY the_geom <-> ST_SetSRID(ST_MakePoint(-147.09262899468754, 64.67450103456017), 4326)
    LIMIT 1;
