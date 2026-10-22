# BarberBook: Barber Shop Booking System

BarberBook is a full-stack web app that lets a small barber shop take bookings online instead of by phone or walk-in.
Customers browse services and barbers, request an appointment, and follow its status. The shop administrator confirms,
completes or cancels bookings, manages barbers and services, and sees booking statistics on a dashboard.

---

## 1. The client and the problem

| | |
|---|---|
| **Client** | A small neighbourhood barber shop with several barbers |
| **Problem today** | Bookings are taken by phone and walk-in, so slots get double-booked, customers forget their appointments, and the owner has no record of how busy each barber is. |
| **Goal** | One system where customers request a slot, the shop confirms it, and both sides can see the status at any time. |

## 2. User roles

| Role | What they can do |
|---|---|
| **Guest** | Browse services and barbers (search, filter, pagination), register, log in |
| **Customer** (5 seeded) | Book appointments, edit or cancel pending ones, mark a confirmed visit as done, view only their own appointments, read and mark notifications |
| **Administrator** (1 seeded) | Dashboard statistics, view **all** appointments and change their status (pending → confirmed → completed / cancelled / no-show), full CRUD on barbers and services, set barber availability |

## 3. Features (mapped to the exam requirements)

| # | Requirement | Where it is implemented |
|---|---|---|
| 1 | Authentication (register, login, logout, current user, Sanctum token in `Authorization: Bearer`) | `AuthController` · `frontend/src/context/AuthContext.jsx` · `services/api.js` |
| 2 | Role-based access (hidden in React **and** blocked in Laravel) | `admin` middleware + checks in `AppointmentController` · `components/RouteGuards.jsx` |
| 3 | Full CRUD on ≥ 2 related resources | **Barbers** and **Services** (admin CRUD) and **Appointments** (create, view, edit, cancel). `appointments` belongs to users, barbers and services. |
| 4 | Search and filter | Services (`search`, `active`), Barbers (`search`, `available`), Appointments (`search`, `status`) |
| 5 | Pagination from the API | Laravel `paginate()` on barbers, services, appointments and notifications, shown by `components/Pagination.jsx` |
| 6 | Dashboard with ≥ 3 figures | 6 figures (total, pending, confirmed, completed, cancelled, no-show) + 2 bar charts |
| 7 | Validation on both sides | React: `utils/validators.js` with `useForm`. Laravel: Form Request classes. 422 errors are shown **under the matching field**. |
| 8 | User feedback | Loading states, success/error banners, empty states, confirm dialogs before cancel / delete / status change |
| 9 | Status workflow | `pending → confirmed → completed`, or `cancelled` / `no_show`, changed by the proper role |

**Bonus items done:** dashboard charts (pure CSS bars) ✔ · Laravel feature tests *(add if you wrote them)* · deployment *(add if you deploy)*

## 4. Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router 6, Axios, Context API, custom hooks, plain responsive CSS |
| Backend | Laravel 11/12, PHP 8.2+, Laravel Sanctum (API tokens), Form Requests, Eloquent |
| Database | MySQL / MariaDB (migrations + seeders) |
| Tools | Git + GitHub, Postman, Composer, npm |

## 5. Project structure

```
barberbook/                      ← repository root
├── README.md                    ← this file
├── backend/                     ← Laravel REST API
├── frontend/                    ← React single-page app
    ├── package.json
    ├── .env.example
    └── src/
        ├── App.jsx              ← route map (public / customer / admin)
        ├── main.jsx
        ├── App.css              ← theme + component styles
        ├── services/            ← api.js (Axios instance + token + 401 handling) and one file per resource
        ├── context/             ← AuthContext (login state shared app-wide)
        ├── hooks/               ← useForm, usePagedData, useListControls, useCatalog, ...
        ├── components/          ← Button, FormInput, Modal, ConfirmDialog, DataTable, Pagination, ...
        ├── pages/               ← Home, Services, Barbers, Book, MyAppointments, Notifications, Login, Register
        │   └── admin/           ← AdminDashboard, AdminAppointments, AdminBarbers, AdminServices
        └── utils/               ← validators, formatters, filters


## 6. Setup (works on a fresh clone)

**Requirements:** PHP 8.2+, Composer, Node.js 18+, MySQL/MariaDB (XAMPP is fine), Git.

### Backend (Laravel API)

```bash
cd backend
composer install
cp .env.example .env
# edit .env → DB_CONNECTION=mysql, DB_DATABASE=barber_shop_booking, DB_USERNAME=root, DB_PASSWORD=
php artisan key:generate
# create an empty database named barber_shop_booking in phpMyAdmin / MySQL first
php artisan migrate --seed
php artisan serve          # API runs at http://127.0.0.1:8000
```

### Frontend (React)

```bash
cd frontend
npm install
cp .env.example .env       # VITE_API_URL=http://127.0.0.1:8000/api
npm run dev                # app runs at http://localhost:5173
```

> Start the **backend first**, then the frontend. Both must be running during the demo.

## 7. Demo accounts (created by `php artisan migrate --seed`)

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@barbershop.test` | `Admin12345!` |
| Customer | `customer1@barbershop.test` … `customer5@barbershop.test` | `Customer123!` |

The login page also has **Fill admin / Fill customer** buttons for quick demos.

## 8. How the pieces connect

```
React page ──► service file (services/*.js) ──► Axios instance (adds Bearer token)
                                                     │
                                                     ▼
                      Laravel routes/api.php ─► auth:sanctum ─► admin middleware
                                                     │
                                    Controller ─► Form Request validation ─► Eloquent ─► MySQL
```

* A **401** response clears the token and sends the user to `/login` with a message.
* A **422** response puts each error message under its form field.
* A **403** is returned by Laravel if a customer calls an admin endpoint, even if the UI is bypassed.

## 9. API documentation

See [`docs/API.md`](docs/API.md) for the endpoint table and import
[`docs/postman/BarberBook.postman_collection.json`](docs/postman/BarberBook.postman_collection.json) into Postman
(run **Login (admin)** or **Login (customer)** first; the token is saved automatically).

## 10. Delivered features vs. the original proposal, known limitations, Phase 2

* **Known limitations:** a barber or service that already has appointments cannot be deleted (the database protects the history). Mark them *unavailable/inactive* instead. Notifications are in-app only.
* **Phase 2 ideas:** e-mail / SMS reminders, barber working-hours and slot picker, customer reviews, online payment, PDF/CSV export of bookings, deployment.

## 11. References and AI-use declaration

Per the exam's academic-integrity rules, outside help used in this project:

* **AI assistants (ChatGPT, Claude):** helped design and write parts of the Laravel API and the React frontend (React Router refactor, reusable components, hooks, styling), and helped generate the ERD, wireframes, Postman collection and documentation. All code was reviewed, run and tested by the developer.
* Official documentation: [Laravel](https://laravel.com/docs), [Laravel Sanctum](https://laravel.com/docs/sanctum), [React](https://react.dev), [React Router](https://reactrouter.com), [Axios](https://axios-http.com), [Vite](https://vite.dev).
* No starter kit (Breeze) and no downloaded template was used. *(Edit this line if you did use one.)*
