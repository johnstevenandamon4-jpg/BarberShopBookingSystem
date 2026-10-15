<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAppointmentRequest;
use App\Http\Requests\UpdateAppointmentRequest;
use App\Models\Appointment;
use App\Models\Barber;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AppointmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if (! in_array($request->user()->role, ['admin', 'customer'], true)) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $appointments = Appointment::query()
            ->with([
                'customer:id,name,email',
                'barber:id,name',
                'service:id,name,price',
            ])
            ->when(
                $request->user()->role === 'customer',
                fn ($query) => $query->where('user_id', $request->user()->id)
            )
            ->latest()
            ->paginate(10);

        return response()->json($appointments);
    }

    public function store(StoreAppointmentRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $barber = Barber::findOrFail($validated['barber_id']);
        $service = Service::findOrFail($validated['service_id']);

        if (! $barber->is_available) {
            return response()->json([
                'message' => 'This barber is currently unavailable.',
            ], 422);
        }

        if (! $service->is_active) {
            return response()->json([
                'message' => 'This service is currently unavailable.',
            ], 422);
        }

        $appointment = DB::transaction(function () use ($request, $validated) {
            $conflictExists = Appointment::query()
                ->where('barber_id', $validated['barber_id'])
                ->whereDate('appointment_date', $validated['appointment_date'])
                ->where('appointment_time', $validated['appointment_time'])
                ->whereIn('status', ['pending', 'confirmed'])
                ->lockForUpdate()
                ->exists();

            if ($conflictExists) {
                return null;
            }

            return Appointment::create([
                'user_id' => $request->user()->id,
                'barber_id' => $validated['barber_id'],
                'service_id' => $validated['service_id'],
                'appointment_date' => $validated['appointment_date'],
                'appointment_time' => $validated['appointment_time'],
                'status' => 'pending',
                'notes' => $validated['notes'] ?? null,
            ]);
        });

        if (! $appointment) {
            return response()->json([
                'message' => 'This barber already has an appointment at that date and time.',
            ], 422);
        }

        return response()->json([
            'message' => 'Appointment created successfully.',
            'data' => $appointment->load([
                'customer:id,name,email',
                'barber:id,name',
                'service:id,name,price',
            ]),
        ], 201);
    }

    public function show(Request $request, Appointment $appointment): JsonResponse
    {
        $user = $request->user();

        if (! in_array($user->role, ['admin', 'customer'], true)) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        if (
            $user->role === 'customer'
            && $appointment->user_id !== $user->id
        ) {
            return response()->json([
                'message' => 'You are not authorized to view this appointment.',
            ], 403);
        }

        return response()->json([
            'data' => $appointment->load([
                'customer:id,name,email',
                'barber:id,name',
                'service:id,name,price',
            ]),
        ]);
    }

    public function update(
        UpdateAppointmentRequest $request,
        Appointment $appointment
    ): JsonResponse {
        $user = $request->user();

        if (! in_array($user->role, ['admin', 'customer'], true)) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        if ($user->role === 'customer') {
            if ($appointment->user_id !== $user->id) {
                return response()->json([
                    'message' => 'You are not authorized to update this appointment.',
                ], 403);
            }

            if ($appointment->status !== 'pending') {
                return response()->json([
                    'message' => 'Only pending appointments can be edited by customers.',
                ], 422);
            }
        }

        $validated = $request->validated();

        if ($user->role === 'admin' && isset($validated['status'])) {
            $allowedTransitions = [
                'pending' => ['confirmed', 'cancelled'],
                'confirmed' => ['completed', 'cancelled', 'no_show'],
                'completed' => [],
                'cancelled' => [],
                'no_show' => [],
            ];

            if (
                ! in_array(
                    $validated['status'],
                    $allowedTransitions[$appointment->status] ?? [],
                    true
                )
            ) {
                return response()->json([
                    'message' => 'This appointment status transition is not allowed.',
                ], 422);
            }
        }

        $barberId = $validated['barber_id'] ?? $appointment->barber_id;
        $serviceId = $validated['service_id'] ?? $appointment->service_id;
        $appointmentDate = $validated['appointment_date']
            ?? $appointment->appointment_date->toDateString();
        $appointmentTime = $validated['appointment_time']
            ?? substr((string) $appointment->appointment_time, 0, 5);

        $isActiveBooking = in_array(
            $validated['status'] ?? $appointment->status,
            ['pending', 'confirmed'],
            true
        );

        if ($isActiveBooking) {
            $barber = Barber::findOrFail($barberId);
            $service = Service::findOrFail($serviceId);

            if (! $barber->is_available) {
                return response()->json([
                    'message' => 'This barber is currently unavailable.',
                ], 422);
            }

            if (! $service->is_active) {
                return response()->json([
                    'message' => 'This service is currently unavailable.',
                ], 422);
            }

            $conflictExists = Appointment::query()
                ->where('barber_id', $barberId)
                ->whereDate('appointment_date', $appointmentDate)
                ->where('appointment_time', $appointmentTime)
                ->whereIn('status', ['pending', 'confirmed'])
                ->where('id', '!=', $appointment->id)
                ->exists();

            if ($conflictExists) {
                return response()->json([
                    'message' => 'This barber already has an appointment at that date and time.',
                ], 422);
            }
        }

        $appointment->update($validated);

        return response()->json([
            'message' => 'Appointment updated successfully.',
            'data' => $appointment->fresh()->load([
                'customer:id,name,email',
                'barber:id,name',
                'service:id,name,price',
            ]),
        ]);
    }

    public function destroy(Request $request, Appointment $appointment): JsonResponse
    {
        $user = $request->user();

        if (! in_array($user->role, ['admin', 'customer'], true)) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        if ($user->role === 'customer') {
            if ($appointment->user_id !== $user->id) {
                return response()->json([
                    'message' => 'You are not authorized to cancel this appointment.',
                ], 403);
            }

            if ($appointment->status !== 'pending') {
                return response()->json([
                    'message' => 'Only pending appointments can be cancelled by customers.',
                ], 422);
            }

            $appointment->update(['status' => 'cancelled']);

            return response()->json([
                'message' => 'Appointment cancelled successfully.',
                'data' => $appointment->fresh()->load([
                    'customer:id,name,email',
                    'barber:id,name',
                    'service:id,name,price',
                ]),
            ]);
        }

        return response()->json([
            'message' => 'Administrators should update appointment status instead of deleting appointment history.',
        ], 422);
    }
}
