<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests exercise the application through a real HTTP request, the way a
 * client would. They are slower than unit tests and worth far more here: they
 * prove the route, the middleware, the controller and the response shape all agree.
 *
 * RefreshDatabase runs every migration before each test and rolls it back after,
 * so each test starts from a known empty database.
 */
class ApiAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_endpoint_needs_no_key(): void
    {
        $this->getJson('/api/v1/health')->assertOk()->assertJsonStructure([
            'status', 'checks' => ['database', 'cache'], 'time',
        ]);
    }

    public function test_request_without_a_key_is_rejected(): void
    {
        $this->getJson('/api/v1/kpis')
            ->assertUnauthorized()
            ->assertJsonPath('error.code', 'missing_api_key');
    }

    public function test_request_with_an_unknown_key_is_rejected(): void
    {
        $this->getJson('/api/v1/kpis', ['X-API-Key' => 'not-a-real-key'])
            ->assertUnauthorized()
            ->assertJsonPath('error.code', 'invalid_api_key');
    }

    public function test_request_with_a_valid_key_is_accepted(): void
    {
        $this->getJson('/api/v1/kpis', $this->apiHeaders())->assertOk();
    }

    public function test_every_response_carries_a_request_id(): void
    {
        $response = $this->getJson('/api/v1/health');

        $this->assertNotEmpty($response->headers->get('X-Request-Id'));
    }
}
