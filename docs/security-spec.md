# StüdyoAsistan Firestore Security Specification

## 1. Data Invariants
1. **Single-Tenant Owner Isolation**: Every document under `/studios/{studioId}` and its subcollections (`services`, `clients`, `appointments`) belongs exclusively to `studioId == request.auth.uid`, and `data.ownerId == request.auth.uid`.
2. **Verified Identity Gate**: Unauthenticated users and users without `request.auth.token.email_verified == true` have ZERO read/write access to any collection.
3. **Master Gate (Relational Sync)**: No `services`, `clients`, or `appointments` document can be created or updated unless the parent `/studios/{studioId}` document exists and is owned by `request.auth.uid`.
4. **PII Isolation**: Client phone numbers, allergy/sensitivity notes, and appointment details reside exclusively under `/studios/{studioId}/clients` and `/studios/{studioId}/appointments`, readable only when `request.auth.uid == studioId && resource.data.ownerId == request.auth.uid`.
5. **Immutable Identity & Server Timestamps**: `ownerId` and `createdAt` can never be altered after creation. `createdAt == request.time` on create; `updatedAt == request.time` on both create and update.
6. **Volumetric Bounds & No Ghost Fields**: Every string has an explicit `.size()` bound, every array has a strict `.size() <= MAX` bound, document IDs match `^[a-zA-Z0-9_\-]+$` (`<= 128` chars), and both `hasAll`/`hasOnly` and `affectedKeys().hasOnly(...)` block shadow fields.

## 2. The "Dirty Dozen" Attack Payloads (All Must Be Rejected)
1. **Unauthenticated Read/Write**: Read `/studios/uid-a/clients/cli-1` with `auth == null`.
2. **Cross-Tenant PII Read**: Authenticated `uid-b` attempts `get` on `/studios/uid-a/clients/cli-1`.
3. **Cross-Tenant List Scraping**: Authenticated `uid-b` attempts `list` on `/studios/uid-a/clients`.
4. **Unverified Email Spoofing**: Authenticated `uid-a` with `email_verified: false` attempts to write `/studios/uid-a`.
5. **OwnerId Spoofing on Create**: `uid-a` creates `/studios/uid-a/clients/cli-1` with `ownerId: "uid-b"`.
6. **Shadow / Ghost Field Injection on Create**: `uid-a` creates `/studios/uid-a/services/srv-1` with extra field `isAdmin: true`.
7. **Shadow Field Injection on Update**: `uid-a` updates `/studios/uid-a/clients/cli-1` adding `secretRole: "superadmin"`.
8. **Immutable Field Tampering**: `uid-a` updates `/studios/uid-a/clients/cli-1` modifying `ownerId` or `createdAt`.
9. **Client-Forged Timestamp**: `uid-a` creates `/studios/uid-a/appointments/apt-1` with a past/future `createdAt` instead of `serverTimestamp()`.
10. **ID Poisoning Attack**: `uid-a` creates `/studios/uid-a/clients/../../../etc/passwd` or a 200-char ID.
11. **Value Poisoning (Denial of Wallet)**: `uid-a` updates `studioName` with a 5,000-character string or `sessions` array with > 50 elements.
12. **Orphaned Subcollection Write**: `uid-a` attempts to create `/studios/uid-a/clients/cli-1` before `/studios/uid-a` parent studio document exists.
