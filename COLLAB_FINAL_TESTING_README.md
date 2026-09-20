# Collaborative Syllabus Editor - Final Testing Checklist

**Overall Goal:** Verify that Phases 1-4 work together seamlessly: live editing (Phase 1), persistence (Phase 2), workflow (Phase 3), and version history (Phase 4).

**Timeline:** Full test should take ~30 minutes.

---

## Pre-Test Setup

### 1. Start the servers

**Terminal 1: Start the Hocuspocus server**
```bash
cd server
npm run dev:collab
# Expected: "✅ Hocuspocus Server running on port 1234"
```

**Terminal 2: Start the Express backend**
```bash
cd server
npm run dev
# Expected: Server listening on port 3001
```

**Terminal 3: Start the React frontend**
```bash
cd client
npm run dev
# Expected: "Local: http://localhost:5173"
```

### 2. Verify database migration
- Ensure migration has been run: `npm run db:migrate` (in server)
- Tables should exist: `syllabus_documents`, `document_versions`, `document_audit_log`, `approvals`, `task_collaborators` (with `role` column)

### 3. Open test page
- Navigate to: `http://localhost:5173/collab-test`
- You should see the CollabTest page with "🧪 Collaborative Syllabus Editor (Phase 4)"

---

## Test Scenarios

### Scenario 1: Phase 1 - Live Editing & Presence

**Objective:** Verify real-time editing and live cursor tracking.

**Steps:**

1. Open `/collab-test` in **Tab A** (same browser, same window)
2. Confirm status shows "CONNECTED" (blue banner)
3. Current user should be "Prof Alice" (default)
4. Type text in the **description** section: "This is a test syllabus"
5. Open `/collab-test` in **Tab B** (different tab, same browser)
6. Wait 2-3 seconds for connection
7. In Tab B, user should still be "Prof Alice"
8. Verify text appears in Tab B's **description** editor
9. In Tab B, change user to **Prof Bob** using the "Switch User" dropdown
10. In Tab B, type in the **outcomes** section: "Students will learn..."
11. In Tab A, verify text appears in real-time (without refresh)
12. Watch the "👥 Online" badge show both "Prof Alice" and "Prof Bob"
13. **Expected Result:** Both edits appear in real-time in both tabs; cursors reflect correct users

---

### Scenario 2: Phase 2 - Persistence & Audit Logging

**Objective:** Verify that edits persist and audit log tracks changes.

**Steps:**

1. Continue from Scenario 1 (Tab A and Tab B still open)
2. In Tab A, add text to **grading**: "Assignments: 40%"
3. Wait 5-10 seconds (autosave debounce is 2 seconds)
4. Scroll down to **Detailed Version History** panel
5. Click the arrow to expand it
6. **Expected Result:** 
   - Should show 2-3 autosave versions
   - Latest version shows "autosave" kind
   - Author should be "Prof Alice" or "Prof Bob" (whoever made the last edit)
   - Timestamp should be recent
7. Scroll down to **Activity Feed** panel
8. Click the arrow to expand it
9. **Expected Result:**
   - Should see "AUTOSAVE" entries (with 💾 icon)
   - Should see "EDIT_SESSION" entries (with ✏️ icon)
   - Each entry shows author and timestamp

---

### Scenario 3: Phase 3 - Workflow & Read-Only Enforcement

**Objective:** Verify status transitions and edit freezing.

**Steps:**

1. Continue from Scenario 2
2. In Tab A, scroll up to **Workflow Controls** (yellow panel)
3. Current status should show "draft"
4. Click **Request Review** button
5. **Expected Result:**
   - Button disappears
   - Status changes to "review_requested"
   - **Reopen for Editing** button appears
   - Panel shows: "⏸️ Editing disabled until approvers review"
6. In Tab B, try to type in any section
7. **Expected Result:**
   - Editors show "🔒 Read-only" badge
   - Text input is disabled (grayed out)
   - Typing has no effect
8. In Tab A, click **Reopen for Editing** button
9. **Expected Result:**
   - Status changes back to "draft"
   - **Request Review** button reappears
   - In Tab B, "🔒 Read-only" badge disappears
   - In Tab B, typing works again
10. Scroll to **Activity Feed** and expand
11. **Expected Result:**
    - New "REQUEST_REVIEW" entry with 👀 icon
    - New "REOPEN" entry with 🔓 icon

---

### Scenario 4: Phase 4 - Version History & Restore

**Objective:** Verify version history inspection and metadata.

**Steps:**

1. In Tab A, make 5-10 edits to different sections over 30 seconds
2. Wait for autosaves (every 2 seconds debounce)
3. Scroll to **Detailed Version History** panel
4. If collapsed, expand it
5. **Expected Result:**
   - Version list shows 5-10 autosave versions
   - Each version shows v1, v2, v3, etc.
6. Click on an older version (e.g., v3)
7. **Expected Result:**
   - Right side shows details: version number, kind, author, timestamp, content hash
   - Hash is truncated to 12 characters
8. Click **📥 Restore This Version** button
9. **Expected Result:**
   - Confirmation dialog appears: "Restore this version? This will create a new version..."
10. Click "OK" to confirm restore
11. **Expected Result:** (Phase 4 hook - implementation pending)
    - A new version is created with label "restored_from_vN"
    - Activity Feed shows new entry with restored author
    - Editors update to show restored content

---

### Scenario 5: Multi-User Sync & Conflict Resolution

**Objective:** Verify that Yjs handles simultaneous edits correctly.

**Steps:**

1. In Tab A (Prof Alice), place cursor in **schedule** section
2. In Tab B (Prof Bob), place cursor in the same section (different position)
3. In Tab A, type: "Week 1: Introduction"
4. **Immediately** (within 1 second) in Tab B, type: "Week 2: Advanced Topics"
5. **Expected Result:**
   - Both texts appear in both tabs (merged by Yjs)
   - Text appears in correct order based on operation timestamps
   - No data loss or duplication
6. Refresh Tab A (Ctrl+R)
7. **Expected Result:**
   - Content persists (loaded from MySQL)
   - All edits still visible

---

### Scenario 6: Status Polling & Cross-Tab Sync

**Objective:** Verify that status changes sync across tabs without manual refresh.

**Steps:**

1. In Tab A, note the current status in **Workflow Controls**
2. In Tab B, note the same status
3. In Tab A, click **Request Review**
4. **Do NOT refresh Tab B**
5. Wait up to 3 seconds (status poll interval is 2 seconds)
6. **Expected Result:**
   - Tab B automatically shows updated status to "review_requested"
   - Tab B editors become read-only without manual refresh
7. In Tab A, click **Reopen for Editing**
8. Wait up to 3 seconds
9. **Expected Result:**
   - Tab B status changes back to "draft"
   - Tab B editors become editable again

---

### Scenario 7: Audit Trail Completeness

**Objective:** Verify that all actions are logged.

**Steps:**

1. Perform the following actions in order:
   - Make an edit
   - Wait 5 seconds for autosave
   - Click **Request Review**
   - Click **Reopen for Editing**
   - Make another edit
   - Wait 5 seconds for autosave

2. Scroll to **Activity Feed** and expand
3. **Expected Result:** Activity log should show entries in this order (newest first):
   - AUTOSAVE (from step 7)
   - REOPEN (from step 4)
   - REQUEST_REVIEW (from step 3)
   - AUTOSAVE (from step 2)
   - (plus any earlier entries)
4. Each entry should show:
   - Action type (icon + name)
   - Summary or details
   - Author name
   - Timestamp

---

### Scenario 8: Version Uniqueness & Hash Detection

**Objective:** Verify that duplicate edits are not saved.

**Steps:**

1. In Tab A, make an edit (e.g., add "Test content" to **description**)
2. Wait 5 seconds for autosave
3. Count the number of versions in **Detailed Version History**: should be N
4. **Without making any new edits**, wait 15 seconds
5. **Expected Result:**
   - Version count should remain N (no duplicate autosaves)
   - Latest version's timestamp should not change
6. Make a different edit (different section or text)
7. Wait 5 seconds
8. **Expected Result:**
   - Version count increases to N+1 (new autosave created)

---

### Scenario 9: Database Persistence

**Objective:** Verify that data survives server restart.

**Steps:**

1. Make several edits across multiple sections
2. Wait for autosave (5+ seconds)
3. Note down some text you added
4. Stop the Hocuspocus server (Ctrl+C in Terminal 1)
5. **Do NOT close the browser tabs**
6. Wait 3 seconds
7. **Expected Result:**
   - Tab A and Tab B should show "DISCONNECTED" status
   - Editors should remain visible (but may not sync)
8. Restart the Hocuspocus server
9. Wait 3 seconds for reconnection
10. **Expected Result:**
    - Status changes back to "CONNECTED"
    - Content is still visible (persisted in MySQL)
    - No data loss

---

### Scenario 10: Permission & Role Enforcement

**Objective:** Verify that non-collaborators cannot access the document.

**Steps:**

1. In Tab A (Prof Alice), note the Task ID shown in status banner
2. Open a new browser (**Private/Incognito window**)
3. Navigate to the test page: `http://localhost:5173/collab-test`
4. Try to change the Task ID to a negative or invalid value (e.g., -1)
5. **Expected Result:**
   - Error should appear: "Failed to create document" or similar
   - Document should not be created/loaded
6. Change it back to the valid Task ID from Tab A
7. **Expected Result:**
   - Document loads (since test user is still valid)
   - In production, the server would verify collaborator status via JWT

---

## Troubleshooting

### Issue: "DISCONNECTED" status persists
- **Cause:** Hocuspocus server not running or unreachable
- **Fix:** 
  1. Check Terminal 1: Is the server running?
  2. Check port 1234 is not blocked: `netstat -an | findstr 1234` (Windows)
  3. Restart server and refresh page

### Issue: Edits don't appear in real-time
- **Cause:** WebSocket connection not established
- **Fix:**
  1. Check browser DevTools console for errors
  2. Check that VITE_HOCUSPOCUS_URL is set correctly in `.env` or defaults to `ws://localhost:1234`
  3. Verify firewall allows port 1234

### Issue: Audit log shows only autosaves, no workflow actions
- **Cause:** Workflow endpoints not called or errors not logged
- **Fix:**
  1. Check server Terminal 2 for errors
  2. Check MySQL: `SELECT * FROM document_audit_log ORDER BY created_at DESC LIMIT 5;`
  3. Verify collabController is imported correctly in routes

### Issue: Version history shows same timestamp repeatedly
- **Cause:** Autosave debounce working correctly (by design)
- **Fix:** This is expected. Wait for a content change, then autosaves will happen 2 seconds after the last edit stops.

---

## Performance Notes

- **Autosave frequency:** 2 seconds debounce (configurable via `DEBOUNCE_MS` in hocuspocus-server.js)
- **Status polling:** 2 seconds (client-side)
- **Version/Audit fetch:** 3-5 seconds (auto-refresh in panels)
- **Database:** Each autosave inserts 1 row to `document_versions` + 1 row to `document_audit_log`

For high-traffic testing, monitor:
- `SELECT COUNT(*) FROM document_versions;`
- `SELECT COUNT(*) FROM document_audit_log;`

---

## Verification Checklist

- [ ] Phase 1: Live editing works in real-time
- [ ] Phase 1: Multiple users show in "Online" badge
- [ ] Phase 2: Versions appear in history panel after autosave
- [ ] Phase 2: Audit log tracks all actions
- [ ] Phase 3: Request Review freezes edits
- [ ] Phase 3: Reopen allows editing again
- [ ] Phase 3: Read-only badge shows when not in draft
- [ ] Phase 4: Version history panel shows all versions with metadata
- [ ] Phase 4: Activity feed displays complete timeline
- [ ] Phase 4: Restore button exists (hook implementation pending)
- [ ] Multi-user: Simultaneous edits merge correctly
- [ ] Persistence: Data survives page refresh
- [ ] Persistence: Data survives server restart
- [ ] Status sync: Workflow changes appear in other tabs without refresh
- [ ] Performance: Autosaves occur without UI lag

---

## Next Steps (Post-Testing)

1. **Phase 4 Complete:** Version history panels built
2. **Production Readiness:**
   - Implement `handleRestoreVersion` endpoint if needed
   - Add user role-based approval system
   - Connect to real task_collaborators data instead of test users
   - Add version diffing UI (optional)
   - Implement conflict resolution UI (optional)
3. **Deployment:**
   - Move to production database
   - Set HOCUSPOCUS_PORT via environment
   - Enable CORS for production domain
   - Test with real collaborators

---

**Total Test Time:** ~30 minutes  
**Success Criteria:** All items in Verification Checklist pass
