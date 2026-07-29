# Task List: Authentication, Sync, and Launch Readiness

- [x] 1. **Finish Clerk Google-only authentication**
  - [x] Confirm the login page opens the Google sign-in flow correctly
  - [x] Verify the SSO callback route completes the login flow
  - [x] Ensure the user lands on the dashboard after sign-in

- [x] 2. **Sync Clerk auth with the app state**
  - [x] Map Clerk user data into the existing Zustand store
  - [x] Ensure the app knows the user is authenticated across the UI
  - [x] Create or update the matching user record in the app data layer if needed

- [x] 3. **Protect routes and navigation**
  - [x] Make sure guests are redirected to the login page
  - [x] Make sure signed-in users can access private pages without issues
  - [x] Ensure the navbar and account controls reflect auth state correctly

- [ ] 4. **Verify the experience locally**
  - [ ] Test sign-in on desktop
  - [ ] Test sign-in on mobile/phone using the local network IP
  - [ ] Confirm the dashboard and core features load after authentication

- [ ] 5. **Prepare production deployment**
  - [ ] Add the required Clerk and Supabase environment variables in Vercel
  - [ ] Deploy the app
  - [ ] Test the live Google sign-in flow in production

- [ ] 6. **Polish and finalize**
  - [ ] Improve any loading or error states around auth
  - [ ] Make the login experience feel consistent with the rest of the app
