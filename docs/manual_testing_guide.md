# Manual Testing Guide

## Prerequisites

1. Backend running: `cd backend && npm run start:dev`
2. Frontend running: `cd frontend && npm run dev`
3. Test user credentials ready

---

## Test Scenarios

### 1. Login Incorrecto

**Steps:**
1. Navigate to `/login`
2. Enter invalid credentials
3. Submit

**Expected:**
- [ ] Error message displayed (not generic)
- [ ] Form values preserved
- [ ] Submit button re-enabled
- [ ] No redirect

---

### 2. Token Expirado

**Setup:** Set short token expiry in backend (e.g., 10 seconds)

**Steps:**
1. Login successfully
2. Wait for token to expire
3. Navigate to protected page or refresh

**Expected:**
- [ ] Automatic refresh via cookie
- [ ] No visible interruption
- [ ] If refresh fails → redirect to login
- [ ] No console errors

---

### 3. Dos Pestañas Abiertas

**Steps:**
1. Open app in Tab A
2. Login
3. Open same app in Tab B
4. Tab B should show auth state
5. Logout from Tab A
6. Perform action in Tab B

**Expected:**
- [ ] Tab B loses auth on action attempt
- [ ] Tab B redirects to login
- [ ] No data corruption

---

### 4. Firmar Sesión Dos Veces

**Steps:**
1. Open session in PENDING_REVIEW state
2. Click "Firmar"
3. Confirm in dialog
4. Quickly click "Firmar" again (race condition)

**Expected:**
- [ ] First sign succeeds
- [ ] Second attempt shows 409 Conflict
- [ ] Message: "Estado legal ha cambiado"
- [ ] Page reloads with SIGNED state
- [ ] Hash displayed

---

### 5. Error 409 Real

**Setup:** Two browser windows

**Steps:**
1. Window A: Open session, start editing
2. Window B: Sign same session
3. Window A: Try to save

**Expected:**
- [ ] Window A gets 409
- [ ] Message about conflict
- [ ] Data reloaded
- [ ] User can see current state

---

### 6. Error 423 Real

**Setup:** Mark session as locked in backend

**Steps:**
1. Open locked session
2. Try to edit

**Expected:**
- [ ] Edit controls disabled
- [ ] "🔒 Bloqueada" badge visible
- [ ] If API called → 423 error shown
- [ ] Message: "Retención legal activa"

---

## Results Template

| Test | Pass | Notes |
|------|------|-------|
| Login incorrecto | | |
| Token expirado | | |
| Dos pestañas | | |
| Firmar dos veces | | |
| 409 real | | |
| 423 real | | |

---

## Issues Found

| Issue | Severity | Fix |
|-------|----------|-----|
| | | |
