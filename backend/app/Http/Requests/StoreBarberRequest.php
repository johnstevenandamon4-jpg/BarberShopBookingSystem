<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBarberRequest extends FormRequest
{
    public function authorize(): bool
    {
        // The route is already behind the "admin" middleware; this is a second guard.
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', 'unique:barbers,email'],
            'description' => ['nullable', 'string'],
            'is_available' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Please enter the barber\'s name.',
            'email.unique' => 'A barber with this email already exists.',
        ];
    }
}
