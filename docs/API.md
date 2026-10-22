# BarberBook REST API

Base URL: `http://127.0.0.1:8000/api` · Format: JSON · Auth: Laravel Sanctum bearer token

Send these headers on every request:

```
Accept: application/json
Authorization: Bearer <token>      (only for protected endpoints)
Content-Type: application/json     (when sending a body)
```

## Endpoints

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/register` | Public | Create a customer account. Returns `{ message, user, token }` (201) |
| POST | `/login` | Public | Log in. Returns `{ message, user, token }` |
| POST | `/logout` | Auth | Revoke the current token |
| GET | `/me` | Auth | Current user `{ user }` |
| GET | `/barbers?search=&available=&page=` | Public | Paginated barbers (3 per page) |
| GET | `/barbers/{id}` | Public | One barber |
| POST | `/barbers` | **Admin** | Create barber (201) |
| PUT/PATCH | `/barbers/{id}` | **Admin** | Update barber |
| DELETE | `/barbers/{id}` | **Admin** | Delete barber (204) |
| GET | `/services?search=&active=&page=` | Public | Paginated services (3 per page) |
| GET | `/services/{id}` | Public | One service |
| POST | `/services` | **Admin** | Create service (201) |
| PUT/PATCH | `/services/{id}` | **Admin** | Update service |
| DELETE | `/services/{id}` | **Admin** | Delete service (204) |
| GET | `/appointments?search=&status=&date=&page=` | Auth | Customer: own appointments · Admin: all (10 per page) |
| POST | `/appointments` | Auth | Create appointment (201) |
| GET | `/appointments/{id}` | Owner / Admin | One appointment |
| PUT/PATCH | `/appointments/{id}` | Owner (pending only) / Admin | Customer edits details · Admin changes `status` |
| DELETE | `/appointments/{id}` | Owner | Customer cancels a pending appointment (admins use status change) |
| POST | `/appointments/{id}/complete` | Owner | Customer marks a past, confirmed appointment as completed |
| GET | `/notifications?page=` | Auth | Customer's notifications (10 per page) |
| PATCH | `/notifications/{id}/read` | Owner | Mark one notification as read |
| GET | `/admin/dashboard` | **Admin** | `{ summary, bookings_by_barber, recent_appointments }` |

### Query parameters

| Parameter | Used on | Meaning |
|---|---|---|
| `page` | all lists | Page number (Laravel `paginate()`) |
| `search` | barbers, services, appointments | Keyword (name / description / email / phone · customer, barber, service) |
| `available` | barbers | `1` available only, `0` unavailable only |
| `active` | services | `1` active only, `0` inactive only |
| `status` | appointments | `pending`, `confirmed`, `completed`, `cancelled`, `no_show` |
| `date` | appointments | `YYYY-MM-DD`: only appointments on that day |

### Status workflow

```
pending ──► confirmed ──► completed
   │            ├────────► no_show
   └────────────┴────────► cancelled
```

## Response shapes

**Paginated list** (barbers, services, appointments, notifications)

```json
{
  "current_page": 1,
  "data": [ { "id": 1, "name": "Basic Haircut" } ],
  "last_page": 2,
  "per_page": 3,
  "total": 5
}
```

**Single record / created / updated**

```json
{ "message": "Barber created successfully.", "data": { "id": 6, "name": "Ramon" } }
```

**Validation error (422)**: shown under each field in React

```json
{
  "message": "The email has already been taken.",
  "errors": { "email": ["A barber with this email already exists."] }
}
```

## HTTP status codes used

| Code | When |
|---|---|
| 200 | Successful read / update / login / logout |
| 201 | Resource created (register, appointment, barber, service) |
| 204 | Deleted (barber, service); no body |
| 401 | Missing or invalid token → React clears the token and redirects to `/login` |
| 403 | Authenticated but wrong role / not the owner (e.g. customer calling `/admin/dashboard`) |
| 404 | Record not found |
| 422 | Validation failed or a business rule was broken (double-booking, invalid status change) |

## Roles and security

* `auth:sanctum` protects every private route; the custom `admin` middleware returns **403** for non-admins.
* Customers can only read and change **their own** appointments (checked in `AppointmentController`).
* Passwords are hashed; tokens are revoked on logout.
