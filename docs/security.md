# Security & Threat Model

Journify is a private journaling platform where user reflections and intimate thoughts reside. Security and privacy are primary engineering requirements.

---

## 1. Threat Mitigation & Defensive Architecture

| Threat Vector | Mitigation Strategy |
| ------------- | -------------------- |
| **Cross-Site Scripting (XSS)** | HTML input sanitization with DOMPurify on both editor output and markdown viewers. Strips malicious tags (`<script>`, `<iframe>`, `javascript:` protocol). |
| **Unauthorized Data Access** | Database-level PostgreSQL Row Level Security (RLS). Direct API access cannot fetch records belonging to other users. |
| **Malicious File Uploads** | Strict client-side and server-side MIME type filtering. Only standard images (`image/jpeg`, `image/png`, `image/webp`) are permitted under strict byte limits. |
| **Credential Brute-Forcing** | Client-side exponential backoff rate limiting (`src/lib/security.ts`) and Supabase IP-based auth rate limiting. |
| **Man-in-the-Middle (MITM)** | Strict Transport Security (HSTS) with enforced TLS 1.3 encryption across all network transactions. |

---

## 2. Cryptographic Architecture

### In-Transit Encryption
All traffic between the Journify client, Supabase Auth, PostgreSQL, and Media Buckets is protected with TLS 1.3.

### At-Rest Encryption
- **Database Volumes**: Encrypted using transparent disk-level AES-256 in Supabase.
- **Media Storage**: AWS S3 Server-Side Encryption with AES-256 for uploaded images.
- **Client Cache**: Stored in client-controlled IndexedDB and localStorage partitions isolated by browser same-origin policies.

---

## 3. Privacy & Data Governance

- **Zero Third-Party Training**: User journal reflections are never used for machine learning model training or ad personalization.
- **Data Portability**: Users can export their complete archive in standard JSON and Markdown formats at any time from the Privacy Center (`/privacy`).
- **Complete Erasure (Right to be Forgotten)**: Permanent deletion cascades across all tables and purges local browser IndexedDB caches.
