# Functional test cases

**Last run:** 2026-10-22  
**Result:** All 21 isolated API workflow cases and the SMTP timeout check passed. The test runner starts a temporary MongoDB database and API server, uses generated test-only credentials and secret, and cleans test records and generated PDFs. It does not use the configured college database or send email externally.

Run from the project folder after `start-app.ps1` has initialized the local runtime:

```powershell
.\tests\run-functional-smoke.ps1
```

## Automated API cases

| ID | Area | Test case | Result |
|---|---|---|---|
| FT-01 | Availability | Health endpoint reports database ready | PASS |
| FT-02 | Authentication | Seeded super-admin can sign in | PASS |
| FT-03 | Authentication | Protected API rejects missing and expired credentials | PASS |
| FT-04 | Dashboard | Admin statistics and seeded document types load | PASS |
| FT-05 | Authentication | Student registration validates fields, normalizes email case, rejects duplicates and wrong passwords; `/auth/me` omits password | PASS |
| FT-06 | Password recovery | Forgot-password reports unavailable when outbound email is disabled | PASS |
| FT-07 | Password recovery | Valid reset token works once; expired/reused tokens and old password are rejected | PASS |
| FT-08 | Authorization | Student role is denied access to admin APIs | PASS |
| FT-09 | Administration | Admin creates an approver and a two-stage document type; staff account creation is exercised | PASS |
| FT-10 | Administration | Staff cannot create or promote super-admins; password injection is rejected; permitted user profile edits persist | PASS |
| FT-11 | Administration | Document type detail and edits persist | PASS |
| FT-12 | Student requests | Request validation rejects missing fields, invalid values, and missing approvers; valid request appears in student history and approver queue | PASS |
| FT-13 | Authorization | Another student cannot read the request | PASS |
| FT-14 | Approval workflow | Out-of-turn approval is denied and revision requires comments | PASS |
| FT-15 | Approval workflow | Student resubmission revalidates required form data | PASS |
| FT-16 | Documents | Sequential approvals generate a downloadable PDF that verifies; invalid IDs and another student's downloads are denied | PASS |
| FT-17 | Administration | All-requests list filters by status/text and safely handles regex characters | PASS |
| FT-18 | Administration | Document type and staff can be deactivated/reactivated; inactive login/token fail and reactivation preserves credentials | PASS |
| FT-19 | Approval workflow | Reject action stores its reason and student statistics reflect it | PASS |
| FT-20 | Notifications | List, mark-one, mark-all, unread count and ownership-protected deletion work | PASS |
| FT-21 | Profile/security | Editable profile fields persist; password change rejects wrong/short values, invalidates old password, and accepts new password | PASS |
| FT-22 | Email reliability | Stalled local SMTP greeting times out cleanly without sending a message | PASS |

## Browser and deployment checks

| Check | Result |
|---|---|
| Public GitHub Pages sign-in route renders | PASS (2026-10-22) |
| Public registration route renders with department and year selectors | PASS (2026-10-22) |
| Public password-recovery route renders | PASS (2026-10-22) |
| Public frontend browser console | PASS; no errors observed (2026-10-22) |
| Direct `/requests/all` route uses SPA fallback and redirects unauthenticated user to login | PASS (2026-10-22) |
| Production frontend build (`npm run build`) | PASS (2026-10-22) |
| Client production dependency audit (`npm audit --omit=dev`) | PASS; 0 reported vulnerabilities (2026-10-22) |
| Local frontend/API browser form submission against the running server | NOT RUN in this run; the local dev servers were stopped |

The browser checks confirm deployed routes render. UI-01 through UI-08 below describe a full local browser walk-through; the corresponding API workflows are exercised in FT-02 through FT-21, but browser form submission is not claimed as tested in this run.

## Local browser workflow checklist

| ID | Area | Browser action | Expected result |
|---|---|---|---|
| UI-01 | Authentication | Sign in with an active account and sign out | Correct dashboard opens; sign-out returns to login |
| UI-02 | Registration | Submit a valid student registration, then sign in | Account is created once and student dashboard opens |
| UI-03 | Validation | Submit incomplete or mismatched registration fields | Inline validation blocks submission and explains the issue |
| UI-04 | Administration | Create an advisor/HOD account and a document type | Saved records appear in admin lists |
| UI-05 | Student request | Choose a document type, complete fields and submit | Request details and current approval stage appear |
| UI-06 | Approval | Sign in as each approver and approve in sequence | Request advances; final approval generates a downloadable, verifiable PDF |
| UI-07 | Revision and rejection | Request revision, resubmit, then reject another request with a reason | Student sees the revision/rejection state and comments |
| UI-08 | Notifications/profile | Read notifications and update profile/password | Read counts and profile/password behavior update correctly |
| UI-09 | Direct routes | Open `/requests/all` directly on Pages | SPA fallback loads; unauthenticated access redirects to login |

## Known limitations

- **Attachments:** Uploads are not implemented. File fields explain that students must contact the Academic Office; attachment upload/download is not a passing feature.
- **Real email delivery:** Tests disable SMTP or use a fake local SMTP server. Delivery to an actual mailbox, including password-recovery email, remains unverified.
- **Production data and deployment:** Tests use an isolated temporary database. The public GitHub Pages frontend uses each viewer's `http://localhost:5000/api`; it does not provide a shared hosted backend or shared college data.
- **Scope:** This suite checks implemented functional workflows. It is not a production security, load, accessibility, or institutional-policy audit.
