# OPA Authorization Documentation (SAACGAIS)

## Overview

This system uses **Open Policy Agent (OPA)** to decide whether a user is allowed to perform a specific action on a protected resource.

OPA acts as a centralized authorization layer that evaluates requests **before** the backend performs any sensitive operation such as:

* Accessing the database (Supabase RPC)
* Invoking the AI Agent (AWS Bedrock)
* Reading or modifying user/provider data
* Managing user roles

If OPA denies access, the backend returns **HTTP 403 Forbidden** and the operation is not executed.

---

## Why Use OPA?

OPA separates:

* **Authentication** (Who is the user?)
* **Authorization** (What is the user allowed to do?)

This ensures that access control decisions are made consistently across all protected API endpoints and are not embedded directly inside route logic.

---

## Request Flow

Every protected request follows this pipeline:

```
Client Request (JWT)
        ↓
Verify JWT (AWS Cognito)
        ↓
req.user = { sub, roles }
        ↓
Authorization Context Builder (authzMiddleware)
        ↓
Send to OPA: { identity, action, resource, target }
        ↓
OPA evaluates policy
        ↓
OPA returns: { allow, reason }
        ↓
If allow = true → Execute route handler
If allow = false → Return 403 Forbidden
```

OPA must be called before any request that interacts with protected resources.

---

## Protected Boundaries

OPA is enforced for routes that interact with:

| Route                        | Purpose                  |
| ---------------------------- | ------------------------ |
| POST /api/ai/upload          | Invoke AI Agent          |
| POST /api/user-roles         | Modify user roles        |
| GET /api/search-users        | Read user data           |
| GET /api/provider/selection  | Read provider assignment |
| POST /api/provider/selection | Assign provider          |
| Future DB Routes             | Access stored records    |

---

## Security Model

Authorization decisions are based on three elements:

### 1. Roles (from Cognito Groups)

* Patient
* Clinician
* Administrator

### 2. Resources

Protected system entities:

* ai_agent
* users
* roles
* provider_selection
* files
* cases

### 3. Actions

Types of operations:

* invoke
* read
* write
* delete
* upload
* manage_roles

Authorization Logic:

```
Role × Resource × Action → Allow or Deny
```

---

## Example Policy Matrix

| Role          | Resource | Action       | Allowed |
| ------------- | -------- | ------------ | ------- |
| Patient       | ai_agent | invoke       | Yes     |
| Patient       | roles    | manage_roles | No      |
| Administrator | roles    | manage_roles | Yes     |
| Clinician     | users    | read         | Yes     |

OPA evaluates requests using this logic.

---

## Standard OPA Output Format

Allowed:

```
{ "allow": true, "reason": "ok" }
```

Denied:

```
{ "allow": false, "reason": "not_allowed" }
```

---

## JWT Verification (Authentication)

The backend must verify JWTs issued by AWS Cognito on every request.

Middleware responsibilities:

1. Read token from header:

   ```
   Authorization: Bearer <token>
   ```
2. Verify signature using Cognito public keys
3. Validate:

   * Token is not expired
   * Token issuer matches expected User Pool
   * Payload has not been modified
4. Extract trusted claims:

   * user ID (`sub`)
   * roles/groups (`cognito:groups`)
5. Store identity on request:

   ```js
   req.user = {
     sub: "user123",
     roles: ["Patient"]
   }
   ```

---

## Do Not Trust Client-Supplied Identity

The backend must never accept identity fields from:

* Request body (e.g., `userId`)
* Query parameters (e.g., `?user=`)

These can be modified by the client and are not secure.

Always derive identity from:

```
req.user.sub
```

This prevents IDOR (Insecure Direct Object Reference) attacks when accessing Supabase RPC endpoints.

---

## OPA Input Contract

All protected routes must send the same JSON format to OPA:

```json
{
  "identity": { "sub": "user123", "roles": ["Patient"] },
  "action": "invoke",
  "resource": "ai_agent",
  "target": {}
}
```

Field Definitions:

* `identity.sub` → User ID from verified JWT
* `identity.roles` → Cognito groups from JWT
* `action` → Operation being performed
* `resource` → Protected entity
* `target` → The specific resource instance being accessed (e.g., patient record, provider selection, uploaded file). It is used by OPA to perform **ownership-based authorization checks** by comparing the requested resource identifier with the authenticated user's identity (`req.user.sub`). Because `target` is derived from request input (such as route params or body fields), it is considered **untrusted** and must only be used for comparison against trusted JWT claims.

### Trust Model

| Field    | Source        | Trusted?    |
| -------- | ------------- | ----------- |
| identity | JWT           | ✅ Trusted   |
| roles    | JWT           | ✅ Trusted   |
| action   | Backend Route | ✅ Trusted   |
| resource | Backend Route | ✅ Trusted   |
| target   | Request Input | ❌ Untrusted |

OPA policies should use `target` for ownership validation (e.g., `identity.sub == target.patientId`) rather than treating it as identity.

---

## Route Integration Example

```js
router.get(
  "/provider/selection",
  verifyJwt,
  authzMiddleware("read", "provider_selection"),
  async (req, res) => {
    const userId = req.user.sub;
    // Perform Supabase RPC
  }
);
```

OPA evaluates access before executing the sensitive operation.

---

## Summary

* Authentication is handled by AWS Cognito JWT
* Authorization decisions are handled by OPA
* Backend derives user identity from verified token
* Client-supplied identity is never trusted
* All protected actions are evaluated against policy before execution
