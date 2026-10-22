# Screenshots to take (save in `docs/screenshots/`)

Take these **after** the project runs with real seeded data (not my test data). Browser width ≈ 1280 px, zoom 100 %.
Use **Win + Shift + S** (Windows) or **Cmd + Shift + 4** (Mac). Save as PNG with exactly these file names.

| # | File name | Where / how to get it |
|---|---|---|
| 1 | `01-login.png` | `/login` while signed out |
| 2 | `02-register-validation.png` | `/register`, click **Create account** with empty fields (shows errors under fields) |
| 3 | `03-home-customer.png` | Log in as a customer → `/` |
| 4 | `04-services-search.png` | `/services` with something typed in search and page 1 of 2 visible |
| 5 | `05-book-validation.png` | `/book` after clicking **Request appointment** with empty fields |
| 6 | `06-my-appointments.png` | `/my-appointments` (customer) with the status filter visible |
| 7 | `07-confirm-dialog.png` | Click **Cancel** on a pending appointment (dialog open) |
| 8 | `08-notifications.png` | `/notifications` |
| 9 | `09-admin-dashboard.png` | Log in as admin → `/admin` (full page: cards + charts) |
| 10 | `10-admin-appointments.png` | `/admin/appointments` filtered by *Pending* |
| 11 | `11-admin-barbers-form.png` | `/admin/barbers` → **Add barber** → submit with a duplicate email (error under the field) |
| 12 | `12-admin-services.png` | `/admin/services` |
| 13 | `13-mobile-home.png` | Chrome DevTools (F12) → device toolbar → iPhone 12 → `/` |
| 14 | `14-mobile-appointments.png` | Same phone view on `/my-appointments` |
| 15 | `15-postman-collection.png` | Postman with the BarberBook collection run showing green tests |
| 16 | `16-database-tables.png` | phpMyAdmin showing the 5 tables with data |

After saving, add 3–4 of them to the README (optional): `![Dashboard](docs/screenshots/09-admin-dashboard.png)`.
