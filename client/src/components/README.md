# UX Components & Utilities

## Quick Start Guide

### 1. **ScrollToTop Button** ✓ (Auto-enabled)
Already integrated globally in `App.jsx`. Appears automatically when user scrolls down 300px.

```jsx
// No setup needed - it's already mounted in App.jsx
// Appears automatically when scrolling
```

---

### 2. **Spinner Component** (Loading Animation)
Use for loading states in your pages.

```jsx
import Spinner from "../components/Spinner";

// In your component:
<Spinner size="md" /> // sizes: sm, md, lg, xl
<Spinner size="lg" className="text-purple-600" />

// Example usage:
{isLoading ? (
  <div className="flex items-center gap-2">
    <Spinner size="sm" />
    <span>Loading...</span>
  </div>
) : (
  <YourContent />
)}
```

---

### 3. **ConfirmationModal Component**
Use before destructive actions (delete, archive, etc).

```jsx
import { useState } from "react";
import ConfirmationModal from "../components/ConfirmationModal";

function MyComponent() {
  const [showModal, setShowModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await fetch(`/api/items/${id}`, { method: "DELETE" });
      setShowModal(false);
      // Show success toast, refresh data, etc
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button onClick={() => setShowModal(true)}>Delete</button>

      <ConfirmationModal
        isOpen={showModal}
        title="Delete Item?"
        message="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowModal(false)}
      />
    </>
  );
}
```

**Props:**
- `isOpen` (bool) - Controls modal visibility
- `title` (string) - Modal heading
- `message` (string) - Confirmation message
- `confirmText` (string) - Confirm button label (default: "Confirm")
- `cancelText` (string) - Cancel button label (default: "Cancel")
- `isDangerous` (bool) - Makes confirm button red (default: false)
- `isLoading` (bool) - Disables buttons and shows spinner (default: false)
- `onConfirm` (func) - Called when user confirms
- `onCancel` (func) - Called when user cancels
- `children` (JSX) - Optional custom content inside modal

---

## 4. **Global CSS Animations** ✓ (Auto-enabled)
Add to any element:

```jsx
// Spinning animation (for loaders)
<div className="animate-spin w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full" />

// Pulsing animation
<div className="animate-pulse">Content</div>

// Fade in
<div className="animate-fadeIn">Content</div>

// Slide animations
<div className="animate-slideDown">Slides down</div>
<div className="animate-slideUp">Slides up</div>

// Skeleton loader
<div className="skeleton w-full h-4 rounded" />
```

#### Transition Speed Classes
```jsx
// Use with Tailwind's transition:
<div className="transition-fast">Fast transition (0.15s)</div>
<div className="transition-base">Normal transition (0.2s)</div>
<div className="transition-slow">Slow transition (0.3s)</div>
```

---

### 5. **404 Page** ✓ (Auto-enabled)
Automatically catches unmatched routes. Displays a beautiful error page with:
- Animated blob backgrounds
- Action buttons (Dashboard, Go Back)
- Support contact info

No setup needed - it's wired into `App.jsx`.

---

## CSS Classes Reference

### Form Elements
```css
input:focus             /* Purple border + glow */
textarea:focus          /* Purple border + glow */
select:focus            /* Purple border + glow */
```

### Loading/Skeleton
```css
.skeleton               /* Shimmer animation */
.animate-spin           /* Rotate 360° */
.animate-pulse          /* Fade in/out */
```

### States
```css
button:disabled         /* Opacity 0.5, cursor not-allowed */
.cursor-loading         /* Cursor: wait */
.opacity-loading        /* Opacity 0.6, pointer-events none */
```

---

## Examples

### Example 1: Delete Button with Confirmation
```jsx
import { useState } from "react";
import ConfirmationModal from "../components/ConfirmationModal";

export default function TaskCard({ task, onDelete }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      onDelete(task.id);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="p-4 border rounded-lg">
        <h3>{task.title}</h3>
        <button
          onClick={() => setShowConfirm(true)}
          className="mt-2 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Delete
        </button>
      </div>

      <ConfirmationModal
        isOpen={showConfirm}
        title="Delete Task?"
        message={`Are you sure you want to delete "${task.title}"? This cannot be undone.`}
        confirmText="Delete Task"
        isDangerous
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
```

### Example 2: Loading State
```jsx
import { useState, useEffect } from "react";
import Spinner from "../components/Spinner";

export default function DataList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/items")
      .then(r => r.json())
      .then(data => {
        setItems(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      {items.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

---

## Accessibility

All components include:
- `aria-label` attributes on buttons
- `role="status"` on spinners
- Keyboard accessible (focus-visible outlines)
- Screen reader support

---

## File Locations

- **CSS Animations:** `client/src/styles/ux-improvements.css`
- **ScrollToTop:** `client/src/components/ScrollToTop.jsx`
- **Spinner:** `client/src/components/Spinner.jsx`
- **ConfirmationModal:** `client/src/components/ConfirmationModal.jsx`
- **404 Page:** `client/src/pages/NotFound.jsx`
