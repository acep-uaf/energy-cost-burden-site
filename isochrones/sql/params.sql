CREATE OR REPLACE VIEW public.params AS
SELECT
    3600::NUMERIC AS seconds,
    0.1::NUMERIC AS edge_ratio,
    0.7::NUMERIC AS winter_speed;