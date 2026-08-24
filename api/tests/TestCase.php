<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /** The header every authenticated test request needs. */
    protected function apiHeaders(string $key = 'test_key_dashboard'): array
    {
        return ['X-API-Key' => $key, 'Accept' => 'application/json'];
    }
}
