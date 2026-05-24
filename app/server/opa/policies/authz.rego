package authz

import rego.v1

# Deny by default — HIPAA §164.312(a)(1)
default allow := false

# =============================================================
# PATIENT ACTIONS
# =============================================================

# AI self-query on own records
allow if {
	"Patient" in input.identity.roles
	input.action == "ai_query_patient"
	input.target.patientUid == input.identity.sub
}

# Upload records (own records only)
allow if {
	"Patient" in input.identity.roles
	input.action == "upload_record"
	input.target.patientUid == input.identity.sub
}

# List own records
allow if {
	"Patient" in input.identity.roles
	input.action == "list_own_records"
	input.target.patientUid == input.identity.sub
}

# Read or download records — app-level ownership check enforces exact record access
allow if {
	"Patient" in input.identity.roles
	input.action in {"read_record", "download_record"}
}

# Delete own records — app-level check enforces Patient_UID match
allow if {
	"Patient" in input.identity.roles
	input.action == "delete_record"
}

# Manage provider relationship
allow if {
	"Patient" in input.identity.roles
	input.action in {
		"read_provider_selection",
		"select_provider",
		"deselect_provider",
	}
}

# =============================================================
# HEALTHCARE-PROVIDER ACTIONS
# =============================================================

# AI query on patient records — HIPAA §164.514(d) minimum necessary:
#   requires a non-empty clinical purpose and caps at 10 patients per request
allow if {
	"Healthcare-Provider" in input.identity.roles
	input.action == "ai_query_provider"
	count(input.target.patientIds) > 0
	count(input.target.patientIds) <= 10
	count(input.target.query) > 0
}

# Read or download patient records — provider-patient consent enforced app-side
allow if {
	"Healthcare-Provider" in input.identity.roles
	input.action in {"read_record", "download_record"}
}

# List own assigned patients
allow if {
	"Healthcare-Provider" in input.identity.roles
	input.action == "list_patients"
}

# =============================================================
# ADMINISTRATOR ACTIONS — role management only, no PHI access
# =============================================================

allow if {
	"Administrator" in input.identity.roles
	input.action in {
		"read_roles",
		"assign_role",
		"search_users",
	}
}

# Admins can read any user's roles
allow if {
	"Administrator" in input.identity.roles
	input.action == "read_user_roles"
}

# =============================================================
# ANY AUTHENTICATED USER
# =============================================================

# List Cognito role groups (group names/descriptions, not PHI)
allow if {
	count(input.identity.roles) > 0
	input.action == "read_roles"
}

# Read own roles (needed for profile/change-role flows)
allow if {
	count(input.identity.roles) > 0
	input.action == "read_user_roles"
	input.target.userId == input.identity.sub
}

# Search user directory (used by patients selecting a provider)
allow if {
	count(input.identity.roles) > 0
	input.action == "search_users"
}

# Update own account settings
allow if {
	count(input.identity.roles) > 0
	input.action in {"update_own_settings", "update_own_password"}
	input.target.userId == input.identity.sub
}
