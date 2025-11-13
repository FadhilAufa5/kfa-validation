<?php

namespace App\Http\Controllers;

use App\Services\ValidationDataCheckService;
use App\Services\DashboardStatisticsService;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __construct(
        protected DashboardStatisticsService $statsService,
        protected ValidationDataCheckService $validationCheckService
    ) {}

    public function index()
    {
        $currentUser = auth()->user();
        $userId = $currentUser->id;
        $role = $currentUser->role;
        
        // Get statistics using optimized service
        $statistics = $this->statsService->getStatistics($userId, $role);
        $activeUsersCount = $this->statsService->getActiveUsersCount();

        // Get distribution data with caching
        $pembelianDistribution = $this->statsService->getDocumentDistribution('pembelian', $userId, $role);
        $penjualanDistribution = $this->statsService->getDocumentDistribution('penjualan', $userId, $role);

        // Get recent activities
        $recentActivities = $this->statsService->getRecentActivities($userId, $role, 10);

        // Check validation data status for super admins
        $validationDataStatus = null;
        if ($role === 'super_admin') {
            $validationDataStatus = $this->validationCheckService->checkValidationData();
        }

        return Inertia::render('dashboard', [
            'activeUsersCount' => $activeUsersCount,
            'statistics' => $statistics,
            'pembelianDistribution' => $pembelianDistribution,
            'penjualanDistribution' => $penjualanDistribution,
            'recentActivities' => $recentActivities,
            'validationDataStatus' => $validationDataStatus,
        ]);
    }
}
