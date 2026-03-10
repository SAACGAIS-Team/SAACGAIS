# ============================================================
# SAACGAIS Healthcare Authorization Policy
# Package: saacgais.authz
# Engine:  Open Policy Agent (OPA)
# Version: 1.0.0
#
# Input shape (provided by authzContext.js middleware):
# {
#   "identity": {
#     "sub":   "<cognito user sub>",
#     "roles": ["Clinician" | "Patient" | "Administrator"]
#   },
#   "action":   "read" | "write" | "invoke" | "delete",
#   "resource": "ai_agent" | "patient_record" | "users" |
#               "provider_selection" | "audit_log",
#   "target": {                   # optional, set by getTarget()
#     "owner_sub":    "<sub of record owner>",
#     "patient_sub":  "<sub of patient in context>",
#     "session_id":   "<active session id>"
#   }
# }
#
# Output consumed by authorize.js:
#   /v1/data/saacgais/authz/allow  → true | false
#   /v1/data/saacgais/authz/reason → "ok" | denial reason string
# ============================================================

package saacgais.authz

import future.keywords.in

# -----------------------------------------------------------
# Defaults — deny everything unless an allow rule fires
# -----------------------------------------------------------
default allow := false
default reason := "access_denied"

# -----------------------------------------------------------
# Convenience: derive a set of roles from the input array
# -----------------------------------------------------------
roles := {r | r := input.identity.roles[_]}

# -----------------------------------------------------------
# Reason helpers — server can log/return these to the client
# -----------------------------------------------------------
reason := "ok" {
  allow
}

reason := "missing_identity" {
  not input.identity
}

reason := "no_roles_assigned" {
  input.identity
  count(roles) == 0
}

reason := "role_insufficient_for_resource" {
  input.identity
  count(roles) > 0
  not allow
  not unknown_resource
}

reason := "unknown_resource" {
  unknown_resource
}

unknown_resource {
  not input.resource in {
    "ai_agent",
    "patient_record",
    "users",
    "provider_selection",
    "audit_log"
  }
}

# -----------------------------------------------------------
# ADMINISTRATOR — full access to all resources and actions
# -----------------------------------------------------------
allow {
  "Administrator" in roles
}

# -----------------------------------------------------------
# CLINICIAN rules
# -----------------------------------------------------------

# Clinicians can read any user profile (e.g. lookup patient info)
allow {
  "Clinician" in roles
  input.resource == "users"
  input.action == "read"
}

# Clinicians can read and write provider selections
allow {
  "Clinician" in roles
  input.resource == "provider_selection"
  input.action in {"read", "write"}
}

# Clinicians can invoke the AI agent (gates AWS Bedrock call)
# Requires a patient_sub in target so the session has clinical context
allow {
  "Clinician" in roles
  input.resource == "ai_agent"
  input.action == "invoke"
  input.target.patient_sub != ""
}

# Clinicians can read patient records
allow {
  "Clinician" in roles
  input.resource == "patient_record"
  input.action == "read"
}

# Clinicians can write (update) patient records
allow {
  "Clinician" in roles
  input.resource == "patient_record"
  input.action == "write"
}

# Clinicians can read the audit log
allow {
  "Clinician" in roles
  input.resource == "audit_log"
  input.action == "read"
}

# -----------------------------------------------------------
# PATIENT rules
# -----------------------------------------------------------

# Patients can invoke the AI agent for their own session only
# target.owner_sub must match their own identity sub
allow {
  "Patient" in roles
  input.resource == "ai_agent"
  input.action == "invoke"
  input.target.owner_sub == input.identity.sub
}

# Patients can read their own record only
allow {
  "Patient" in roles
  input.resource == "patient_record"
  input.action == "read"
  input.target.owner_sub == input.identity.sub
}

# Patients can read their own provider selection only
allow {
  "Patient" in roles
  input.resource == "provider_selection"
  input.action == "read"
  input.target.owner_sub == input.identity.sub
}

# Patients can update their own provider selection
allow {
  "Patient" in roles
  input.resource == "provider_selection"
  input.action == "write"
  input.target.owner_sub == input.identity.sub
}
