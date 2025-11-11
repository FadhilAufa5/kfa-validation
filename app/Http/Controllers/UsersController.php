<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class UsersController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with('assignedUser:id,name')
            ->select('id', 'name', 'email', 'role', 'assigned_user_id', 'created_at')
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

        // Get available roles untuk filter dropdown (from old role field)
        $availableRoles = User::select('role')->distinct()->pluck('role');

        // Get all roles from permission system
        $allRoles = Role::select('id', 'name', 'display_name', 'description')->get()->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'display_name' => $role->display_name,
                'description' => $role->description,
            ];
        });

        // Get statistics untuk semua users (tanpa filter)
        $totalUsers = User::count();
        $onlineUsers = User::get()->filter(function ($user) {
            return Cache::has('user-is-online-' . $user->id);
        })->count();

        // Get all users for visitor assignment dropdown (only non-visitor users)
        $assignableUsers = User::where('role', '!=', 'visitor')
            ->select('id', 'name', 'email', 'role')
            ->orderBy('name')
            ->get();

        return Inertia::render('users/index', [
            'users' => $users,
            'availableRoles' => $availableRoles,
            'allRoles' => $allRoles,
            'assignableUsers' => $assignableUsers,
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
        'role_id' => 'nullable|exists:roles,id',
        'assigned_user_id' => 'nullable|exists:users,id',
    ]);

    $oldData = $user->only('name', 'email', 'role', 'role_id', 'assigned_user_id');
    
    // Update user data
    $updateData = $request->only('name', 'email', 'role');
    
    // If role_id is provided, update it
    if ($request->has('role_id') && $request->role_id) {
        $updateData['role_id'] = $request->role_id;
        
        // Also update the role string field to match the role name
        $role = Role::find($request->role_id);
        if ($role) {
            $updateData['role'] = $role->name;
        }
    }

    // If assigned_user_id is provided, update it (for visitors)
    if ($request->has('assigned_user_id')) {
        $updateData['assigned_user_id'] = $request->assigned_user_id;
    }
    
    $user->update($updateData);

    ActivityLogger::logUpdate(
        'User',
        $user,
        "Memperbarui data user {$user->name}",
        ['old' => $oldData, 'new' => $updateData]
    );

    return redirect()->back()->with('success', 'User berhasil diperbarui.');
}

public function store(Request $request)
{
    // Password is only required for super_admin role
    $rules = [
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users,email',
        'role' => 'required|string',
        'role_id' => 'nullable|exists:roles,id',
        'assigned_user_id' => 'nullable|exists:users,id',
    ];

    // Only require password for super_admin
    if ($request->role === 'super_admin') {
        $rules['password'] = 'required|string|min:6';
    }

    $validated = $request->validate($rules);

    // Generate random password for non-super admin users
    $password = isset($validated['password']) 
        ? $validated['password'] 
        : \Illuminate\Support\Str::random(16);

    $userData = [
        'name' => $validated['name'],
        'email' => $validated['email'],
        'role' => $validated['role'],
        'password' => bcrypt($password),
        'created_by_admin' => true,
    ];

    // Add role_id if provided
    if (isset($validated['role_id'])) {
        $userData['role_id'] = $validated['role_id'];
    }

    // Add assigned_user_id if provided (for visitors)
    if (isset($validated['assigned_user_id'])) {
        $userData['assigned_user_id'] = $validated['assigned_user_id'];
    }

    $user = User::create($userData);

    // TODO: Send email with password to non-super admin users
    if (!isset($validated['password'])) {
        // For now, log the generated password
        \Log::info('User created with auto-generated password', [
            'user_id' => $user->id,
            'email' => $user->email,
            'password' => $password, // In production, send via email instead of logging
        ]);
    }

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