# Entity Relationship Diagram

![ERD](ERD.png)

Editable vector version: [`ERD.svg`](ERD.svg).

## Relationships

| Relationship | Type | Meaning |
|---|---|---|
| `users` → `appointments` | one-to-many | A customer has many appointments (`appointments.user_id`) |
| `barbers` → `appointments` | one-to-many | A barber has many appointments (`appointments.barber_id`) |
| `services` → `appointments` | one-to-many | A service is booked in many appointments (`appointments.service_id`) |
| `users` → `customer_notifications` | one-to-many | A customer receives many notifications |
| `appointments` → `customer_notifications` | one-to-many | An appointment can generate several notifications |

Foreign-key rules: deleting a **user** cascades to their appointments and notifications; a **barber** or **service** that
has appointments **cannot be deleted** (`restrict`), which protects booking history.

## Mermaid version (renders automatically on GitHub)

```mermaid
erDiagram
    USERS ||--o{ APPOINTMENTS : "books"
    BARBERS ||--o{ APPOINTMENTS : "serves"
    SERVICES ||--o{ APPOINTMENTS : "is booked as"
    USERS ||--o{ CUSTOMER_NOTIFICATIONS : "receives"
    APPOINTMENTS ||--o{ CUSTOMER_NOTIFICATIONS : "triggers"

    USERS {
        bigint id PK
        string name
        string email UK
        string password
        string role "admin | customer"
    }
    BARBERS {
        bigint id PK
        string name
        string phone
        string email UK
        text description
        boolean is_available
    }
    SERVICES {
        bigint id PK
        string name
        text description
        decimal price
        smallint duration_minutes
        boolean is_active
    }
    APPOINTMENTS {
        bigint id PK
        bigint user_id FK
        bigint barber_id FK
        bigint service_id FK
        date appointment_date
        time appointment_time
        enum status "pending|confirmed|completed|cancelled|no_show"
        text notes
    }
    CUSTOMER_NOTIFICATIONS {
        bigint id PK
        bigint user_id FK
        bigint appointment_id FK
        string title
        text message
        timestamp read_at
    }
```
