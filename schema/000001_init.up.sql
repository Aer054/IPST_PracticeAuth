/*
Created: 01.07.2024
Modified: 01.07.2024
Model: Logical model
Database: PostgreSQL 12
*/

-- Create tables section -------------------------------------------------

-- Table User

CREATE TABLE "User"
(
  "username" Character varying(15) NOT NULL,
  "name" Character varying(255) NOT NULL,
  "surname" Character varying(255) NOT NULL,
  "middlename" Character varying(255),
  "email" Character varying(255) NOT NULL,
  "password" Character varying(255) NOT NULL,
  "is_confirmed" Boolean NOT NULL
)
WITH (
  autovacuum_enabled=true)
;

ALTER TABLE "User" ADD CONSTRAINT "Unique_Identifier1" PRIMARY KEY ("username")
;
