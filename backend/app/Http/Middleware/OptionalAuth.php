<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class OptionalAuth
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Try to authenticate if token is present, but don't fail if not
        if ($request->bearerToken()) {
            try {
                $user = $request->user('sanctum');
                if ($user) {
                    $request->setUserResolver(fn () => $user);
                }
            } catch (\Exception $e) {
                // Continue as guest if authentication fails
            }
        }
        
        return $next($request);
    }
}
