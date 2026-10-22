# Backend patch (small, optional-but-recommended)

Your backend already works with the new frontend. These changes add what the exam PDF still asks for and fix a few
things graders may notice. **Nothing here changes the JSON shape**, so the frontend keeps working before and after.

> Back up first (`git commit -am "before patch"`), copy the files, then run `php artisan optimize:clear`.

## 1. Server-side search and filter (exam requirement #4)

| Copy this file | To your project |
|---|---|
| `backend-patch/app/Http/Controllers/Api/BarberController.php` | `backend/app/Http/Controllers/Api/BarberController.php` |
| `backend-patch/app/Http/Controllers/Api/ServiceController.php` | `backend/app/Http/Controllers/Api/ServiceController.php` |
| `backend-patch/app/Http/Controllers/Api/AppointmentController.php` | `backend/app/Http/Controllers/Api/AppointmentController.php` |

What changed (compare with your originals using `git diff`):

* `GET /api/barbers?search=&available=1|0`: keyword search on name/description/email/phone, availability filter
* `GET /api/services?search=&active=1|0`: keyword search on name/description, active filter
* `GET /api/appointments?search=&status=&date=YYYY-MM-DD`: search customer/barber/service, filter by status and by day (works for both roles; the proposal's wireframes 5.5 and 5.6 include a Date filter)
* `->withQueryString()` so page links keep the search/filter

> The React app also re-applies the same filter to the rows it receives, so it still behaves if you skip this patch,
> but then search/filter only applies to the current page instead of the whole table.
> **Apply it so the search is truly server-side.**

## 2. Form Request classes for barbers and services (exam backend checklist)

The checklist says *"Form Request classes for validation on every create/update"*. Appointments already use them;
barbers and services validated inline. Copy these four new files (the controllers above already use them):

```
backend-patch/app/Http/Requests/StoreBarberRequest.php    → backend/app/Http/Requests/
backend-patch/app/Http/Requests/UpdateBarberRequest.php   → backend/app/Http/Requests/
backend-patch/app/Http/Requests/StoreServiceRequest.php   → backend/app/Http/Requests/
backend-patch/app/Http/Requests/UpdateServiceRequest.php  → backend/app/Http/Requests/
```

The rules are identical to your inline rules (plus friendlier messages), so behaviour does not change.
**If you copy the controllers you must copy these four files too.**

## 3. Fix `.env.example` (important for "runs on a fresh clone")

Your pushed `.env.example` uses `DB_CONNECTION=sqlite`, but the project runs on MySQL, so a fresh clone would fail with
the README steps. It may also contain a real `APP_KEY`. Replace it with `backend-patch/.env.example`
(MySQL settings, **empty** `APP_KEY`), then commit it. Never commit the real `.env`.

If a real `APP_KEY` was ever pushed to GitHub, run `php artisan key:generate` locally; the old key is then unused.

## 4. Realistic seed data (presentation standard)

The PDF says seed data must look real. Your customers are named "Customer 1" … "Customer 5". In
`database/seeders/DatabaseSeeder.php` change the loop to:

```php
$customerNames = [
    'Maria Santos',
    'Juan Dela Cruz',
    'Angela Reyes',
    'Carlo Mendoza',
    'Patricia Gomez',
];

foreach (range(1, 5) as $number) {
    User::updateOrCreate(
        ['email' => "customer{$number}@barbershop.test"],
        [
            'name' => $customerNames[$number - 1],
            'password' => Hash::make('Customer123!'),
            'role' => 'customer',
        ]
    );
}
```

Emails and passwords stay the same, so the demo credentials in the README still work. Re-seed with
`php artisan migrate:fresh --seed`.

## 5. Quick backend self-test (before the demo)

```bash
php artisan route:list --path=api        # all endpoints present
php artisan migrate:fresh --seed         # clean demo data
```

Then import `docs/postman/BarberBook.postman_collection.json` and run: **Login (admin)** → Dashboard → List ALL
appointments → Filter by status. Run **Login (customer)** → Dashboard → expect **403**.

## 6. Optional: CORS

Laravel 11 allows cross-origin API calls by default. To restrict to the React dev server:
`php artisan config:publish cors`, then in `config/cors.php` set `'allowed_origins' => ['http://localhost:5173']`.

## 7. Optional: API Resources (exam checklist: `JsonResource`)

Your controllers return models/paginators directly. If you want to tick the `JsonResource` item, create
`php artisan make:resource BarberResource` (and Service/Appointment), and return
`BarberResource::collection($paginator)` / `new BarberResource($barber)`. The React app already understands both the
current paginator shape and the Resource shape (`{ data, links, meta }`), so switching later will not break it.
Only do this if you have time; the rest of the system does not depend on it.
