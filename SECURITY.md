# Security Policy

At Journify, user privacy and data security are foundational priorities. We appreciate the responsible disclosure of any security vulnerabilities.

---

## Supported Versions

Security updates and patches are actively applied to the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## Reporting a Vulnerability

If you discover a security vulnerability within Journify, please do **not** open a public issue. Instead, follow responsible disclosure practices:

1. **Email / Contact**: Submit your findings directly to the repository maintainer via the [GitHub Security Advisory](https://github.com/LikhithSP/Journify/security/advisories/new) feature.
2. **Details to Include**:
   - Description of the vulnerability.
   - Proof-of-concept code or step-by-step reproduction instructions.
   - Potential impact of the issue.
3. **Response Timeline**:
   - We strive to acknowledge vulnerability reports within **48 hours**.
   - We will provide status updates as we validate and prepare a patch.

---

## Security Architecture Highlights

- **Authentication**: Delegated securely via Supabase Auth with PKCE flow and encrypted session cookies/storage.
- **Data Access**: Enforced by strict PostgreSQL Row Level Security (RLS) policies at the database layer.
- **Client Sanitization**: HTML input sanitization (DOMPurify) preventing Cross-Site Scripting (XSS).
- **MIME & Upload Security**: Strict validation for image attachments preventing unauthorized binary execution.
- **Cryptographic Transparency**: TLS 1.3 in transit and AES-256 at rest.
