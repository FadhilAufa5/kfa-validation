<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $query = ActivityLog::with('user')
            ->orderBy('created_at', 'desc');

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('user_name', 'like', "%{$search}%")
                    ->orWhere('action', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('entity_type', 'like', "%{$search}%");
            });
        }

        if ($request->has('action') && $request->action) {
            $query->where('action', $request->action);
        }

        if ($request->has('category') && $request->category) {
            $query->where('category', $request->category);
        }

        if ($request->has('user_role') && $request->user_role) {
            $query->where('user_role', $request->user_role);
        }

        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $logs = $query->paginate(50);

        $actions = ActivityLog::distinct()->pluck('action');
        $categories = ActivityLog::distinct()->whereNotNull('category')->pluck('category');
        $roles = ActivityLog::distinct()->whereNotNull('user_role')->pluck('user_role');

        return Inertia::render('activity-logs/index', [
            'logs' => $logs,
            'actions' => $actions,
            'categories' => $categories,
            'roles' => $roles,
            'filters' => $request->only(['search', 'action', 'category', 'user_role', 'date_from', 'date_to']),
        ]);
    }

    public function show(ActivityLog $activityLog)
    {
        $activityLog->load('user');
        
        return Inertia::render('activity-logs/show', [
            'log' => $activityLog,
        ]);
    }
}
