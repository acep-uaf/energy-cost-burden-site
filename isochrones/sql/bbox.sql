-- DROP TABLE IF EXISTS public.bbox;
-- CREATE TABLE public.bbox AS 
-- WITH 

--     enveloped AS (
--         SELECT
--             ST_Envelope(wkb_geometry) AS bbox_minimal
--         FROM public.fnsb
--     ),

--     buffered AS (
--         SELECT 
--             ST_Buffer(bbox_minimal, 1.2) AS bbox
--         FROM enveloped
--     )

--     SELECT bbox 
--     FROM buffered
-- ;

DROP TABLE IF EXISTS public.ways_fnsb;
CREATE TABLE public.ways_fnsb AS
    SELECT * 
    FROM ways
    WHERE ST_Intersects(ways.the_geom, (SELECT wkb_geometry FROM public.bbox LIMIT 1));


DROP TABLE IF EXISTS public.ways_vertices_pgr_fnsb;
CREATE TABLE public.ways_vertices_pgr_fnsb AS 
    SELECT * 
    FROM ways_vertices_pgr
    WHERE ST_Intersects(ways_vertices_pgr.the_geom, (SELECT wkb_geometry FROM public.bbox LIMIT 1));