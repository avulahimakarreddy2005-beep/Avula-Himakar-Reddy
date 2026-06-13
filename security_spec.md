# RoadSense AI Security Specification

## 1. Data Invariants
- **Identity Invariant**: Users can store and modify their own Profile information. They are strictly locked out of altering critical RBAC attributes (e.g., setting their own `role` to `'admin'`).
- **State Integrity**: Citizens are forbidden from editing report statuses (`pending` -> `resolved`), altering gravity metrics (`severity` keys), or modifying reports once they reach a resolved terminal state.
- **Timestamp Integrity**: All entries are chronologically bound to `request.time`. Clients cannot backdate or forward-date activity records.
- **Payload Strictness**: ID parameters, strings, arrays, and map parameters are secured with maximum length boundaries to reject wallet-exhaustion injection attacks.

---

## 2. The "Dirty Dozen" Payloads (Red Team Exploits)

1. **Self-Promotion RBAC Exploit**: A citizen attempts to execute an update setting `role: "admin"` in their profile document.
2. **Profile Identity Hijack**: Active user "userA" attempts to update profile "userB"'s data keys directly.
3. **Ghost User Profile Spoofing**: An unauthenticated connection attempts to register or set a document under `/users/{fake_uid}`.
4. **Invalid Role Injection**: A user profile creation payload specifies a role of `"super_god_developer"` to bypass validation filters.
5. **Report Author Spoofing**: User "userA" attempts to create a report setting `reporterId: "userB"`.
6. **Denial of Wallet (DoW) Report Expansion**: A malicious client attempts to write a report with a 15MB description payload to consume host budget.
7. **Privilege Escalation Workflow Hack**: A non-admin citizen attempts to change a report's `status` from `"pending"` to `"resolved"`.
8. **Severity Manipulation Exploit**: A citizen attempts to escalate a personal hazard to `"high"` severity without admin verification.
9. **Terminal State Revision Attack**: A citizen attempts to add a comment or update details on an issue that has already been marked `"resolved"`.
10. **Immutability Chronological Attack**: A citizen sends a write payload altering the original `createdAt` timestamp of a report.
11. **Orphaned Report Injection**: An unauthenticated actor attempts to execute an `addDoc` command on the `/reports` path.
12. **Unauthorized Document Destruction**: A citizen attempts to run a `deleteDoc` on a reported issue, bypassing admin moderation.

---

## 3. Test Assertions Checklist
All of the following exploits must result in `PERMISSION_DENIED` errors from the security rules.
- ✓ Attempt 1: Promote self to admin inside `/users/{uid}` -> `PERMISSION_DENIED`
- ✓ Attempt 2: Write to other user's profile inside `/users/{otherUid}` -> `PERMISSION_DENIED`
- ✓ Attempt 3: Create profile while unauthenticated -> `PERMISSION_DENIED`
- ✓ Attempt 4: Register profile with role `"hack"` -> `PERMISSION_DENIED`
- ✓ Attempt 5: Submit report with spoofed `reporterId` -> `PERMISSION_DENIED`
- ✓ Attempt 6: Send report with a description exceeding 2000 characters -> `PERMISSION_DENIED`
- ✓ Attempt 7: Change report `status` directly -> `PERMISSION_DENIED`
- ✓ Attempt 8: Change report `severity` directly -> `PERMISSION_DENIED`
- ✓ Attempt 9: Modify resolved report details -> `PERMISSION_DENIED`
- ✓ Attempt 10: Backdate report `createdAt` -> `PERMISSION_DENIED`
- ✓ Attempt 11: Unauthenticated report write -> `PERMISSION_DENIED`
- ✓ Attempt 12: Citizen delete of report -> `PERMISSION_DENIED`
