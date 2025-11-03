<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class UsersController extends Controller
{
    public function index(Request $request)
    {
        $query = User::select('id', 'name', 'email', 'role', 'created_at')
            ->orderBy('created_at', 'desc');

        // Filter berdasarkan search (nama atau email)
        if ($request->has('search') && $request->search !== '') {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhere('email', 'like', '%' . $search . '%');
            });
        }

        // Filter berdasarkan role
        if ($request->has('role') && $request->role !== '' && $request->role !== 'all') {
            $query->where('role', $request->role);
        }

        // Pagination dengan 7 items per page, preserve query parameters
        $users = $query->paginate(7)->withQueryString()->through(function ($user) {
            $user->is_online = Cache::has('user-is-online-' . $user->id);
            return $user;
        });

        // Get available roles untuk filter dropdown
        $availableRoles = User::select('role')->distinct()->pluck('role');

        // Get statistics untuk semua users (tanpa filter)
        $totalUsers = User::count();
        $onlineUsers = User::get()->filter(function ($user) {
            return Cache::has('user-is-online-' . $user->id);
        })->count();

        return Inertia::render('users/index', [
            'users' => $users,
            'availableRoles' => $availableRoles,
            'filters' => [
                'search' => $request->search ?? '',
                'role' => $request->role ?? '',
            ],
            'statistics' => [
                'total' => $totalUsers,
                'online' => $onlineUsers,
                'offline' => $totalUsers - $onlineUsers,
            ],
        ]);
    }

    public function show(User $user)
    {
        $user->is_online = Cache::has('user-is-online-' . $user->id);

        return Inertia::render('users/show', [
            'user' => $user,
        ]);
    }

   public function update(Request $request, User $user)
{
    $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users,email,' . $user->id,
        'role' => 'required|string',
    ]);

    $oldData = $user->only('name', 'email', 'role');
    $user->update($request->only('name', 'email', 'role'));

    ActivityLogger::logUpdate(
        'User',
        $user,
        "Memperbarui data user {$user->name}",
        ['old' => $oldData, 'new' => $request->only('name', 'email', 'role')]
    );

    return redirect()->back()->with('success', 'User berhasil diperbarui.');
}

public function store(Request $request)
{
   
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users,email',
        'role' => 'required|string',
        'password' => 'required|string|min:6',
    ]);

  
    $user = User::create([
        'name' => $validated['name'],
        'email' => $validated['email'],
        'role' => $validated['role'],
        'password' => bcrypt($validated['password']),
    ]);

    ActivityLogger::logCreate('User', $user, "Menambahkan user baru: {$user->name}");

    
    return redirect()->route('users.index')->with('success', 'User berhasil ditambahkan!');
}


public function checkEmail(Request $request)
{
    $request->validate([
        'email' => 'required|email',
    ]);

    $exists = User::where('email', $request->email)->exists();

    return response()->json([
        'available' => !$exists,
    ]);
}

public function destroy(User $user)
{
    $userName = $user->name;
    $user->delete();

    ActivityLogger::log(
        'delete',
        "Menghapus user: {$userName}",
        'User',
        (string) $user->id,
        ['user_data' => ['name' => $userName, 'email' => $user->email, 'role' => $user->role]]
    );

    return redirect()->route('users.index')->with('success', 'User berhasil dihapus.');


}

}