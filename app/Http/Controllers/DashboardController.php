<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
       
        $activeUsersCount = User::all()->filter(function ($user) {
            return Cache::has('user-is-online-' . $user->id);
        })->count();

       
        $dummyData = [
            'totalSales' => 54200000,
            'activeProducts' => 128,
            'incomingOrders' => 312,
        ];

        return Inertia::render('dashboard', [
            'activeUsersCount' => $activeUsersCount,
            'dummyData' => $dummyData,
        ]);
    }
}
