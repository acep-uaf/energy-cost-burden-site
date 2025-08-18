#!/bin/bash

psql -d routing_db -f sql/params.sql
psql -d routing_db -f sql/bbox.sql
psql -d routing_db -f sql/start_nodes.sql
psql -d routing_db -f sql/summer.sql
psql -d routing_db -f sql/winter.sql

