<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Barber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BarberController extends Controller
{
    public function index(): JsonResponse
    {
        $barbers = Barber::query()
            ->latest()
            ->paginate(3);

        return response()->json($barbers);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', 'unique:barbers,email'],
            'description' => ['nullable', 'string'],
            'is_available' => ['sometimes', 'boolean'],
        ]);

        $barber = Barber::create($validated);

        return response()->json([
            'message' => 'Barber created successfully.',
            'data' => $barber,
        ], 201);
    }

    public function show(Barber $barber): JsonResponse
    {
        return response()->json([
            'data' => $barber,
        ]);
    }

    public function update(Request $request, Barber $barber): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('barbers', 'email')->ignore($barber->id),
            ],
            'description' => ['nullable', 'string'],
            'is_available' => ['sometimes', 'boolean'],
        ]);

        $barber->update($validated);

        return response()->json([
            'message' => 'Barber updated successfully.',
            'data' => $barber->fresh(),
        ]);
    }

    public function destroy(Barber $barber): JsonResponse
    {
        $barber->delete();

        return response()->json(null, 204);
    }
}
