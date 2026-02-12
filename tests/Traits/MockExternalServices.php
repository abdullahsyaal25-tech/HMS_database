<?php

namespace Tests\Traits;

use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;

trait MockExternalServices
{
    use MockeryPHPUnitIntegration;

    protected array $mocks = [];

    /**
     * Initialize mocks for external services.
     */
    protected function initializeMocks(): void
    {
        // Mock cache facade
        $this->mocks['cache'] = Mockery::mock('alias:Cache');
        Cache::shouldReceive('get')->andReturnUsing(function ($key) {
            return null;
        });
        Cache::shouldReceive('put')->andReturn(true);
        Cache::shouldReceive('forever')->andReturn(true);
        Cache::shouldReceive('forget')->andReturn(true);
        Cache::shouldReceive('flush')->andReturn(true);
        Cache::shouldReceive('remember')->andReturnUsing(function ($key, $ttl, $callback) {
            return $callback();
        });

        // Mock queue
        $this->mocks['queue'] = Mockery::mock('alias:Queue');
        Queue::shouldReceive('push')->andReturn(1);
        Queue::shouldReceive('later')->andReturn(1);
        Queue::shouldReceive('connection')->andReturnSelf();
        Queue::shouldReceive('flush')->andReturn(true);

        // Mock mail
        $this->mocks['mail'] = Mockery::mock('alias:Mail');
        Mail::shouldReceive('send')->andReturn(true);
        Mail::shouldReceive('queue')->andReturn(true);

        // Mock notification
        $this->mocks['notification'] = Mockery::mock('alias:Notification');
        Notification::shouldReceive('send')->andReturn(true);
        Notification::shouldReceive('sendNow')->andReturn(true);
    }

    /**
     * Mock HTTP requests.
     */
    protected function mockHttpRequest(
        string $method,
        string $url,
        array $response,
        int $status = 200
    ): void
    {
        Http::fake([
            $url => Http::response($response, $status),
        ]);
    }

    /**
     * Mock cache get with value.
     */
    protected function mockCacheGet(string $key, mixed $value): void
    {
        Cache::shouldReceive('get')
            ->with($key)
            ->andReturn($value);
    }

    /**
     * Mock cache hit and miss.
     */
    protected function mockCacheHitAndMiss(string $hitKey, mixed $hitValue, array $missKeys): void
    {
        Cache::shouldReceive('get')
            ->with($hitKey)
            ->andReturn($hitValue);
        
        foreach ($missKeys as $missKey) {
            Cache::shouldReceive('get')
                ->with($missKey)
                ->andReturn(null);
        }
    }

    /**
     * Mock cache remember.
     */
    protected function mockCacheRemember(string $key, mixed $value, int $ttl = 3600): void
    {
        Cache::shouldReceive('remember')
            ->with($key, $ttl, \Closure::class)
            ->andReturnUsing(function ($key, $ttl, $callback) {
                return $callback();
            });
    }

    /**
     * Mock queue job.
     */
    protected function mockQueuePush(string $jobClass, array $data = []): void
    {
        Queue::shouldReceive('push')
            ->with(Mockery::on(function ($job) use ($jobClass, $data) {
                return $job instanceof $jobClass 
                    || (is_array($job) && isset($job['job']) && $job['job'] instanceof $jobClass);
            }))
            ->andReturn(1);
    }

    /**
     * Mock queue job failure.
     */
    protected function mockQueueFailure(string $jobClass): void
    {
        Queue::shouldReceive('push')
            ->with(Mockery::on(function ($job) use ($jobClass) {
                return $job instanceof $jobClass;
            }))
            ->andThrow(new \Exception('Queue job failed'));
    }

    /**
     * Mock email sending.
     */
    protected function mockMailSend(
        string $view,
        array $data = [],
        ?\Closure $callback = null
    ): void
    {
        Mail::shouldReceive('send')
            ->with(
                Mockery::anyOf($view),
                Mockery::on(function ($passedData) use ($data) {
                    return array_intersect_key($passedData, $data) === $data;
                }),
                Mockery::anyOf(null, $callback)
            )
            ->andReturn(true);
    }

    /**
     * Mock notification sending.
     */
    protected function mockNotificationSend(
        $notifiable,
        $notification,
        ?\Closure $callback = null
    ): void
    {
        Notification::shouldReceive('send')
            ->with(
                Mockery::anyOf($notifiable),
                Mockery::anyOf($notification),
                Mockery::anyOf(null, $callback)
            )
            ->andReturn(true);
    }

    /**
     * Mock HTTP external API call.
     */
    protected function mockExternalApi(string $method, string $url, array $response, int $status = 200): void
    {
        $this->mockHttpRequest($method, $url, $response, $status);
    }

    /**
     * Reset all mocks.
     */
    protected function resetMocks(): void
    {
        foreach ($this->mocks as $mock) {
            if ($mock instanceof Mockery\MockInterface) {
                $mock->mockery_teardown();
            }
        }
        Mockery::close();
        
        // Reset facade mocks
        Http::reset();
        Cache::reset();
        Queue::reset();
        Mail::reset();
        Notification::reset();
    }

    /**
     * Clean up mocks after test.
     * Note: Call this manually in afterEach() or after each test when needed.
     */
    protected function cleanupMocks(): void
    {
        $this->resetMocks();
    }
}
