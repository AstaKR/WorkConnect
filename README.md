# WorkConnect

A comprehensive work reporting and employee management platform with AI-powered insights, role-based dashboards, and task automation.

## Features (v1.1)

- **Daily Work Reports** - Log and submit daily tasks with smooth, animated task entry
- **Smart Task Management** - Auto-minimize/expand task entries for efficient data entry
- **AI-Powered Insights** - AI-assisted action planning for tasks
- **Multi-Role Dashboards** - Customized views for CEOs, Managers, Employees, and Individual accounts
- **Role-Based Access Control** - Granular permissions and data isolation
- **Theme Customization** - 15 preset themes + custom color picker
- **Real-Time Notifications** - Stay updated on reports and approvals

## Version

**Current:** 1.1.0 (May 2026)

### What's New in v1.1

- ✨ Task animation system with smooth minimize/expand transitions
- 🎨 Improved task entry UX - reduced scrolling, cleaner interface
- 🎬 Spring-eased animations for natural feel
- 📱 Responsive design improvements

### Previous Versions

- **v1.0.0** - Initial release

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion, TypeScript
- **Backend**: Django, Django REST Framework
- **Database**: PostgreSQL
- **UI Components**: Lucide Icons, React Hook Form
- **Animations**: Framer Motion
- **Drag & Drop**: @dnd-kit

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+
- PostgreSQL 12+

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Access at `http://localhost:5173`

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Access at `http://localhost:8000`

## Project Structure

```
WorkConnect/
├── frontend/              # React application
│   ├── src/
│   │   ├── pages/        # Route pages (Dashboard, Reports, etc.)
│   │   ├── components/   # Reusable components
│   │   ├── store/        # Zustand state management
│   │   ├── api/          # API clients
│   │   └── utils/        # Utilities
│   └── package.json
├── backend/               # Django application
│   ├── app/              # Core app
│   ├── users/            # User management
│   ├── reports/          # Report management
│   └── manage.py
└── docs/                 # Documentation
```

## Core Features

### Daily Reports

Users can log their daily activities with:
- Multiple task entries with priority levels
- Location tracking (Office, WFH, Field, On Leave)
- Status management (Pending, In Progress, Completed)
- AI-assisted action planning
- Auto-save drafts

### Dashboards

- **CEO Dashboard**: Company-wide metrics and analytics
- **Manager Dashboard**: Team performance and report status
- **Employee Dashboard**: Personal reports and tasks
- **Individual Dashboard**: For personal account holders

### Appearance Settings

Customize your experience:
- 15 preset themes (Ocean, Forest, Sunset, Royal, etc.)
- Custom color picker
- Font size adjustment
- Layout density options
- Sidebar positioning

## Testing

```bash
cd frontend
npm test
```

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m "feat: description"`
3. Push to branch: `git push origin feature/your-feature`
4. Open a Pull Request

## License

[Add License Info]

## Support

For issues or questions, please contact: [support email]
