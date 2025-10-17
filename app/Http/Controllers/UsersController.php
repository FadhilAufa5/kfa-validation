<?php
// app/Http/Controllers/UsersController.php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class UsersController extends Controller
{
    /**
     * Tampilkan daftar user.
     */
    public function index()
    {
        $users = User::select('id', 'name', 'email', 'role', 'created_at')->get()->map(function ($user) {
            $user->is_online = Cache::has('user-is-online-' . $user->id);
            return $user;
        });

        return Inertia::render('users/index', [
            'users' => $users,
        ]);
    }

    /**
     * Tampilkan detail user tertentu.
     */
    public function show(User $user)
    {
        $user->is_online = Cache::has('user-is-online-' . $user->id);
        
        return Inertia::render('users/show', [
            'user' => $user,
        ]);
    }
}