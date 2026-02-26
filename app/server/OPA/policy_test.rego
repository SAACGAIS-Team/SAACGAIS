package saacgais.authz

default allow := false
default reason := "not_allowed"

# Always return a reason the server can interpret
reason := "ok" { allow }

roles := {r | r := input.identity.roles[_]}

# Admin wildcard
allow {
  "Administrator" in roles
}

# Clinician permissions (minimal set)
allow {
  "Clinician" in roles
  input.resource == "users"
  input.action == "read"
}

allow {
  "Clinician" in roles
  input.resource == "provider_selection"
  input.action in {"read", "write"}
}

allow {
  "Clinician" in roles
  input.resource == "ai_agent"
  input.action == "invoke"
}

# Patient permissions (minimal set)
allow {
  "Patient" in roles
  input.resource == "ai_agent"
  input.action == "invoke"
}

# Patient may read provider selection only if it's theirs (uses target for ownership checks)
allow {
  "Patient" in roles
  input.resource == "provider_selection"
  input.action == "read"
  input.target.owner_sub == input.identity.sub
}