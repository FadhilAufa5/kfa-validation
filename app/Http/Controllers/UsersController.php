<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class UsersController extends Controller
{
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

    $user->update($request->only('name', 'email', 'role'));

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

  
    User::create([
        'name' => $validated['name'],
        'email' => $validated['email'],
        'role' => $validated['role'],
        'password' => bcrypt($validated['password']),
    ]);

    
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
    $user->delete();

    return redirect()->route('users.index')->with('success', 'User berhasil dihapus.');


}

}