# Collaborative Tasks Feature - QA Checklist

## 1. Task Assignment & Setup
- [ ] Program Chair can create a collaborative task with 2 faculty members selected
- [ ] Task shows "Collaborative Task" label in the brief
- [ ] Both faculty members receive the task assignment notification
- [ ] Both faculty can view the same task (not separate tasks)

## 2. Task Brief Section (Read-Only)
- [ ] Only files uploaded by Program Chair at task creation time appear in brief
- [ ] Files uploaded AFTER task creation (by admin or others) do NOT appear in brief
- [ ] "No instruction attachment" message shows if no files were attached at creation
- [ ] Files are previewed correctly when clicked

## 3. File Uploads - Real-Time Visibility
- [ ] Faculty User 1 can upload a file before submitting
- [ ] File appears immediately in User 1's submission panel
- [ ] Faculty User 2 can see the uploaded file in real-time (WebSocket update)
- [ ] File shows "Uploaded by [User 1 Name]" label
- [ ] User 2 can preview/download the file without submitting
- [ ] User 1 can then upload another file
- [ ] User 2 sees User 1's new file appear in real-time

## 4. Confirmation Flow
- [ ] "Confirm my edits" button appears for collaborative tasks (before submission)
- [ ] User 1 clicks "Confirm my edits"
- [ ] Button immediately changes to "✓ You have confirmed"
- [ ] User 2 still sees "Confirm my edits" button
- [ ] User 2 confirms their edits
- [ ] Both users now see "✓ You have confirmed" 
- [ ] Submit button becomes enabled (no longer grayed out)
- [ ] If task is returned for revision:
  - [ ] Confirmation status resets to "awaiting"
  - [ ] Both users see "Confirm my edits" button again
  - [ ] Both must re-confirm before resubmitting

## 5. File Submission
- [ ] Both users have confirmed (show as "✓ You have confirmed")
- [ ] User 1 adds a submission note
- [ ] User 1 selects final file to submit
- [ ] User 1 clicks "Submit for chair review"
- [ ] Task status changes to "For Approval"
- [ ] User 2 receives notification that task was submitted
- [ ] User 2 sees task status changed to "For Approval"
- [ ] Both users see a message indicating submission was successful

## 6. Alternative: User 2 Submits Instead of User 1
- [ ] After both confirm, User 2 can also submit (not just User 1)
- [ ] User 2 adds a submission note
- [ ] User 2 selects final file
- [ ] User 2 clicks "Submit for chair review"
- [ ] Same submission flow works as above
- [ ] User 1 is notified of the submission

## 7. Permissions & Validation
- [ ] Non-collaborators cannot access the task (403 error)
- [ ] Both collaborators cannot upload files if not both confirmed (before submission)
- [ ] Submit button is disabled until BOTH users confirm
- [ ] Submit fails if no file selected
- [ ] Submit fails if no submission note provided
- [ ] Error messages are clear and helpful

## 8. Comment Uploads
- [ ] Both users can upload files in the comments section
- [ ] Uploaded files in comments are separate from submission files
- [ ] Both users can see each other's comment file uploads immediately

## 9. Real-Time Updates (WebSocket)
- [ ] When User 1 uploads a file, User 2 sees it within 1-2 seconds
- [ ] When User 1 confirms, User 2 gets a notification
- [ ] When task status changes (returned/approved), both users see update immediately
- [ ] Connection issues don't crash the app (graceful error handling)

## 10. Status Updates
- [ ] Only assigned faculty (both collaborators) can change task status
- [ ] Collaborators cannot change status to arbitrary values (validation works)
- [ ] Status change is notified to all relevant parties
- [ ] Program Chair can view all collaborative tasks

## 11. Task Return & Resubmission
- [ ] Program Chair returns task for revision with instructions
- [ ] Both users see return notification
- [ ] Confirmation statuses reset to "awaiting"
- [ ] Both users must re-upload files and re-confirm
- [ ] Both users see the Chair's revision instructions
- [ ] Resubmission workflow works the same as initial submission

## 12. Edge Cases
- [ ] User logs out and logs back in - task data persists
- [ ] Both users on same page simultaneously - updates sync correctly
- [ ] One user refreshes page - sees latest uploaded files
- [ ] File upload fails (network error) - shows error message and allows retry
- [ ] One user has task returned while other is working - both see update
- [ ] Creating task with same user twice (not truly collaborative) - handled gracefully

## 13. Database Integrity
- [ ] `is_collaborative = true` for collaborative tasks
- [ ] `collaborator_id` is set correctly
- [ ] `confirmation_status` = 'awaiting' initially
- [ ] `user1_confirmed_at` and `user2_confirmed_at` timestamps are set on confirmation
- [ ] `confirmation_status` = 'confirmed' when both are confirmed
- [ ] File `uploaded_by` field tracks who uploaded each file
- [ ] File `uploaded_at` timestamps are accurate

## 14. UI/UX
- [ ] "Collaborative Task" yellow alert box shows when collaborative
- [ ] Collaborator name appears in metadata
- [ ] File upload section shows "Uploaded by [Name]" clearly
- [ ] Confirmation status is visible and easy to understand
- [ ] No confusing duplicate files in different sections
- [ ] Loading states appear when uploading/confirming
- [ ] Success messages appear after key actions

## 15. Non-Collaborative Tasks (Regression)
- [ ] Non-collaborative tasks still work normally
- [ ] No "Confirm my edits" button for regular tasks
- [ ] Regular submission flow unchanged
- [ ] No confirmation modal appears
- [ ] Status updates work as before
