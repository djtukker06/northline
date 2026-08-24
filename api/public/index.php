<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Every request enters here. This single file is the "front controller": nginx
// routes all traffic to it, and the framework decides what happens next.
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

require __DIR__.'/../vendor/autoload.php';

/** @var Illuminate\Foundation\Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

$app->handleRequest(Request::capture());
