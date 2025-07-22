#!/bin/bash

psql -d routing_db -f sql/start_node.sql
psql -d routing_db -f sql/driving_distance.sql
psql -d routing_db -f sql/ways_debug.sql