/**
 * Privacy, Consent & Retention Policy Specifications
 * Truthful cryptographic transparency:
 * - Documents exactly what is encrypted, algorithms used, key locations, and storage scope
 */

export interface ConsentSettings {
  essentialStorage: boolean;      // Required for app functionality (always true)
  cloudSync: boolean;              // Syncing to Supabase database
  localVoiceProcessing: boolean;   // In-browser SpeechRecognition
  telemetryAndDiagnostics: boolean;// Anonymous error tracking (opt-in)
  marketingEmails: boolean;        // Product updates (opt-in)
}

export interface DataRetentionPolicy {
  journalEntries: string;
  mediaAttachments: string;
  deletedItems: string;
  accountWipe: string;
  localIndexedDB: string;
}

export const PRIVACY_SPECIFICATIONS = {
  version: '2026.1-strict',
  lastUpdated: 'September 2026',
  encryptionDetails: [
    {
      domain: 'In-Transit Encryption',
      status: 'Enforced',
      protocol: 'TLS 1.3 / HTTPS',
      cipher: 'ECDHE-RSA-AES128-GCM-SHA256 & modern suites',
      scope: 'All API interactions between browser, Supabase, and edge endpoints.',
      keysHeldBy: 'Managed cloud CA / modern TLS handshake',
    },
    {
      domain: 'At-Rest Database Encryption',
      status: 'Enforced',
      protocol: 'AES-256 (PostgreSQL transparent data encryption)',
      cipher: 'AES-256-GCM',
      scope: 'All journal entries, profile metadata, folder hierarchies, and database tables hosted on Supabase.',
      keysHeldBy: 'Encrypted storage volume managed by AWS/Supabase KMS',
    },
    {
      domain: 'Media & File Attachment Storage',
      status: 'Enforced',
      protocol: 'AWS S3 Server-Side Encryption (SSE-S3 / SSE-KMS)',
      cipher: 'AES-256',
      scope: 'All uploaded images, photo attachments, and user avatars.',
      keysHeldBy: 'Supabase Storage KMS',
    },
    {
      domain: 'Local Browser IndexedDB',
      status: 'Sandboxed Client Storage',
      protocol: 'Browser Origin Isolation & OS Full Disk Encryption (BitLocker / FileVault)',
      cipher: 'OS Filesystem AES-XTS-256',
      scope: 'Offline cached entries and drafts stored under your user profile sandbox.',
      keysHeldBy: 'User device security enclave / login credentials',
    },
    {
      domain: 'End-to-End Encryption (E2EE) Status',
      status: 'Transparent Disclosure',
      protocol: 'Not Claimed (Cloud Sync Model)',
      cipher: 'N/A',
      scope: 'Journify utilizes standard TLS 1.3 in-transit and AES-256 at-rest database storage with strict PostgreSQL Row Level Security (RLS). We do NOT falsely advertise zero-knowledge E2EE without client-derived key architecture.',
      keysHeldBy: 'Server-side key infrastructure',
    },
  ],

  retentionPolicy: {
    journalEntries: 'Retained until user explicitly deletes an entry or deletes the account.',
    mediaAttachments: 'Purged from cloud storage immediately upon entry deletion.',
    deletedItems: 'Immediate row deletion via RLS (no shadow retention or sellable archiving).',
    accountWipe: 'Immediate cascading delete of all user rows, files, and credentials.',
    localIndexedDB: 'Cleared upon logging out or clicking "Purge Local Storage".',
  },

  defaultConsent: {
    essentialStorage: true,
    cloudSync: true,
    localVoiceProcessing: true,
    telemetryAndDiagnostics: false,
    marketingEmails: false,
  },
};

const CONSENT_STORAGE_KEY = 'journify_privacy_consent';

export const PrivacyService = {
  getConsent(): ConsentSettings {
    try {
      const saved = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (saved) {
        return { ...PRIVACY_SPECIFICATIONS.defaultConsent, ...JSON.parse(saved) };
      }
    } catch (e) {}
    return PRIVACY_SPECIFICATIONS.defaultConsent;
  },

  saveConsent(consent: ConsentSettings): void {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
    } catch (e) {}
  },
};
