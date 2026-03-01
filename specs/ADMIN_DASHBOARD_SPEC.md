# Technical Specification — Admin Web Dashboard

## 1. Overview

A React-based single-page application for the Investec DevRel team to manage swag requests. The dashboard provides a clear overview of all submissions with tools to approve, deny, or waitlist requests — plus easy copy-paste for fulfilment workflows.

**Framework:** React 19 + Vite  
**Styling:** Tailwind CSS  
**State Management:** TanStack Query (React Query)  
**Routing:** React Router  
**UI Components:** shadcn/ui  

---

## 2. Pages & Layout

### 2.1 Layout Shell

```
┌──────────────────────────────────────────────────────────────────┐
│  [Investec Logo]  Swag Portal Admin              [User] [Logout] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                           │
│  │  45  │ │  72  │ │  15  │ │  10  │   Stats Cards              │
│  │Pending│ │Apprvd│ │Denied│ │ Wait │                           │
│  └──────┘ └──────┘ └──────┘ └──────┘                           │
│                                                                  │
│  [Search: ________] [Status ▼] [Size ▼] [Export CSV]            │
│                                                                  │
│  ┌────┬────────────┬───────────────┬──────┬────────┬──────────┐ │
│  │ #  │ Name       │ Email         │ Size │ Status │ Date     │ │
│  ├────┼────────────┼───────────────┼──────┼────────┼──────────┤ │
│  │ 42 │ Sipho M.   │ sipho@ex.com  │  L   │Pending │ 01 Mar   │ │
│  │ 41 │ Thandi N.  │ thandi@ex.com │  M   │Approved│ 28 Feb   │ │
│  │ 40 │ James K.   │ james@ex.com  │  XL  │Denied  │ 27 Feb   │ │
│  │ ...│ ...        │ ...           │ ...  │  ...   │ ...      │ │
│  └────┴────────────┴───────────────┴──────┴────────┴──────────┘ │
│                                                                  │
│  [← Prev]  Page 1 of 8  [Next →]                                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Request Detail Panel (Slide-out)

```
┌──────────────────────────────────────┐
│  Swag Request #42              [✕]   │
├──────────────────────────────────────┤
│                                      │
│  Name:    Sipho Mabena               │
│  Email:   sipho@example.com          │
│  Phone:   +27821234567               │
│  Size:    L                          │
│  Status:  ● Pending                  │
│                                      │
│  ── Why they should get swag ──      │
│  "I built 3 apps on the Investec    │
│   API this year and spoke at the    │
│   community meetup in JHB!"         │
│                                      │
│  Submitted: 01 Mar 2026 at 12:00    │
│  SSH Fingerprint: abc123...          │
│  IP: 196.x.x.x                      │
│                                      │
│  ┌──────────────────────────────┐    │
│  │ 📋 Copy Details              │    │
│  └──────────────────────────────┘    │
│                                      │
│  ── Admin Action ──                  │
│                                      │
│  Reason (required for deny/wait):    │
│  ┌──────────────────────────────┐    │
│  │                              │    │
│  └──────────────────────────────┘    │
│                                      │
│  [✓ Approve] [✗ Deny] [⏳ Waitlist] │
│                                      │
└──────────────────────────────────────┘
```

---

## 3. Pages

### 3.1 Login Page (`/login`)
- Email + password form
- Branded with Investec colors
- Redirects to dashboard on success

### 3.2 Dashboard (`/`)
- Stats cards (pending, approved, denied, waitlisted counts)
- Requests table with pagination, sorting, filtering
- Click row → opens detail panel
- Search bar for name/email
- Export CSV button

### 3.3 Request Detail (slide-over panel)
- Full request information displayed
- **Copy Details** button: copies formatted text to clipboard
- Admin action section: Approve / Deny / Waitlist buttons
- Reason textarea (required for deny/waitlist)
- Shows review history if previously actioned

---

## 4. Copy-to-Clipboard Format

When admin clicks "Copy Details", the following is copied:

```
=== Swag Request #42 ===
Name:  Sipho Mabena
Email: sipho@example.com
Phone: +27821234567
Size:  L
Note:  I built 3 apps on the Investec API this year and spoke at the community meetup!
Status: Pending
Submitted: 01 Mar 2026
```

This makes it easy to paste into CRM, Slack, email, or fulfilment systems.

---

## 5. Component Tree

```
App
├── AuthProvider
│   ├── LoginPage
│   └── ProtectedRoute
│       └── DashboardLayout
│           ├── Header (logo, user info, logout)
│           ├── StatsCards
│           ├── RequestsToolbar (search, filters, export)
│           ├── RequestsTable
│           │   └── RequestRow (clickable)
│           ├── Pagination
│           └── RequestDetailPanel (slide-over)
│               ├── RequestInfo
│               ├── CopyButton
│               └── AdminActions
│                   ├── ReasonInput
│                   └── ActionButtons
```

---

## 6. API Integration (TanStack Query)

```typescript
// lib/api.ts

// Queries
export const useRequests = (filters: RequestFilters) =>
  useQuery({ queryKey: ["requests", filters], queryFn: () => fetchRequests(filters) });

export const useRequest = (id: string) =>
  useQuery({ queryKey: ["request", id], queryFn: () => fetchRequest(id) });

export const useStats = () =>
  useQuery({ queryKey: ["stats"], queryFn: fetchStats });

// Mutations
export const useUpdateStatus = () =>
  useMutation({
    mutationFn: ({ id, status, reason }) => updateRequestStatus(id, status, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["requests"] }),
  });
```

---

## 7. Status Badge Colors

| Status     | Background   | Text     | Tailwind Class                    |
|------------|-------------|----------|-----------------------------------|
| Pending    | Amber-100   | Amber-800| `bg-amber-100 text-amber-800`     |
| Approved   | Green-100   | Green-800| `bg-green-100 text-green-800`     |
| Denied     | Red-100     | Red-800  | `bg-red-100 text-red-800`         |
| Waitlisted | Blue-100    | Blue-800 | `bg-blue-100 text-blue-800`       |

---

## 8. Responsive Considerations

- Primary target: Desktop (1280px+)
- Table collapses to card layout below 768px (nice-to-have)
- Detail panel is full-screen on mobile (nice-to-have)

---

## 9. File Structure

```
packages/admin/
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx              # Entry point
│   ├── App.tsx               # Router setup
│   ├── lib/
│   │   ├── api.ts            # API client functions
│   │   ├── queries.ts        # TanStack Query hooks
│   │   └── utils.ts          # Helpers (clipboard, format)
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   ├── Header.tsx
│   │   ├── StatsCards.tsx
│   │   ├── RequestsTable.tsx
│   │   ├── RequestRow.tsx
│   │   ├── RequestDetail.tsx
│   │   ├── AdminActions.tsx
│   │   ├── CopyButton.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── SearchBar.tsx
│   │   └── Pagination.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   └── DashboardPage.tsx
│   ├── hooks/
│   │   └── useAuth.ts
│   └── styles/
│       └── globals.css
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 10. Authentication Flow

1. Admin navigates to dashboard
2. If no valid JWT in localStorage → redirect to `/login`
3. Login form submits to `POST /api/auth/login`
4. On success, JWT stored in localStorage
5. All subsequent API calls include `Authorization: Bearer <token>`
6. JWT expires after 24 hours → redirect to login
7. Logout clears token and redirects
