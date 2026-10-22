# Requirements checklist (exam PDF → this project)

✅ = done · 🟡 = done but needs your action · ⬜ = you must do it (not code)

> The system also follows the **instructor-approved proposal**: see [`PROPOSAL-ALIGNMENT.md`](PROPOSAL-ALIGNMENT.md).

## Required features

| # | Requirement | Status | Where to show it in the demo |
|---|---|---|---|
| 1 | Auth: register, login, logout, current user, Sanctum token in `Authorization: Bearer` | ✅ | `/register`, `/login`, sidebar **Log out**; token interceptor in `frontend/src/services/api.js` |
| 2 | Role-based access, hidden in React **and** blocked in Laravel | ✅ | Customer typing `/admin` is redirected; Postman: dashboard as customer returns **403** |
| 3 | Full CRUD on ≥ 2 related resources | ✅ | Admin → Barbers and Services (create, edit, delete); Appointments (create, edit, cancel) |
| 4 | Search and filter on ≥ 1 list | 🟡 | Services, Barbers, Appointments toolbars. **Apply `docs/BACKEND-PATCH.md` §1** for server-side search |
| 5 | Pagination from the API (`paginate()`) | ✅ | Services/Barbers (3 per page), Appointments (10 per page) |
| 6 | Dashboard with ≥ 3 figures | ✅ | Admin → Dashboard (6 figures + 2 charts); customer **Home** shows upcoming / pending / completed |
| 7 | Validation on both sides, errors under the fields | ✅ | Book form (empty submit), Add barber with a duplicate email |
| 8 | Loading, success, error messages + confirm before delete | ✅ | Spinner on load, green/red banners, confirm dialogs on cancel/delete/status change |
| 9 | Status workflow changed by the proper role | ✅ | Admin → Appointments: Confirm → Complete / No-show / Cancel |

## Frontend checklist (exam PDF)

| Item | Status | Evidence |
|---|---|---|
| Folders: `components/`, `pages/`, `services/`, `context/` or `hooks/` | ✅ | `frontend/src/` |
| React Router with public, protected and admin-only routes | ✅ | `App.jsx`, `components/RouteGuards.jsx` |
| Single API service file (Axios instance + token interceptor) | ✅ | `services/api.js` (one file per resource builds on it) |
| Auth state shared via Context API | ✅ | `context/AuthContext.jsx` |
| ≥ 3 reusable components | ✅ | `Button`, `FormInput`, `Modal`, `ConfirmDialog`, `DataTable`, `Pagination`, `SearchToolbar`, `StatusBadge`, `Alert`, … |
| Controlled forms, client validation, server (422) errors | ✅ | `hooks/useForm.js`, `utils/validators.js` |
| `useEffect` data fetching with loading and error states | ✅ | `hooks/usePagedData.js`, `AdminDashboard.jsx` |
| Lists with `key`, empty states | ✅ | `DataTable`, `EmptyState` |
| Logout clears token; a 401 redirects to login | ✅ | `AuthContext.jsx` + response interceptor |
| Responsive, usable on a phone | ✅ | Sidebar becomes a top bar < 900 px; tables scroll inside their container |

## Backend checklist (your Laravel project)

| Item | Status | Note |
|---|---|---|
| Migrations with foreign keys | ✅ | users, barbers, services, appointments, customer_notifications |
| Eloquent models with relationships | ✅ | |
| Seeders: 1 admin, regular accounts, ≥ 20 records | ✅ | 6 users + 5 barbers + 5 services + 10 appointments = 26 |
| Realistic seed data | 🟡 | Rename "Customer 1…5" (`BACKEND-PATCH.md` §4) |
| Routes grouped and protected with `auth:sanctum` | ✅ | |
| Resource controllers | ✅ | |
| Form Request classes on every create/update | 🟡 | Appointments ✅; barbers/services via `BACKEND-PATCH.md` §2 |
| API Resources (`JsonResource`) | ⬜ | Optional, see `BACKEND-PATCH.md` §7 |
| Role check via middleware / Policy | ✅ | `admin` middleware |
| Correct status codes (200, 201, 204, 401, 403, 404, 422) | ✅ | |
| CORS | ✅ | Laravel default allows the React origin |
| Eager loading (`with()`) | ✅ | `AppointmentController@index` |
| `.env.example` works for a fresh clone | 🟡 | Replace with `backend-patch/.env.example` (§3) |

## Deliverables

| Deliverable | Status | Action |
|---|---|---|
| GitHub repo: `/backend` + `/frontend`, no `vendor/`, `node_modules/`, real `.env` | ⬜ | Check `.gitignore` files; run `git status` |
| `README.md` (title, name, theme, features, stack, setup, demo accounts) | 🟡 | Fill in **your name**, slide and video links |
| ERD image in `/docs` | ✅ | `docs/ERD.png` |
| API docs (Postman collection or endpoint table) | ✅ | `docs/API.md` + `docs/postman/…json` |
| Screenshots of main pages in `/docs/screenshots` | ⬜ | Follow `docs/SCREENSHOTS-GUIDE.md` |
| Presentation slides (PDF) in `/docs` | ⬜ | Export your PPT to `docs/BarberBook-slides.pdf` (max 8 slides) |
| Demo video (5–8 min) linked in the README | ⬜ | Record using `docs/DEMO-SCRIPT.md` |
| ≥ 20 meaningful commits across the 2 weeks | ⬜ | Commit in small steps from now on, with clear messages |
| "References" section declaring AI help | ✅ | README §11 |

## Bonus (up to +10)

| Bonus | Status |
|---|---|
| Charts on the dashboard (+2) | ✅ CSS bar charts |
| Image upload (+3), deployment (+3), Laravel feature tests (+2), PDF/CSV export or dark mode (+2 each) | ⬜ only if time allows |
