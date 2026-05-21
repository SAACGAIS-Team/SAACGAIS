-- SAACGAIS Database Setup
-- Step 2: RPC Functions
-- Run this in the Supabase SQL Editor after 01_tables.sql
-- All Patient_UID and Provider_UID values are Cognito user sub strings


-- ============================================================
-- Provider Selection
-- ============================================================

CREATE OR REPLACE FUNCTION "Get_Provider_Selection"(user_id text)
RETURNS json AS $$
  SELECT row_to_json(ps)
  FROM "Provider_Selection" ps
  WHERE ps."Patient_UID" = user_id
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION "Insert_Provider_Selection"(patient_uid text, provider_uid text)
RETURNS void AS $$
  INSERT INTO "Provider_Selection" ("Patient_UID", "Provider_UID")
  VALUES (patient_uid, provider_uid);
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION "Delete_Provider_Selection"(patient_uid text)
RETURNS void AS $$
  DELETE FROM "Provider_Selection"
  WHERE "Patient_UID" = patient_uid;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION "Get_Provider_Patients"(provider_uid text)
RETURNS TABLE("Patient_UID" text) AS $$
  SELECT "Patient_UID"
  FROM "Provider_Selection"
  WHERE "Provider_UID" = provider_uid;
$$ LANGUAGE sql SECURITY DEFINER;


-- ============================================================
-- File Uploads
-- ============================================================

CREATE OR REPLACE FUNCTION "Get_File_Uploads"(p_patient_uid text)
RETURNS TABLE(
  "File_Upload_ID"  bigint,
  "File_Name"       text,
  "S3_Key"          text,
  "Patient_UID"     text,
  "Upload_Time"     timestamptz
) AS $$
  BEGIN
    RETURN QUERY
    SELECT
      fu."File_Upload_ID",
      fu."File_Name",
      fu."S3_Key",
      fu."Patient_UID",
      fu."Upload_Time"
    FROM "File_Upload" fu
    WHERE fu."Patient_UID" = p_patient_uid
    ORDER BY fu."Upload_Time" DESC;
  END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION "Insert_File_Upload"(
  p_file_name   text,
  p_s3_key      text,
  p_patient_uid text
)
RETURNS void AS $$
  INSERT INTO "File_Upload" ("File_Name", "S3_Key", "Patient_UID")
  VALUES (p_file_name, p_s3_key, p_patient_uid);
$$ LANGUAGE sql SECURITY DEFINER;


-- ============================================================
-- Text Uploads
-- ============================================================

CREATE OR REPLACE FUNCTION "Get_Text_Uploads"(p_patient_uid text)
RETURNS TABLE(
  "Text_Upload_ID"  bigint,
  "Text_Content"    text,
  "Upload_Time"     timestamptz
) AS $$
  BEGIN
    RETURN QUERY
    SELECT
      tu."Text_Upload_ID",
      tu."Text_Content",
      tu."Upload_Time"
    FROM "Text_Upload" tu
    WHERE tu."Patient_UID" = p_patient_uid
    ORDER BY tu."Upload_Time" DESC;
  END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION "Insert_Text_Upload"(
  p_text_content  text,
  p_patient_uid   text
)
RETURNS void AS $$
  INSERT INTO "Text_Upload" ("Text_Content", "Patient_UID")
  VALUES (p_text_content, p_patient_uid);
$$ LANGUAGE sql SECURITY DEFINER;