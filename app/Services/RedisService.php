<?php

namespace App\Services;

use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;

class RedisService
{
    /**
     * Store a value in Redis with an optional expiration time
     *
     * @param string $key
     * @param mixed $value
     * @param int|null $ttl Time to live in seconds (null means no expiration)
     * @return bool
     */
    public function set(string $key, mixed $value, ?int $ttl = null): bool
    {
        try {
            if ($ttl) {
                Redis::setex($key, $ttl, serialize($value));
            } else {
                Redis::set($key, serialize($value));
            }
            return true;
        } catch (\Exception $e) {
            Log::error('Redis set error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Get a value from Redis
     *
     * @param string $key
     * @return mixed|null
     */
    public function get(string $key): mixed
    {
        try {
            $value = Redis::get($key);
            return $value ? unserialize($value) : null;
        } catch (\Exception $e) {
            Log::error('Redis get error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Check if a key exists in Redis
     *
     * @param string $key
     * @return bool
     */
    public function exists(string $key): bool
    {
        try {
            return Redis::exists($key) > 0;
        } catch (\Exception $e) {
            Log::error('Redis exists error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Delete a key from Redis
     *
     * @param string $key
     * @return bool
     */
    public function delete(string $key): bool
    {
        try {
            return Redis::del($key) > 0;
        } catch (\Exception $e) {
            Log::error('Redis delete error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Set a value with expiration time (TTL)
     *
     * @param string $key
     * @param mixed $value
     * @param int $ttl Time to live in seconds
     * @return bool
     */
    public function setex(string $key, mixed $value, int $ttl): bool
    {
        try {
            Redis::setex($key, $ttl, serialize($value));
            return true;
        } catch (\Exception $e) {
            Log::error('Redis setex error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Increment a value in Redis
     *
     * @param string $key
     * @param int $amount
     * @return int|false
     */
    public function increment(string $key, int $amount = 1): int|false
    {
        try {
            return Redis::incrBy($key, $amount);
        } catch (\Exception $e) {
            Log::error('Redis increment error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Decrement a value in Redis
     *
     * @param string $key
     * @param int $amount
     * @return int|false
     */
    public function decrement(string $key, int $amount = 1): int|false
    {
        try {
            return Redis::decrBy($key, $amount);
        } catch (\Exception $e) {
            Log::error('Redis decrement error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Store an array/list in Redis using RPUSH
     *
     * @param string $key
     * @param mixed $value
     * @return bool
     */
    public function pushToList(string $key, mixed $value): bool
    {
        try {
            Redis::rpush($key, serialize($value));
            return true;
        } catch (\Exception $e) {
            Log::error('Redis push to list error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Get all items from a Redis list
     *
     * @param string $key
     * @return array
     */
    public function getList(string $key): array
    {
        try {
            $items = Redis::lrange($key, 0, -1);
            return array_map(function ($item) {
                return unserialize($item);
            }, $items);
        } catch (\Exception $e) {
            Log::error('Redis get list error: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Store data in a Redis hash
     *
     * @param string $key
     * @param string $field
     * @param mixed $value
     * @return bool
     */
    public function hset(string $key, string $field, mixed $value): bool
    {
        try {
            Redis::hset($key, $field, serialize($value));
            return true;
        } catch (\Exception $e) {
            Log::error('Redis hset error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Get data from a Redis hash
     *
     * @param string $key
     * @param string $field
     * @return mixed
     */
    public function hget(string $key, string $field): mixed
    {
        try {
            $value = Redis::hget($key, $field);
            return $value ? unserialize($value) : null;
        } catch (\Exception $e) {
            Log::error('Redis hget error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get all fields and values from a Redis hash
     *
     * @param string $key
     * @return array
     */
    public function hgetAll(string $key): array
    {
        try {
            $data = Redis::hgetall($key);
            $result = [];
            foreach ($data as $field => $value) {
                $result[$field] = unserialize($value);
            }
            return $result;
        } catch (\Exception $e) {
            Log::error('Redis hgetall error: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Delete a field from a Redis hash
     *
     * @param string $key
     * @param string $field
     * @return bool
     */
    public function hdel(string $key, string $field): bool
    {
        try {
            return Redis::hdel($key, $field) > 0;
        } catch (\Exception $e) {
            Log::error('Redis hdel error: ' . $e->getMessage());
            return false;
        }
    }
}