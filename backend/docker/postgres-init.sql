SELECT 'CREATE DATABASE aralytics_prod'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'aralytics_prod')\gexec
