<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (!$request->user()) {
            return redirect()->route('login');
        }

        $userRole = $request->user()->role;

        // Super admin has access to everything
        if ($userRole === 'super_admin') {
            return $next($request);
        }

        // Check if user has one of the allowed roles
        if (in_array($userRole, $roles)) {
            return $next($request);
        }

        // User doesn't have permission
        abort(403, 'You do not have permission to access this resource.');
    }
}
