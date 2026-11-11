# Shamsul Ulama Islamic Academy — All Updates Message (Malayalam)

**ഏറ്റവും പുതിയ Public Website:** https://shamsul-ulama-w2kv.hatchable.site  
**Version:** v19 (11 November 2026)  
**Admin Login:** https://shamsul-ulama-w2kv.hatchable.site/login  
**Public Admin Username:** `administration`  
**Admin Password:** ഇവിടെ നൽകുന്നില്ല; നിലവിലെ ഉടമയുടെ രഹസ്യ Password ഉപയോഗിക്കുക.

## Website
Home, About Academy, Gallery, Admission, Contact, Sign In. Academy branding, logo, public photos, gallery management, public content/settings.

## Login and roles
Admin, Usthad, Student, Parent. Username/password authentication, protected private routes, session management, password change, account status, owner-issued admin recovery flow. Student credentials are not printed in this document.

## Usthad Dashboard
Academy overview, Student Admission/Student Management, Add Student, student account creation, student profile/password updates, Accounts & Parents, Usthad management, Monthly Hifz Passport, 30 Juz Verification, gallery, academy content, announcements/settings where supported by the deployed code.

## Admissions
Online application, review/interview/approve/reject actions. Approval backend can create a linked student account. Rejected applications now display under a separate **Rejected Admissions** heading in v19. Database audit found 2 approved applications linked to students and 2 rejected applications.

## Student and Parent — Two Pages
Page 1: private Academy Home with academy information/photo.  
Page 2: Hifz Journey showing student-linked progress, planner, Juz details and published records subject to role permissions.

## Hifz system
604-page progress model, Juz 1→30 or 30→1 planning, partial pages, target date and daily study plan, revision, verification and monthly reports as implemented in the current code.

## Verified / Pending
**Verified:** v19 live; stored source exported; 3 student accounts linked; approved/rejected database statuses; unauthenticated API access restricted.  
**Pending:** real authenticated password save → student login test; all private student page interactions; end-to-end Usthad data entry. These cannot honestly be marked error-free without the remaining tests.

## Code
This archive includes all 72 stored project source files, all API files, SQL migrations, pages, CSS, JavaScript, and original bundled images. It does not include private production database records, passwords, secret keys, recovery tokens, or separately hosted gallery uploads.
