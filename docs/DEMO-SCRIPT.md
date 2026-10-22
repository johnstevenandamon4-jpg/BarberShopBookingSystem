# Client presentation script (15–20 minutes, no Q&A)

Before you start: backend (`php artisan serve`) and frontend (`npm run dev`) are **already running**, database freshly
seeded (`php artisan migrate:fresh --seed`), browser open on `http://localhost:5173`, two browser profiles or
windows ready (one customer, one admin). Business casual, speak to the client.

## 1. Opening (2 min)
"Good day, I'm **[Name]**, the developer of BarberBook. Your shop takes bookings by phone and walk-in, which causes
double-bookings and forgotten appointments, and you can't see how busy each barber is. I built a system where customers
request a slot online, you confirm it, and both sides can follow the status."
Goals: fewer double bookings · one place for all bookings · simple statistics for the owner.

## 2. Solution overview (3 min): slides 2–4
* **Roles:** guest, customer, administrator (what each can do).
* **ERD in plain words:** "A customer books an appointment with one barber for one service. The appointment moves from
  pending to confirmed to completed."
* **How it works:** website (React) talks to a secure API (Laravel) which stores data in MySQL. Login gives a token;
  the server checks that token and the role on every private request.

## 3. Live walkthrough (8–10 min): scenario: *"A customer books a haircut, the shop confirms it, the customer sees the update."*

| Min | Do this | Requirement shown |
|---|---|---|
| 0:00 | Guest home → **Services**: type "fade" in search, use the availability filter, click **Next** | Search, filter, pagination |
| 1:00 | Click **Book this service** → redirected to login | Protected routes |
| 1:20 | Click **Sign in** empty → red messages; wrong password → server message | Client + server validation |
| 1:50 | **Fill customer** → sign in → booking form opens with the service pre-selected | Auth, token |
| 2:10 | Submit empty form → errors under fields. Pick barber/date/time → **Request appointment** | Validation, success message |
| 3:00 | Book the same barber/time again → "already has an appointment" | Business rule (422) |
| 3:15 | Customer **Home** shows the dashboard: upcoming / pending / completed and the upcoming table | Customer dashboard (proposal §5.2) |
| 3:30 | **My appointments**: only this customer's records; filter by status and by date; **Details**; **Edit** a pending one; **Cancel** (confirm dialog) | Own data only, CRUD, confirm step |
| 5:00 | Sidebar: Log out → show the navbar has no Log in link when signed in, then sign in as admin (**Fill admin**) | Role-based UI |
| 5:30 | **Dashboard**: 6 figures + charts | Dashboard |
| 6:15 | **Appointments**: search a customer, filter *Pending* and by date, **Confirm** or **Reject** (confirm dialog) → success message | Status workflow |
| 7:15 | **Barbers**: add with an existing email → error under field; add properly; edit; **Mark unavailable**; try deleting one with bookings → friendly message | Admin CRUD, validation |
| 8:30 | **Services**: add / edit / deactivate | Admin CRUD |
| 9:00 | Back as customer: **Notifications** and the new status in **My appointments** | End-to-end result |
| 9:30 | (Optional) Open `/admin` while logged in as customer → redirected; Postman call returns 403 | Security on both sides |

## 4. Handover (2–3 min)
Show the GitHub repo and README (setup steps, demo accounts), the Postman collection / `docs/API.md`, and explain security:
"Admin pages are hidden in the app **and** blocked by the server, so a customer can't reach them even by typing the address."

## 5. Closing (2 min)
* **Delivered vs. proposal:** every planned feature in the approved proposal was delivered; reminders are in-app only. Read it from `docs/PROPOSAL-ALIGNMENT.md` §7.
* **Known limitations:** no forgot-password; the customer types a time instead of picking a slot button; conflicts are checked for the same start time; barbers/services with bookings can't be deleted (deactivate instead).
* **Phase 2:** SMS/e-mail reminders, forgot password, barber working days + slot picker, overlap by service duration, online payment, reports export.

### Last-minute checklist
- [ ] `php artisan migrate:fresh --seed` done, both servers running
- [ ] Zoom/browser at 110–125 % so the room can read it
- [ ] Demo video link ready as backup (10-minute setup window rule)
- [ ] Slides ≤ 8 and exported to PDF
