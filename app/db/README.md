# Database Setup

SAACGAIS uses [Supabase](https://supabase.com) (hosted PostgreSQL) for data persistence.

---

## Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Project Settings → API** and note:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`
3. Open the **SQL Editor** and run the following files in order:
   - [`01_tables.sql`](./01_tables.sql) — creates the three tables
   - [`02_functions.sql`](./02_functions.sql) — creates all RPC functions

Both files are safe to re-run (`CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`).

---

## Schema Overview

| Table | Purpose |
|-------|---------|
| `Provider_Selection` | Tracks which provider a patient has selected |
| `File_Upload` | Metadata for patient file uploads — content lives in S3 |
| `Text_Upload` | Plain text entries submitted directly by patients |

All `Patient_UID` and `Provider_UID` columns store Cognito user `sub` values as `text`. Primary keys are `bigint` auto-generated identities.

---

## Data Access

Most data access goes through Supabase RPC functions. Delete operations and some lookups query tables directly using the service role key — ownership checks for these are enforced in the server layer.

### RPC Functions

| Function | Description |
|----------|-------------|
| `Get_Provider_Selection(user_id)` | Get the provider a patient has selected |
| `Insert_Provider_Selection(patient_uid, provider_uid)` | Assign a provider to a patient |
| `Delete_Provider_Selection(patient_uid)` | Remove a patient's provider selection |
| `Get_Provider_Patients(provider_uid)` | Get all patients assigned to a provider |
| `Get_File_Uploads(p_patient_uid)` | Get all file upload records for a patient |
| `Insert_File_Upload(p_file_name, p_s3_key, p_patient_uid)` | Record a new file upload |
| `Get_Text_Uploads(p_patient_uid)` | Get all text upload records for a patient |
| `Insert_Text_Upload(p_text_content, p_patient_uid)` | Record a new text upload |

All functions use `SECURITY DEFINER` — they execute with the permissions of the function owner regardless of the calling role.

### Direct Table Queries

| Operation | Table | Notes |
|-----------|-------|-------|
| Delete file upload | `File_Upload` | Also deletes the object from S3 before removing the DB record |
| Delete text upload | `Text_Upload` | |
| Lookup file by ID (owner or provider) | `File_Upload` | Used for downloads and viewing |
| Lookup file by ID (owner only) | `File_Upload` | Used for delete — restricts to patient only |
| Lookup text by ID (owner or provider) | `Text_Upload` | Used for viewing |

All data access goes through Supabase RPC functions — the server never queries tables directly.

| Function | Description |
|----------|-------------|
| `Get_Provider_Selection(user_id)` | Get the provider a patient has selected |
| `Insert_Provider_Selection(patient_uid, provider_uid)` | Assign a provider to a patient |
| `Delete_Provider_Selection(patient_uid)` | Remove a patient's provider selection |
| `Get_Provider_Patients(provider_uid)` | Get all patients assigned to a provider |
| `Get_File_Uploads(p_patient_uid)` | Get all file upload records for a patient |
| `Insert_File_Upload(p_file_name, p_s3_key, p_patient_uid)` | Record a new file upload |
| `Get_Text_Uploads(p_patient_uid)` | Get all text upload records for a patient |
| `Insert_Text_Upload(p_text_content, p_patient_uid)` | Record a new text upload |

All functions use `SECURITY DEFINER` — they execute with the permissions of the function owner regardless of the calling role.

---

## Security Notes

- The server connects using the **service role key**, which bypasses Supabase row-level security — never expose this key client-side
- File content is stored in AWS S3 — only the S3 key and filename are stored in the database
- Ownership checks (patient can only access their own records, provider can only access their assigned patients' records) are enforced in the server layer, not at the database layer