# WorkConnect v1.1 - Task Animation & UI Enhancement Design

**Date:** 2026-05-08  
**Version:** 1.1.0  
**Status:** Design Approved

---

## Overview

WorkConnect v1.1 introduces smooth task animation and UI enhancements to improve the task entry experience. When users fill out daily work reports, tasks will seamlessly transition between expanded (edit) and minimized (view) states, creating a flowing, attractive interface that encourages rapid task entry.

---

## Feature: Task Completion Animation

### Problem Statement

Currently, the task list in `NewReport.tsx` shows all tasks with full form fields visible. This causes:
- Excessive scrolling when entering multiple tasks
- Cluttered interface that feels overwhelming
- Loss of focus when navigating between tasks

### Solution: Smart Task State Management

**Core Behavior:**
1. **Only one task is expanded at a time** — the task currently being edited
2. **Expanded state:** Full form with all fields (job description, priority, status, action plan)
3. **Minimized state:** Compact view showing only title + priority badge
4. **Auto-minimize:** Previous task automatically collapses when user clicks outside or focuses on another task
5. **Smooth animations:** Framer Motion handles all transitions with easing

### User Flow

```
1. User opens NewReport page
   → First task auto-expands for immediate input

2. User fills in task details (job, priority, action plan)
   → Full form visible, user has all fields

3. User clicks next task, adds new task, or clicks outside current task
   → Previous task smoothly animates down, minimizes (300ms)
   → New task expands for input (350ms spring animation)
   → Clean, focused interface ready for next entry

4. User can click on any minimized task to re-expand and edit
   → Smooth spring animation back to expanded state
   → Any other expanded task automatically minimizes
```

### Implementation Details

**Component Structure:**

```
SortableTaskItem (wrapper - handles drag/drop)
├─ ExpandedTaskItem (focused task)
│  ├─ Job description input
│  ├─ Priority selector
│  ├─ Status selector
│  ├─ Action plan textarea
│  └─ Delete button
│
└─ MinimizedTaskItem (non-focused tasks)
   ├─ Task title
   ├─ Priority badge
   └─ Edit trigger
```

**State Management:**
- New state: `focusedTaskId` tracks which task is currently being edited
- Initialize to first task on page load
- Update on focus change (click, tabbing, new task creation)
- Auto-clear when all tasks are completed

**Animation Specifications:**

| Transition | Duration | Easing | Details |
|-----------|----------|--------|---------|
| Expand | 300ms | easeInOut | Scale + opacity increase |
| Minimize | 250ms | easeInOut | Slide up + height collapse |
| Click to expand | 350ms | spring | Natural spring motion |

**Minimized State Height:**
- Shows single-line title + priority badge
- Approximate height: 52px (vs 200-250px expanded)
- Creates significant space savings

### Theme Integration

**Appearance System Compatibility:**
- Minimized tasks use `primary_color` for priority badges
- Animations respect `font_size` preference (title scales proportionally)
- Background matches `background_color` setting
- Border uses theme accent colors on hover
- Works with all 15 preset themes + custom colors

**Responsive Behavior:**
- Mobile: Full collapse with minimal spacing
- Tablet/Desktop: Same collapse behavior, better space management

---

## Version & Documentation Updates

### Version Bumping
- Current: `0.0.0` → Target: `1.1.0`
- Update `frontend/package.json` version field
- Update `backend/setup.py` or equivalent version file (if exists)

### Display Updates
1. **Landing Page** (`pages/LandingPage.tsx` or landing components)
   - Add version badge in footer (right side)
   - Format: "v1.1.0" or "WorkConnect v1.1.0"
   - Subtle styling, secondary color

2. **App Dashboard Footer** (all dashboard pages)
   - Add version in footer right corner (near copyright)
   - Format: "v1.1.0"
   - Visible but not prominent (secondary text color)
   - OR add to Settings page (Appearance Settings) under "About" section

### Documentation

**README.md** (create/update at repo root)
```
# WorkConnect

## Features (v1.1)
- Daily work report management
- Task management with smooth animations
- Multi-user dashboards (CEO, Manager, Employee, Individual)
- Role-based access control
- Theme customization (15 presets + custom colors)
- AI-powered task action planning

## Version
Current: 1.1.0 (May 2026)

## Setup
[Installation instructions]

## Tech Stack
- Frontend: React 19, Tailwind CSS, Framer Motion
- Backend: [Framework]
- Database: [Database]
```

**CHANGELOG.md** (create at repo root)
```
# Changelog

## [1.1.0] - 2026-05-08

### Added
- Task animation system: Smooth minimize/expand transitions
- Auto-minimize previous task when focusing on new task
- Minimized task view (title + priority badge)
- Spring-eased expand animation for editing recalled tasks

### Improved
- Task entry UX: Reduced scrolling, cleaner interface
- Visual feedback: Smooth transitions instead of instant state changes
- Theme integration: Animations respect appearance settings

### Changed
- NewReport component: Added focusedTaskId state management
- SortableTaskItem: Split into ExpandedTaskItem and MinimizedTaskItem

## [1.0.0] - [Previous Release Date]
[Previous release notes...]
```

---

## Technical Considerations

### No Breaking Changes
- Existing API contracts remain unchanged
- Task data structure unchanged
- Backward compatible with saved reports

### Performance
- Animations use GPU-accelerated transforms (transform, opacity)
- No layout thrashing during transitions
- Minimal re-renders (only focused task changes)

### Accessibility
- Animations respect `prefers-reduced-motion` media query
- Focus management: Next task auto-focuses when previous minimizes
- Keyboard navigation: Tab between tasks, Enter to expand/collapse
- Screen readers: Semantic HTML, ARIA labels for state

### Testing Strategy
- Unit tests: `ExpandedTaskItem` and `MinimizedTaskItem` renders
- Integration tests: Focus transitions, animation triggers
- Visual tests: Animations smooth across different theme colors
- E2E tests: Create multiple tasks, verify minimize behavior

---

## Success Criteria

✅ Task minimizes smoothly when user moves focus  
✅ Animations feel natural and attractive (300-350ms duration)  
✅ Minimized tasks save visible space (reduces by ~150px per task)  
✅ User can re-expand any minimized task  
✅ Version displays correctly on Landing Page and WorkConnect app  
✅ README and CHANGELOG document v1.1 features  
✅ All tests pass (frontend: 43+ tests)  
✅ No regressions in existing functionality  

---

## Deliverables

1. ✅ Updated `NewReport.tsx` with animation logic
2. ✅ New `ExpandedTaskItem.tsx` component
3. ✅ New `MinimizedTaskItem.tsx` component
4. ✅ Version update in `package.json` (1.1.0)
5. ✅ Version display on Landing Page
6. ✅ Version display on WorkConnect app
7. ✅ `README.md` creation/update
8. ✅ `CHANGELOG.md` creation
9. ✅ Updated tests with new components
10. ✅ Git commit with message: `feat(v1.1): add task animation system`
11. ✅ Push to GitHub

---

## Timeline & Scope

**Scope:** Single feature branch  
**Estimated Effort:** 1-2 hours  
**Phase:** Immediate (v1.1)  
**Next Phase:** Full design overhaul (v1.2+, to be scheduled)

---

## Sign-Off

- **Feature Owner:** AstaKR
- **Status:** Ready for Implementation
- **Date Approved:** 2026-05-08
