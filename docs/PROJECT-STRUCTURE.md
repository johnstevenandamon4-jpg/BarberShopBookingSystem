# Project structure with change markers

| Marker | Meaning |
|---|---|
| 🆕 NEW | File did not exist before. Add it. |
| ♻️ REPLACED | A file with this name existed in your project (or in my first round of files). Overwrite it with the new one. |
| ✏️ UPDATED | Your original backend file with small edits. Overwrite it. |
| 🔁 RENAMED / MOVED | Old file is gone, its content now lives under a new name or folder. |
| ❌ REMOVED | Delete this old file. Nothing uses it any more. |
| ⚪ (yours) | Your own file. Do not touch it. |
| ➖ OPTIONAL | Keep or delete, nothing depends on it. |

---

## 1. Files to REMOVE from your old frontend

These are from the earlier version (single-page app without a router). The new frontend replaces them all.

| ❌ Delete | Replaced by |
|---|---|
| `frontend/src/pages/HomePage.jsx` | 🔁 `pages/Home.jsx` (+ `Services.jsx`, `Barbers.jsx`, `Book.jsx` split out of it) |
| `frontend/src/pages/LoginPage.jsx` | 🔁 `pages/Login.jsx` (+ new `Register.jsx`) |
| `frontend/src/pages/AdminDashboard.jsx` | 🔁 `pages/admin/AdminDashboard.jsx` (+ `AdminAppointments.jsx`, `AdminBarbers.jsx`, `AdminServices.jsx`) |
| `frontend/src/theme.css` (if you created it) | ♻️ merged into `src/App.css` |
| `frontend/.gitignore` | ➖ optional, the root `.gitignore` now covers it |
| old `backend/.env.example` (SQLite version) | ♻️ replaced by `docs/backend-patch/.env.example` |

`App.jsx`, `App.css` and `pages/MyAppointments.jsx` keep their names but are **REPLACED** with new content.

---

## 2. Repository root

```
barberbook/
├── .gitignore                         ♻️ REPLACED  (now covers node_modules, vendor, .env for both folders)
├── README.md                           🆕 NEW       (add your name, shop name, slide + video links)
├── backend/                            ← your Laravel API
├── frontend/                           ← React app
└── docs/                               ← documentation
```

## 3. backend/  (your files + 8 small changes)

```
backend/
├── .env                                        ⚪ (yours, never commit)
├── .env.example                                ♻️ REPLACED  ← docs/backend-patch/.env.example (MySQL, empty APP_KEY)
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── Api/
│   │   │       ├── AdminDashboardController.php          ⚪
│   │   │       ├── AppointmentController.php             ✏️ UPDATED  (search + status + date filter)
│   │   │       ├── AuthController.php                    ⚪
│   │   │       ├── BarberController.php                  ✏️ UPDATED  (search + available filter, Form Requests)
│   │   │       ├── CustomerNotificationController.php    ⚪
│   │   │       └── ServiceController.php                 ✏️ UPDATED  (search + active filter, Form Requests)
│   │   ├── Middleware/
│   │   │   └── AdminMiddleware.php                       ⚪
│   │   └── Requests/
│   │       ├── StoreAppointmentRequest.php               ⚪
│   │       ├── UpdateAppointmentRequest.php              ⚪
│   │       ├── StoreBarberRequest.php                    🆕 NEW
│   │       ├── UpdateBarberRequest.php                   🆕 NEW
│   │       ├── StoreServiceRequest.php                   🆕 NEW
│   │       └── UpdateServiceRequest.php                  🆕 NEW
│   └── Models/                                           ⚪ Appointment, Barber, CustomerNotification, Service, User
├── bootstrap/app.php                                     ⚪
├── database/
│   ├── factories/UserFactory.php                         ⚪
│   ├── migrations/                                       ⚪ (all of them)
│   └── seeders/
│       ├── DatabaseSeeder.php                            ⚪ (optional: rename "Customer 1…5", see BACKEND-PATCH §4)
│       ├── BarberSeeder.php                              ⚪
│       ├── ServiceSeeder.php                             ⚪
│       └── AppointmentSeeder.php                         ⚪
├── resources/views/welcome.blade.php                     ⚪
└── routes/ api.php · console.php · web.php               ⚪ (no route changes needed)
```

Copy map (from `docs/backend-patch/`): the 3 controllers → `backend/app/Http/Controllers/Api/`,
the 4 request files → `backend/app/Http/Requests/`, `.env.example` → `backend/.env.example`.
**Routes, models, migrations and seeders are not changed.**

## 4. frontend/  (everything NEW or REPLACED)

```
frontend/
├── .env.example                         🆕 NEW  ➖ optional
├── .gitignore                           🆕 NEW  ➖ optional
├── index.html                           ♻️ REPLACED
├── package.json                         ♻️ REPLACED  (adds react-router-dom, axios, vite)
├── vite.config.js                       ♻️ REPLACED
└── src/
    ├── main.jsx                         ♻️ REPLACED  (BrowserRouter + AuthProvider)
    ├── App.jsx                          ♻️ REPLACED  (route map: public / customer / admin)
    ├── App.css                          ♻️ REPLACED  (theme + all component styles)
    │
    ├── services/                        🆕 NEW folder  (API layer)
    │   ├── api.js                       🆕 one Axios instance, Bearer token, 401 handling
    │   ├── authApi.js                   🆕
    │   ├── barberApi.js                 🆕
    │   ├── serviceApi.js                🆕
    │   ├── appointmentApi.js            🆕
    │   ├── notificationApi.js           🆕
    │   └── dashboardApi.js              🆕
    │
    ├── context/                         🆕 NEW folder
    │   └── AuthContext.jsx              🆕 user, login, register, logout, role
    │
    ├── hooks/                           🆕 NEW folder
    │   ├── useForm.js                   🆕 controlled forms + validation + 422 errors
    │   ├── usePagedData.js              🆕 fetch a page (loading / error)
    │   ├── useListControls.js           🆕 search + filters + page
    │   ├── useDebouncedValue.js         🆕
    │   ├── useCatalog.js                🆕 all barbers/services for dropdowns
    │   └── useFlash.js                  🆕 self-clearing success message
    │
    ├── utils/                           🆕 NEW folder
    │   ├── format.js                    🆕 dates, times, prices, status labels
    │   ├── validators.js                🆕 client-side validation rules
    │   └── filters.js                   🆕
    │
    ├── components/                      🆕 NEW folder  (reusable UI)
    │   ├── Layout.jsx                   🆕 sidebar + page outlet, per role
    │   ├── RouteGuards.jsx              🆕 ProtectedRoute, GuestRoute, PublicArea
    │   ├── AuthLayout.jsx               🆕 login / register frame
    │   ├── Button.jsx                   🆕
    │   ├── FormInput.jsx                🆕
    │   ├── FormCheckbox.jsx             🆕
    │   ├── Modal.jsx                    🆕
    │   ├── ConfirmDialog.jsx            🆕
    │   ├── DataTable.jsx                🆕
    │   ├── Pagination.jsx               🆕
    │   ├── SearchToolbar.jsx            🆕 search + filters + date filter
    │   ├── StatusBadge.jsx              🆕
    │   ├── Alert.jsx                    🆕
    │   ├── LoadingState.jsx             🆕
    │   ├── EmptyState.jsx               🆕
    │   ├── AppointmentForm.jsx          🆕 used by Book and the Edit dialog
    │   ├── AppointmentDetails.jsx       🆕
    │   ├── CustomerSummary.jsx          🆕 customer dashboard (proposal §5.2)
    │   └── BarberPole.jsx               ♻️ REPLACED (moved here from the old setup)
    │
    └── pages/
        ├── Home.jsx                     🔁 replaces HomePage.jsx            /
        ├── Services.jsx                 🆕                                   /services
        ├── Barbers.jsx                  🆕                                   /barbers
        ├── Login.jsx                    🔁 replaces LoginPage.jsx            /login
        ├── Register.jsx                 🆕                                   /register
        ├── Book.jsx                     🆕                                   /book              (customer)
        ├── MyAppointments.jsx           ♻️ REPLACED                          /my-appointments   (customer)
        ├── Notifications.jsx            🆕                                   /notifications     (customer)
        ├── NotFound.jsx                 🆕                                   *
        └── admin/                       🆕 NEW folder
            ├── AdminDashboard.jsx       🔁 moved from pages/AdminDashboard.jsx   /admin
            ├── AdminAppointments.jsx    🆕                                   /admin/appointments
            ├── AdminBarbers.jsx         🆕                                   /admin/barbers
            └── AdminServices.jsx        🆕                                   /admin/services
```

## 5. docs/  (all NEW)

```
docs/
├── Project-Proposal.docx                🆕 your approved proposal (copy)
├── PROPOSAL-ALIGNMENT.md                🆕 proposal vs delivered system
├── API.md                               🆕
├── ERD.md · ERD.png · ERD.svg           🆕
├── WIREFRAMES.md                        🆕
├── wireframes/                          🆕 01-login … 09-customer-dashboard  (.png + .svg)
├── postman/BarberBook.postman_collection.json   🆕
├── BACKEND-PATCH.md                     🆕 how to apply the backend changes
├── REQUIREMENTS-CHECKLIST.md            🆕
├── DEMO-SCRIPT.md                       🆕
├── SCREENSHOTS-GUIDE.md                 🆕
├── PROJECT-STRUCTURE.md                 🆕 this file
├── screenshots/                         ← you add 16 screenshots
├── BarberBook-slides.pdf                ← you export your PPT here
└── backend-patch/                       🆕 copy-ready backend files (delete after applying, or keep)
    ├── .env.example
    └── app/Http/
        ├── Controllers/Api/  AppointmentController.php · BarberController.php · ServiceController.php
        └── Requests/         StoreBarberRequest.php · UpdateBarberRequest.php · StoreServiceRequest.php · UpdateServiceRequest.php
```

## 6. Totals

| | 🆕 New | ♻️ Replaced | ✏️ Updated | 🔁 Renamed | ❌ Remove |
|---|---|---|---|---|---|
| backend | 4 | 1 (`.env.example`) | 3 | 0 | 0 |
| frontend | 46 | 8 | 0 | 3 | 3–4 |
| root | 1 (`README.md`) | 1 (`.gitignore`) | 0 | 0 | 0 |
| docs | all | n/a | n/a | n/a | n/a |
