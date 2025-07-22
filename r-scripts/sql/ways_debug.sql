CREATE OR REPLACE VIEW ways_debug AS 
    SELECT * 
    FROM ways;

UPDATE ways_debug
SET reverse_cost_s = 
  CASE
    WHEN reverse_cost_s <= 0 THEN length / NULLIF(COALESCE(maxspeed_backward, 50), 0) * 3.6
    ELSE reverse_cost_s
  END;