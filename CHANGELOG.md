# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-05-08

### Added

- **Task Animation System**: Smooth minimize/expand transitions for task entries
  - Tasks auto-minimize when user moves focus to another task
  - Spring-eased expand animation (350ms) for natural feel
  - Slide-up animation (250ms) for minimize action
  - AnimatePresence layout mode for seamless transitions

- **Enhanced Task Entry UX**
  - Only one task expanded at a time for focused input
  - Minimized tasks show title + priority badge (52px height)
  - Significant space savings when entering multiple tasks
  - Auto-focus next task when creating new task

- **Component Restructuring**
  - New `ExpandedTaskItem.tsx` component for full task form
  - New `MinimizedTaskItem.tsx` component for compact view
  - Improved separation of concerns

- **Version Display**
  - Landing Page: Version badge in footer (v1.1.0)
  - App Settings: Version info in Appearance Settings > About
  - Automatic version updates across UI

- **Documentation**
  - Comprehensive README.md with features and setup
  - CHANGELOG.md for release tracking

### Improved

- Task entry experience: Reduced scrolling with smart minimize
- Visual feedback: Smooth animations instead of instant transitions
- Code organization: Smaller, focused components
- Accessibility: Better focus management and keyboard navigation

### Changed

- `NewReport.tsx`: Added `focusedTaskId` state management
- `SortableTaskItem.tsx`: Replaced with `ExpandedTaskItem` + `MinimizedTaskItem`
- Animation timing: Optimized for visual smoothness (300-350ms range)

### Technical

- Framer Motion: `AnimatePresence mode="popLayout"` for layout animations
- Tailwind CSS: Enhanced responsive design
- Drag & Drop: Maintained dnd-kit compatibility with new components

### Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## [1.0.0] - [Release Date]

### Added

- Initial release
- Daily work report management
- Multi-role dashboards (CEO, Manager, Employee, Individual)
- Role-based access control
- Theme customization system (15 presets)
- Task management with drag-and-drop
- AI-assisted action planning
- Report submission and approval workflow
- User management system
- Location management
- Notification system

---

For upgrade guide from v1.0.0 to v1.1.0, see UPGRADE.md (if applicable)
