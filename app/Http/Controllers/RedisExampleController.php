<?php

namespace App\Http\Controllers;

use App\Services\RedisService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;

class RedisExampleController extends Controller
{
    protected RedisService $redisService;

    public function __construct(RedisService $redisService)
    {
        $this->redisService = $redisService;
    }

    /**
     * Demonstrate basic Redis cache operations
     */
    public function cacheExample(Request $request)
    {
        $key = $request->input('key', 'test_key');
        $value = $request->input('value', 'test_value');
        $ttl = $request->input('ttl', 3600); // Default 1 hour

        // Store in cache
        Cache::put($key, $value, $ttl);

        // Retrieve from cache
        $cachedValue = Cache::get($key);

        return response()->json([
            'stored_key' => $key,
            'stored_value' => $value,
            'cached_value' => $cachedValue,
            'ttl' => $ttl
        ]);
    }

    /**
     * Demonstrate custom Redis service operations
     */
    public function serviceExample(Request $request)
    {
        $key = $request->input('key', 'service_test');
        $data = $request->input('data', ['name' => 'Test User', 'role' => 'admin']);

        // Store data using our custom service
        $this->redisService->set($key, $data, 3600);

        // Retrieve data
        $retrievedData = $this->redisService->get($key);

        return response()->json([
            'key' => $key,
            'stored_data' => $data,
            'retrieved_data' => $retrievedData,
            'exists' => $this->redisService->exists($key)
        ]);
    }

    /**
     * Demonstrate direct Redis operations
     */
    public function directExample(Request $request)
    {
        $key = $request->input('key', 'direct_test');
        $value = $request->input('value', 'direct_value');

        // Direct Redis operations
        Redis::set($key, serialize($value));
        $retrievedValue = unserialize(Redis::get($key));

        return response()->json([
            'key' => $key,
            'value' => $value,
            'retrieved_value' => $retrievedValue,
            'keys_count' => Redis::dbsize()
        ]);
    }

    /**
     * Demonstrate Redis list operations
     */
    public function listExample(Request $request)
    {
        $listKey = $request->input('list_key', 'user_visits');
        $visitData = $request->input('visit_data', ['user_id' => 1, 'timestamp' => now()->toISOString()]);

        // Push to list
        $this->redisService->pushToList($listKey, $visitData);

        // Get all items from list
        $visits = $this->redisService->getList($listKey);

        return response()->json([
            'list_key' => $listKey,
            'added_item' => $visitData,
            'total_items' => count($visits),
            'all_items' => $visits
        ]);
    }

    /**
     * Demonstrate Redis hash operations
     */
    public function hashExample(Request $request)
    {
        $hashKey = $request->input('hash_key', 'user_profile');
        $field = $request->input('field', 'email');
        $value = $request->input('value', 'user@example.com');

        // Set hash field
        $this->redisService->hset($hashKey, $field, $value);

        // Get hash field
        $getField = $this->redisService->hget($hashKey, $field);
        
        // Get all hash fields
        $allFields = $this->redisService->hgetAll($hashKey);

        return response()->json([
            'hash_key' => $hashKey,
            'field' => $field,
            'value' => $value,
            'retrieved_field' => $getField,
            'all_fields' => $allFields
        ]);
    }

    /**
     * Get Redis info and statistics
     */
    public function info()
    {
        try {
            $info = Redis::info();
            $dbSize = Redis::dbsize();
            
            return response()->json([
                'connected' => true,
                'db_size' => $dbSize,
                'version' => $info['server']['redis_version'] ?? 'unknown',
                'mode' => $info['server']['redis_mode'] ?? 'unknown',
                'os' => $info['server']['os'] ?? 'unknown',
                'used_memory_human' => $info['memory']['used_memory_human'] ?? 'unknown',
                'connected_clients' => $info['clients']['connected_clients'] ?? 0,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'connected' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}