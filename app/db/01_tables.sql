-- SAACGAIS Database Setup
-- Step 1: Tables
-- Run this in the Supabase SQL Editor before 02_functions.sql

CREATE TABLE IF NOT EXISTS "Provider_Selection" (
  "Provider_Selection_ID" bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "Patient_UID"           text NOT NULL,
  "Provider_UID"          text NOT NULL,
  "Selection_Time"        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "File_Upload" (
  "File_Upload_ID" bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "File_Name"      text NOT NULL,
  "S3_Key"         text NOT NULL,
  "Patient_UID"    text NOT NULL,
  "Upload_Time"    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Text_Upload" (
  "Text_Upload_ID" bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "Text_Content"   text NOT NULL,
  "Patient_UID"    text NOT NULL,
  "Upload_Time"    timestamptz DEFAULT now()
);