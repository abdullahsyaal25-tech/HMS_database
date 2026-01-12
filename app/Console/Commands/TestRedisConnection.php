<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Redis;

class TestRedisConnection extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'redis:test-connection';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test Redis connection and display basic info';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        try {
            $this->info('Testing Redis connection...');
            
            // Test basic ping
            $pong = Redis::ping();
            $this->info("✓ Redis connection successful: {$pong}");
            
            // Get Redis info
            $info = Redis::info();
            $this->info('✓ Redis server info retrieved');
            
            // Get DB size
            $dbSize = Redis::dbsize();
            $this->info("✓ Current database size: {$dbSize} keys");
            
            // Test basic set/get
            $testKey = 'laravel_redis_test_' . time();
            $testValue = 'Connection working at ' . now()->toISOString();
            
            Redis::set($testKey, $testValue);
            $retrievedValue = Redis::get($testKey);
            
            if ($retrievedValue === $testValue) {
                $this->info("✓ Basic SET/GET operation successful");
            } else {
                $this->error("✗ Basic SET/GET operation failed");
                return 1;
            }
            
            // Clean up test key
            Redis::del($testKey);
            
            $this->info('');
            $this->info('Redis Configuration Summary:');
            $this->info('- Version: ' . ($info['server']['redis_version'] ?? 'Unknown'));
            $this->info('- Mode: ' . ($info['server']['redis_mode'] ?? 'Unknown'));
            $this->info('- OS: ' . ($info['server']['os'] ?? 'Unknown'));
            $this->info('- Connected clients: ' . ($info['clients']['connected_clients'] ?? 'Unknown'));
            $this->info('- Used memory: ' . ($info['memory']['used_memory_human'] ?? 'Unknown'));
            
            $this->info('');
            $this->info('Redis integration is properly configured!');
            
        } catch (\Exception $e) {
            $this->error("✗ Redis connection failed: " . $e->getMessage());
            return 1;
        }
        
        return 0;
    }
}