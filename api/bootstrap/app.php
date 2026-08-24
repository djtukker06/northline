<?php

use App\Http\Middleware\ForceJsonResponse;
use App\Http\Middleware\RequireApiKey;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

/*
 * The application bootstrap. This is where routing, middleware and error handling
 * are wired together. Middleware are layers every request passes through on its way
 * in and every response passes through on its way out: think of them as a stack of
 * filters around the controller.
 */
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        // Laravel exposes a built-in liveness endpoint at /up. Orchestrators use it
        // to decide whether a container is still healthy or should be replaced.
        health: '/up',
        apiPrefix: 'api',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Applied to every route in routes/api.php.
        $middleware->api(prepend: [
            ForceJsonResponse::class,
        ]);

        // Named middleware, attached per route group in routes/api.php.
        $middleware->alias([
            'api.key' => RequireApiKey::class,
        ]);

        // Trust the proxy in front of us (nginx) so the framework sees the real
        // client IP and scheme rather than the proxy's. Without this, rate limiting
        // would count every request as coming from the same address.
        $middleware->trustProxies(at: '*');
    })
    ->withExceptions(function (Exceptions $exceptions) {
        /*
         * ONE ERROR SHAPE FOR THE WHOLE API.
         *
         * A client should never have to guess whether a failure arrives as
         * {"message": ...}, {"error": ...} or an HTML page. Every failure here is
         *
         *     { "error": { "code": "...", "message": "...", "details": {...} } }
         *
         * with a correct HTTP status. The `code` is for the machine and stays
         * stable; the `message` is for a human and may be reworded freely.
         *
         * Status codes carry meaning, and using them properly is most of what makes
         * an API pleasant to consume:
         *   400 the request itself is malformed
         *   401 no or bad credentials          403 credentials fine, not allowed
         *   404 no such record                 422 well-formed but fails validation
         *   429 rate limited                   500 our fault
         */
        $exceptions->render(function (Throwable $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            [$status, $code, $message, $details] = match (true) {
                $e instanceof ValidationException => [
                    422, 'validation_failed',
                    'The request parameters are not valid.',
                    $e->errors(),
                ],
                $e instanceof ModelNotFoundException => [
                    404, 'not_found', 'No record matches that identifier.', null,
                ],
                $e instanceof AuthorizationException => [
                    403, 'forbidden', 'That key may not perform this action.', null,
                ],
                $e instanceof HttpExceptionInterface => [
                    $e->getStatusCode(), 'http_error',
                    $e->getMessage() ?: 'The request could not be completed.', null,
                ],
                default => [
                    500, 'server_error',
                    // Never leak an exception message on a 500 in production: it
                    // routinely contains file paths, SQL and occasionally secrets.
                    app()->isProduction()
                        ? 'Something went wrong on our side.'
                        : $e->getMessage(),
                    null,
                ],
            };

            return response()->json([
                'error' => array_filter([
                    'code' => $code,
                    'message' => $message,
                    'details' => $details,
                    // Ties the response the user saw to a line in the server log.
                    'requestId' => $request->attributes->get('request_id'),
                ], fn ($v) => $v !== null),
            ], $status);
        });

        // Structured context on every logged exception, so a log platform can
        // filter on request_id and consumer without parsing free text.
        $exceptions->context(fn (): array => [
            'request_id' => request()?->attributes->get('request_id'),
            'consumer' => request()?->attributes->get('api_consumer'),
        ]);
    })->create();
