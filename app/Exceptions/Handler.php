<?php

namespace App\Exceptions;

use App\Exceptions\Validation\ValidationException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * A list of exception types with their corresponding custom log levels.
     *
     * @var array<class-string<\Throwable>, \Psr\Log\LogLevel::*>
     */
    protected $levels = [];

    /**
     * A list of the exception types that are not reported.
     *
     * @var array<int, class-string<\Throwable>>
     */
    protected $dontReport = [];

    /**
     * A list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->renderable(function (ValidationException $e, $request) {
            if ($request->expectsJson() || $request->is('api/*') || $request->ajax()) {
                return response()->json($e->toArray(), $e->getCode() ?: 400);
            }
        });
    }

    /**
     * Render an exception into an HTTP response.
     */
    public function render($request, Throwable $e)
    {
        // Handle ValidationException for JSON responses
        if ($e instanceof ValidationException) {
            if ($request->expectsJson() || $request->is('api/*') || $request->ajax()) {
                return response()->json($e->toArray(), $e->getCode() ?: 400);
            }
        }

        return parent::render($request, $e);
    }
}
