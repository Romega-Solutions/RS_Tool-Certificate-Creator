# ✅ Testing Checklist - n8n Integration & UMak Preset

## Pre-Testing Setup

- [ ] Development server is running (`pnpm run dev`)
- [ ] PostgreSQL database from `DATABASE_URL` is accessible
- [ ] n8n workflow is configured at https://n8n.kenbuilds.tech/webhook/certificate-email-api
- [ ] `.env.local` has both DATABASE_URL and N8N_WEBHOOK_URL

---

## Test 1: Environment Variables ✅

**Goal**: Verify webhook URL is configured

### Steps:

1. [ ] Check `.env.local` contains:
   ```env
   N8N_WEBHOOK_URL=https://n8n.kenbuilds.tech/webhook/certificate-email-api
   ```
2. [ ] Restart dev server if you just added it
3. [ ] No "N8N_WEBHOOK_URL not configured" error in console

**Expected Result**: No console errors about missing webhook URL

---

## Test 2: UMak Preset in Batch Generator 📧

**Goal**: Verify UMak preset appears and works in batch dialog

### Steps:

1. [ ] Go to `http://localhost:3000/generator`
2. [ ] Add a text element with `{{name}}` placeholder
3. [ ] Upload `batch-example.json` (or create test data)
4. [ ] Select at least 2 recipients (checkboxes)
5. [ ] Click "Queue Selected Certificates" button
6. [ ] Dialog opens with email configuration
7. [ ] Look for 4 preset buttons: **Event**, **KPI**, **Internship**, **UMak**
8. [ ] Click "UMak" button
9. [ ] Verify subject changes to: "Your e-certificate is now ready"
10. [ ] Verify message contains: "I hope this email finds you well. On behalf of the CCIS Student Council..."
11. [ ] Verify message includes legal disclaimer at bottom
12. [ ] Click "Queue X Certificates"
13. [ ] Success message appears

**Expected Result**:

- ✅ UMak button visible and clickable
- ✅ Correct subject and message loaded
- ✅ Certificates queued successfully
- ✅ No console errors

---

## Test 3: UMak Preset in Send Email Dialog 📨

**Goal**: Test direct send with UMak preset

### Steps:

1. [ ] Stay on `/generator` page
2. [ ] Create a certificate with a recipient name (e.g., "Test Student")
3. [ ] Click "Send via Email" button
4. [ ] Dialog opens
5. [ ] Look for 4 preset buttons below the subject field
6. [ ] Click "UMak" preset button
7. [ ] Verify subject and message update
8. [ ] Enter your test email address
9. [ ] Click "Send Certificate"
10. [ ] Check for success message

**Expected Result**:

- ✅ Email sent successfully
- ✅ n8n webhook receives the request
- ✅ No 500 errors in console

---

## Test 4: UMak Preset in Add to Queue Dialog 💾

**Goal**: Test adding to queue with UMak preset

### Steps:

1. [ ] On `/generator` page
2. [ ] Click "Add to Queue" button
3. [ ] Dialog opens
4. [ ] See 4 presets: Event, KPI, Internship, **UMak**
5. [ ] Click "UMak" button
6. [ ] Verify content changes
7. [ ] Enter test email (e.g., test@example.com)
8. [ ] Click "Add to Queue"
9. [ ] Success message shows
10. [ ] Go to `/email-queue` page
11. [ ] Find your queued item
12. [ ] Verify subject is "Your e-certificate is now ready"

**Expected Result**:

- ✅ Item added to PostgreSQL queue
- ✅ Appears in Email Queue page
- ✅ Correct subject and message saved

---

## Test 5: Batch Send via n8n Webhook 🚀

**Goal**: Test sending queued items through n8n

### Steps:

1. [ ] Go to `/email-queue` page
2. [ ] You should see queued items from previous tests
3. [ ] Select 1-2 items (checkboxes)
4. [ ] Click "Send Selected" button
5. [ ] Watch the status column
6. [ ] Status should change: `pending` → `sending` → `sent`
7. [ ] Check your email inbox
8. [ ] Open received email
9. [ ] Verify:
   - [ ] Subject matches UMak preset
   - [ ] Message contains CCIS Student Council text
   - [ ] Legal disclaimer is present
   - [ ] Certificate image is attached
   - [ ] Email styling looks professional

**Expected Result**:

- ✅ Email status updates to "sent"
- ✅ Email received in inbox
- ✅ Content matches UMak template
- ✅ Certificate attached correctly

---

## Test 6: n8n Webhook Status Update 🔄

**Goal**: Test n8n calling back to update status

### Steps:

1. [ ] Send a certificate (any method from tests above)
2. [ ] Go to n8n workflow interface
3. [ ] Check workflow execution log
4. [ ] Verify n8n received the webhook request
5. [ ] Verify n8n sent email via Gmail/SMTP
6. [ ] Verify n8n called `POST /api/update-status`
7. [ ] Back in your app, go to `/email-queue`
8. [ ] Wait 5 seconds (auto-refresh)
9. [ ] Status should update to "sent" automatically
10. [ ] "Sent At" timestamp should appear

**Expected Result**:

- ✅ Status updates from "pending" to "sent"
- ✅ Timestamp shows when email was sent
- ✅ No errors in n8n logs
- ✅ Auto-refresh works (green pulsing dot visible)

---

## Test 7: Error Handling ⚠️

**Goal**: Verify error handling works

### Steps:

1. [ ] Temporarily change N8N_WEBHOOK_URL to invalid URL in `.env.local`
2. [ ] Restart dev server
3. [ ] Try to send a certificate
4. [ ] Should see error: "Email service not configured" or similar
5. [ ] Restore correct N8N_WEBHOOK_URL
6. [ ] Restart dev server
7. [ ] Try sending again - should work

**Expected Result**:

- ✅ Clear error message shown to user
- ✅ No crashes or unhandled exceptions
- ✅ Works after fixing configuration

---

## Test 8: Placeholder Replacement 🔄

**Goal**: Test `{{name}}`, `{{email}}`, `{{title}}`, `{{date}}` placeholders

### Steps:

1. [ ] Go to `/generator`
2. [ ] Create batch data with this JSON:
   ```json
   {
     "recipients": [
       {
         "name": "Juan Dela Cruz",
         "email": "juan@umak.edu.ph",
         "title": "Android Category Head"
       }
     ]
   }
   ```
3. [ ] Upload the JSON file
4. [ ] Queue with UMak preset
5. [ ] In email message, manually add `{{title}}` placeholder:
   ```
   Warm regards,
   {{title}}
   ```
6. [ ] Queue the certificate
7. [ ] Go to Email Queue and send it
8. [ ] Check received email
9. [ ] Verify "Warm regards, Android Category Head" appears

**Expected Result**:

- ✅ `{{name}}` replaced with "Juan Dela Cruz"
- ✅ `{{email}}` replaced with "juan@umak.edu.ph"
- ✅ `{{title}}` replaced with "Android Category Head"
- ✅ `{{date}}` replaced with current date

---

## Test 9: Auto-Refresh Email Queue 🔄

**Goal**: Test 5-second auto-refresh feature

### Steps:

1. [ ] Go to `/email-queue` page
2. [ ] Look for green pulsing dot with "LIVE" badge
3. [ ] Look for "Last refresh: [timestamp]" text
4. [ ] Wait 5 seconds
5. [ ] Timestamp should update
6. [ ] Add a new certificate to queue in another tab
7. [ ] Within 5 seconds, it should appear automatically

**Expected Result**:

- ✅ Page refreshes every 5 seconds
- ✅ Timestamp updates
- ✅ New items appear without manual refresh
- ✅ Status changes appear automatically

---

## Test 10: All 4 Presets Work 🎯

**Goal**: Verify all presets load correctly

### Quick Test:

1. [ ] Open any email dialog (Send Email, Add to Queue, or Batch)
2. [ ] Click **Event** preset → Verify subject = "Certificate of Attendance"
3. [ ] Click **KPI** preset → Verify subject = "KPI Achievement Certificate"
4. [ ] Click **Internship** preset → Verify subject = "Certificate of Completion - Internship"
5. [ ] Click **UMak** preset → Verify subject = "Your e-certificate is now ready"

**Expected Result**:

- ✅ All 4 presets change subject correctly
- ✅ All 4 presets change message correctly
- ✅ No JavaScript errors in console

---

## 🐛 Common Issues & Fixes

### Issue: "N8N_WEBHOOK_URL not configured"

**Fix**: Add to `.env.local` and restart server

### Issue: Email not sending

**Fix**: Check n8n workflow is active and webhook URL is correct

### Issue: Status not updating

**Fix**: Verify n8n can reach your app's `/api/update-status` endpoint

### Issue: Placeholders not replacing

**Fix**: Ensure format is `{{placeholder}}` not `{placeholder}` or `{{{placeholder}}}`

### Issue: UMak preset button missing

**Fix**: Clear browser cache and hard reload (Ctrl+Shift+R)

### Issue: PostgreSQL connection error

**Fix**: Verify DATABASE_URL in `.env.local` and database is running

---

## ✅ Final Verification

Before considering testing complete:

- [ ] At least 1 successful email sent via UMak preset
- [ ] Email received in inbox with correct formatting
- [ ] Certificate image attached properly
- [ ] Status updates working (pending → sent)
- [ ] Auto-refresh working on Email Queue page
- [ ] All 4 presets accessible and functional
- [ ] Placeholders replacing correctly
- [ ] No console errors or warnings
- [ ] n8n workflow executes successfully

---

## 📊 Test Summary Template

After testing, fill this out:

```
Date: _______________
Tester: _______________

Tests Passed: ___/10
Tests Failed: ___/10

Issues Found:
1.
2.
3.

Notes:
-
-
-

Overall Status: [ ] PASS  [ ] FAIL  [ ] NEEDS REVIEW
```

---

## 🚀 Ready for Production?

If all tests pass:

- [ ] Configure production PostgreSQL database
- [ ] Update production environment variables
- [ ] Test n8n webhook with production URL
- [ ] Send test emails to verify formatting
- [ ] Monitor first batch for any issues

Good luck! 🎉
