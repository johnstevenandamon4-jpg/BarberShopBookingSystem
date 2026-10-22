<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBarberRequest;
use App\Http\Requests\UpdateBarberRequest;
use App\Models\Barber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BarberController extends Controller
{
    /**
     * GET /api/barbers?search=&available=1|0&page=
     */
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));

        $barbers = Barber::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when(
                $request->filled('available'),
                fn ($query) => $query->where('is_available', $request->boolean('available'))
            )
            ->latest()
            ->paginate(3)
            ->withQueryString();

        return response()->json($barbers);
    }

    public function store(StoreBarberRequest $request): JsonResponse
    {
        $barber = Barber::create($request->validated());

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

    public function update(UpdateBarberRequest $request, Barber $barber): JsonResponse
    {
        $barber->update($request->validated());

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
