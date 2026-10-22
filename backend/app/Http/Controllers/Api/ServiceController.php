<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreServiceRequest;
use App\Http\Requests\UpdateServiceRequest;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    /**
     * GET /api/services?search=&active=1|0&page=
     */
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));

        $services = Service::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when(
                $request->filled('active'),
                fn ($query) => $query->where('is_active', $request->boolean('active'))
            )
            ->latest()
            ->paginate(3)
            ->withQueryString();

        return response()->json($services);
    }

    public function store(StoreServiceRequest $request): JsonResponse
    {
        $service = Service::create($request->validated());

        return response()->json([
            'message' => 'Service created successfully.',
            'data' => $service,
        ], 201);
    }

    public function show(Service $service): JsonResponse
    {
        return response()->json([
            'data' => $service,
        ]);
    }

    public function update(UpdateServiceRequest $request, Service $service): JsonResponse
    {
        $service->update($request->validated());

        return response()->json([
            'message' => 'Service updated successfully.',
            'data' => $service->fresh(),
        ]);
    }

    public function destroy(Service $service): JsonResponse
    {
        $service->delete();

        return response()->json(null, 204);
    }
}
