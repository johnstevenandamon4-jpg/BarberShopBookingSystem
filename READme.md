# BarberBook — Barber Shop Booking System

A web-based barber shop appointment booking system developed using **React, Laravel, and MySQL** as a mini-capstone project.

## Project Overview

BarberBook provides customers with a convenient way to browse barber services, view barbers, book appointments, and track their appointment status. It also provides an administrative dashboard for monitoring bookings and managing appointment statuses.

The application uses a decoupled React frontend and Laravel REST API backend, with MySQL for database management.

## Features

### Customer
- Register and log in.
- Browse available barbers and services.
- Book appointments.
- View appointment history and status.
- Cancel eligible pending appointments.

### Administrator
- Access the admin dashboard.
- View booking summaries.
- Monitor barber booking counts and availability.
- View appointment records.
- Update appointment statuses.
- Navigate appointment records using pagination.

## Technologies Used

- **Frontend:** React and Vite
- **Backend:** Laravel REST API
- **Database:** MySQL
- **Authentication:** Laravel Sanctum
- **API Communication:** HTTP requests with JSON responses

## Project Documentation and Presentation

Access the Google Drive folder containing the project's supporting materials:

**[Open BarberBook Project Files on Google Drive](https://drive.google.com/drive/folders/1t16yHu2oh6uxwGrpO-Ch94XU99MIHhnT?usp=sharing)**

## Running the Project Locally

### Backend — Laravel

Open a terminal in the `backend` folder and run:

```bash
composer install
php artisan migrate --seed
php artisan serve
```

The API should be available at:

`http://127.0.0.1:8000/api`

Make sure the `.env` file contains the correct MySQL database credentials before migrating.

### Frontend — React

Open another terminal in the `frontend` folder and run:

```bash
npm install
npm run dev
```

Open the local URL displayed by Vite, usually:

`http://localhost:5173`

Both the Laravel backend and React frontend must be running for the application to work correctly.

## Project Purpose

This project demonstrates full-stack web development concepts, including authentication, role-based access, REST API integration, database relationships, CRUD operations, appointment management, and pagination.

## Author

Developed as an individual mini-capstone project for academic purposes.
