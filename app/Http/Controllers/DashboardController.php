<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Validation;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $currentUser = auth()->user();
        
        // Active users count
        $activeUsersCount = User::all()->filter(function ($user) {
            return Cache::has('user-is-online-' . $user->id);
        })->count();

        // Apply role-based filtering
        $query = Validation::query();
        if ($currentUser->role === 'user') {
            $query->where('user_id', $currentUser->id);
        } elseif ($currentUser->role === 'visitor') {
            $assignedUserId = $currentUser->assigned_user_id ?? $currentUser->id;
            $query->where('user_id', $assignedUserId);
        }
        // super_admin sees all

        // Total files uploaded
        $totalFiles = $query->count();
        
        // Total pembelian files
        $totalPembelian = (clone $query)->where('document_type', 'pembelian')->count();
        
        // Total penjualan files
        $totalPenjualan = (clone $query)->where('document_type', 'penjualan')->count();

        // Get pembelian distribution by category
        $pembelianDistribution = (clone $query)
            ->where('document_type', 'pembelian')
            ->select('document_category', DB::raw('count(*) as count'))
            ->groupBy('document_category')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->document_category,
                    'value' => $item->count,
                ];
            });

        // Get penjualan distribution by category
        $penjualanDistribution = (clone $query)
            ->where('document_type', 'penjualan')
            ->select('document_category', DB::raw('count(*) as count'))
            ->groupBy('document_category')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->document_category,
                    'value' => $item->count,
                ];
            });

        // Recent activities (last 10 activities)
        $recentActivitiesQuery = ActivityLog::with('user')
            ->orderBy('created_at', 'desc')
            ->limit(10);

        // Apply role-based filtering for activities
        if ($currentUser->role === 'user') {
            $recentActivitiesQuery->where('user_id', $currentUser->id);
        } elseif ($currentUser->role === 'visitor') {
            $assignedUserId = $currentUser->assigned_user_id ?? $currentUser->id;
            $recentActivitiesQuery->where('user_id', $assignedUserId);
        }

        $recentActivities = $recentActivitiesQuery->get()->map(function ($activity) {
            $minutesAgo = $activity->created_at->diffInMinutes(now());
            $isNew = $minutesAgo <= 10; // Consider activities in last 10 minutes as new

            $timeAgo = $activity->created_at->diffForHumans();

            return [
                'id' => $activity->id,
                'user' => $activity->user_name,
                'action' => $activity->description ?? $activity->action,
                'time' => $timeAgo,
                'isNew' => $isNew,
            ];
        });

        // Calculate statistics for comparison
        $lastMonthFiles = (clone $query)
            ->whereMonth('created_at', now()->subMonth()->month)
            ->whereYear('created_at', now()->subMonth()->year)
            ->count();
        $filesChangeFromLastMonth = $totalFiles - $lastMonthFiles;

        $lastWeekPembelian = (clone $query)
            ->where('document_type', 'pembelian')
            ->where('created_at', '>=', now()->subWeek())
            ->count();

        $todayPenjualan = (clone $query)
            ->where('document_type', 'penjualan')
            ->whereDate('created_at', today())
            ->count();

        return Inertia::render('dashboard', [
            'activeUsersCount' => $activeUsersCount,
            'statistics' => [
                'totalFiles' => $totalFiles,
                'totalPembelian' => $totalPembelian,
                'totalPenjualan' => $totalPenjualan,
                'filesChangeFromLastMonth' => $filesChangeFromLastMonth,
                'lastWeekPembelian' => $lastWeekPembelian,
                'todayPenjualan' => $todayPenjualan,
            ],
            'pembelianDistribution' => $pembelianDistribution,
            'penjualanDistribution' => $penjualanDistribution,
            'recentActivities' => $recentActivities,
        ]);
    }
}
