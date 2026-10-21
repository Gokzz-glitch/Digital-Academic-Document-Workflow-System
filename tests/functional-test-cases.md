# Functional test cases

**Run date:** 2026-10-21  
**Result:** 19 automated API cases and one local SMTP-timeout case passed. The runner uses an isolated database, disables SMTP for workflow tests, uses a fake local SMTP server for the timeout check, removes generated test PDFs and records, and stops its isolated server when finished. It sends no email to an external recipient.

Run from the project folder after `start-app.ps1` has initialized the local runtime:

```powershell
.\tests\run-functional-smoke.ps1
```

## Automated cases

| ID | Area | Test case | Result |
|---|---|---|---|
| FT-01 | Availability | Health endpoint reports the database ready | PASS |
| FT-02 | Authentication | Seeded super-admin can sign in | PASS |
| FT-03 | Authentication | Protected endpoints reject missing credentials | PASS |
| FT-04 | Dashboard | Admin statistics and seeded document types load | PASS |
| FT-05 | Authentication | Student registration/sign-in work; duplicate email and wrong password are rejected | PASS |
| FT-06 | Password recovery | Forgot-password returns an explicit unavailable response when SMTP is disabled | PASS |
| FT-07 | Password recovery | Valid expiring reset token changes the password; old password stops working | PASS |
| FT-08 | Authorization | Student role is denied access to admin APIs | PASS |
| FT-09 | Administration | Admin creates an approver and a two-stage document type | PASS |
| FT-10 | Student requests | Active types load; request appears in student history and approver queue | PASS |
| FT-11 | Authorization | Another student cannot read the request | PASS |
| FT-12 | Approval workflow | Out-of-turn approval is denied; revision requires comments | PASS |
| FT-13 | Approval workflow | Student can revise and resubmit to stage one | PASS |
| FT-14 | Documents | Final approval generates a downloadable PDF that verifies; invalid IDs and other-student downloads are denied | PASS |
| FT-15 | Administration | All-requests list supports status and student/roll-number search filters | PASS |
| FT-16 | Administration | Document types and staff can be deactivated and reactivated | PASS |
| FT-17 | Approval workflow | Approver can reject with a reason; student statistics update | PASS |
| FT-18 | Notifications | Notifications list, mark-one, mark-all and unread count work | PASS |
| FT-19 | Profile | Editable profile fields persist | PASS |
| FT-20 | Email reliability | A stalled local SMTP greeting times out cleanly without sending a message | PASS |

## Additional checks

| Check | Result |
|---|---|
| Local admin dashboard renders in the browser; database/API health indicators are online | PASS |
| Vite production build | PASS |
| Frontend and API on the normal local ports (`5173` and `5000`) | PASS after backend restart |
| Password reset form renders with both password fields | PASS |

## Limitations found

- **Attachments:** Uploads are not implemented. The request model has an attachments field, but there is no upload API or usable upload control; file fields tell students to contact the Academic Office. Attachment upload/download is therefore not covered as a passing feature.
- **Real email delivery:** The test runner intentionally does not contact the configured SMTP provider or send email. In-app notifications, missing-SMTP recovery, and a stalled local SMTP connection were tested. Delivery to an actual mailbox remains unverified.
- **Forgot password with SMTP configured:** The code now sends a single-use, expiring reset link and the reset route works with a valid token. Actual SMTP delivery is not verified by this suite.

The smoke suite is a functional check of the implemented local workflows; it is not a production security, load, accessibility, or institutional-policy audit.
