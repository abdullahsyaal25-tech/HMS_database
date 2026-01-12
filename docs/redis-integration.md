# Redis Integration Guide

This document explains how Redis has been integrated into the Laravel application and provides usage examples.

## Prerequisites

Before using Redis, you need to install both Redis server and the PHP Redis extension:

### Installing Redis Server

1. **On Windows**: Download Redis from [Microsoft's Redis port](https://github.com/microsoftarchive/redis) or use Docker
2. **On macOS**: `brew install redis`
3. **On Linux**: `sudo apt-get install redis-server` (Ubuntu/Debian) or `sudo yum install redis` (CentOS/RHEL)
4. **Using Docker** (Recommended): Run `docker run --name laravel-redis -p 6379:6379 -d redis:alpine`

If using Docker, make sure to update your `.env` file with the appropriate host if running in a container environment.

### Installing PHP Redis Extension

1. **Using PECL**: `pecl install redis`
2. **On Windows**: Download the appropriate DLL from [PECL](https://pecl.php.net/package/redis) and add to php.ini
3. **On macOS**: `brew install php-redis`
4. **On Linux**: `sudo apt-get install php-redis` (Ubuntu/Debian)

After installing the PHP extension, restart your web server.

## Configuration Overview

Redis has been configured in the following areas:

1. **Database Configuration** (`config/database.php`): Added Redis connection settings
2. **Cache Configuration** (`config/cache.php`): Set Redis as the default cache driver
3. **Queue Configuration** (`config/queue.php`): Set Redis as the default queue driver
4. **Session Configuration** (`config/session.php`): Set Redis as the default session driver
5. **Environment Configuration** (`.env`): Added Redis connection parameters

## Redis Configuration Settings

The following environment variables control Redis behavior:

- `REDIS_CLIENT`: Redis client to use (default: `phpredis`)
- `REDIS_HOST`: Redis server host (default: `127.0.0.1`)
- `REDIS_PASSWORD`: Redis server password (default: `null`)
- `REDIS_PORT`: Redis server port (default: `6379`)
- `REDIS_DB`: Redis database number for general usage (default: `0`)
- `REDIS_CACHE_DB`: Redis database number for cache (default: `1`)
- `REDIS_CLUSTER`: Redis cluster mode (default: `redis`)
- `REDIS_PREFIX`: Key prefix for Redis keys (default: `laravel_database_`)

## Usage Examples

### 1. Using Laravel's Built-in Cache with Redis

```php
use Illuminate\Support\Facades\Cache;

// Store data in cache with expiration (3600 seconds = 1 hour)
Cache::put('key', 'value', 3600);

// Get data from cache
$value = Cache::get('key');

// Check if cache has a key
if (Cache::has('key')) {
    $value = Cache::get('key');
}

// Remove data from cache
Cache::forget('key');

// Store data forever (no expiration)
Cache::forever('key', 'value');
```

### 2. Using Laravel's Queue with Redis

```php
use Illuminate\Support\Facades\Queue;
use App\Jobs\YourJob;

// Push a job to the queue
Queue::push(new YourJob($data));

// Or dispatch a job (recommended)
YourJob::dispatch($data);
```

### 3. Using the Custom Redis Service

A custom `RedisService` class has been created to provide more advanced Redis functionality:

```php
use App\Services\RedisService;

$redisService = new RedisService();

// Basic key-value operations
$redisService->set('user:1', ['name' => 'John', 'email' => 'john@example.com'], 3600); // expires in 1 hour
$user = $redisService->get('user:1');

// Check if key exists
if ($redisService->exists('user:1')) {
    // Do something
}

// Delete a key
$redisService->delete('user:1');

// Increment/decrement operations
$redisService->increment('page_views');
$redisService->decrement('inventory_count', 5);

// List operations
$redisService->pushToList('recent_orders', ['order_id' => 123, 'total' => 99.99]);
$orders = $redisService->getList('recent_orders');

// Hash operations
$redisService->hset('user_profile:1', 'email', 'john@example.com');
$email = $redisService->hget('user_profile:1', 'email');
$profile = $redisService->hgetAll('user_profile:1');
```

### 4. Using Redis Directly

```php
use Illuminate\Support\Facades\Redis;

// Basic operations
Redis::set('key', 'value');
$value = Redis::get('key');

// Set with expiration
Redis::setex('key', 3600, 'value'); // expires in 3600 seconds

// Working with lists
Redis::lpush('list_key', 'item1');
Redis::rpush('list_key', 'item2');
$items = Redis::lrange('list_key', 0, -1);

// Working with hashes
Redis::hset('hash_key', 'field1', 'value1');
$value = Redis::hget('hash_key', 'field1');
$allFields = Redis::hgetall('hash_key');

// Increment operations
Redis::incr('counter');
Redis::incrBy('counter', 5);
```

## Common Use Cases in the Application

### 1. Caching Database Results

```php
use Illuminate\Support\Facades\Cache;

public function getUsers()
{
    return Cache::remember('users.all', 3600, function () {
        return User::all();
    });
}
```

### 2. Caching API Responses

```php
use Illuminate\Support\Facades\Cache;

public function getExternalData()
{
    return Cache::remember('external_data', 1800, function () {
        return Http::get('https://api.example.com/data')->json();
    });
}
```

### 3. Session Management

With Redis configured as the session driver, all user sessions will be stored in Redis, providing better performance and allowing for horizontal scaling.

### 4. Job Queue Processing

Background jobs will now be processed using Redis queues, enabling asynchronous processing of time-consuming tasks.

## Performance Benefits

1. **Caching**: Dramatically faster read operations compared to database queries
2. **Session Storage**: Faster session access and better scalability
3. **Queues**: Efficient background job processing
4. **Memory Efficiency**: In-memory data storage for frequently accessed data

## Best Practices

1. **Key Naming**: Use descriptive keys with appropriate prefixes (e.g., `user:profile:{id}`)
2. **Expiration**: Always set appropriate expiration times to prevent memory bloat
3. **Error Handling**: Implement proper error handling when Redis is unavailable
4. **Monitoring**: Monitor Redis memory usage and performance
5. **Fallback Strategy**: Consider implementing fallback mechanisms when Redis is unavailable