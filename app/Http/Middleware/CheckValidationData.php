<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\ImDataInfo;
use Illuminate\Support\Facades\Auth;

class CheckValidationData
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!Auth::check()) {
            return $next($request);
        }

        $user = Auth::user();
        
        // Skip check for maintenance page itself
        if ($request->routeIs('maintenance')) {
            return $next($request);
        }

        // Check if validation data is empty
        $pembelianInfo = ImDataInfo::getInfo('im_purchases_and_return');
        $penjualanInfo = ImDataInfo::getInfo('im_jual');
        
        $isPembelianEmpty = !$pembelianInfo || $pembelianInfo->row_count === 0;
        $isPenjualanEmpty = !$penjualanInfo || $penjualanInfo->row_count === 0;
        
        // If both validation data are empty
        if ($isPembelianEmpty && $isPenjualanEmpty) {
            // For regular users, redirect to maintenance page
            if ($user->role !== 'super_admin') {
                return redirect()->route('maintenance');
            }
        }

        return $next($request);
    }
}
