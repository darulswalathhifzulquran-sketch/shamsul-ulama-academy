# ACCEPTANCE TESTS — non-destructive first

- [ ] Sign in with the actual Administrator account. Do not share passwords or student details.
- [ ] Open Staff → Student Admission: verify students list and the centered dialog on one disposable test student's Delete button. Click **Cancel**; confirm nothing disappeared.
- [ ] Open **Delete All Students** dialog as Admin: verify it shows the current count, centered on screen, then **Cancel**. **Do not confirm this on real production data.**
- [ ] As an Usthad (non-admin), verify Delete All Students is not visible and the bulk delete API is forbidden.
- [ ] In a *separate staging project with disposable records only*, confirm Delete All Students removes linked account/session/Hifz data transactionally.
- [ ] Create a **test** Usthad; confirm unique username, one-time temporary password, and login. Test password change.
- [ ] Create a **test** admission application, reject it, refresh and check status persisted.
- [ ] Create another test application, approve once, confirm student + first-login credentials; refresh to ensure no duplicate created.
- [ ] Upload rights-cleared test photo/video; verify Draft vs Published; hide, then delete the disposable item. Confirm no browser `Type DELETE` popup.
- [ ] Check public gallery, Home, Contact, About, Admission and mobile layouts.
- [ ] Confirm current user-owned production database backup/restore procedure works before any mass deletion.
- [ ] If adding `.com`, test certificate, HTTPS, /login, /staff and deep links.

**Verification caveat:** successful deploy and unauthenticated checks alone are not proof that all authenticated workflows work.
