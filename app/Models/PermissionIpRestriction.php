<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class PermissionIpRestriction extends Model
{
    protected $fillable = [
        'ip_address',
        'type',
        'description',
        'created_by',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get the user who created this restriction.
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scope to get only active restrictions.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get only allow restrictions.
     */
    public function scopeAllow(Builder $query): Builder
    {
        return $query->where('type', 'allow');
    }

    /**
     * Scope to get only deny restrictions.
     */
    public function scopeDeny(Builder $query): Builder
    {
        return $query->where('type', 'deny');
    }

    /**
     * Check if an IP address is allowed based on restrictions.
     */
    public static function isIpAllowed(string $ipAddress): bool
    {
        // First check if there are any deny rules that match
        $denyRules = self::active()->deny()->get();
        foreach ($denyRules as $rule) {
            if (self::ipMatchesRule($ipAddress, $rule->ip_address)) {
                return false; // Denied
            }
        }

        // If there are allow rules, check if IP matches any
        $allowRules = self::active()->allow()->get();
        if ($allowRules->isNotEmpty()) {
            foreach ($allowRules as $rule) {
                if (self::ipMatchesRule($ipAddress, $rule->ip_address)) {
                    return true; // Allowed
                }
            }
            return false; // No matching allow rule
        }

        // No restrictions means allow
        return true;
    }

    /**
     * Check if an IP address matches a rule (supports CIDR notation).
     */
    public static function ipMatchesRule(string $ip, string $rule): bool
    {
        // Exact match
        if ($ip === $rule) {
            return true;
        }

        // CIDR notation support
        if (str_contains($rule, '/')) {
            return self::ipInCidr($ip, $rule);
        }

        // Wildcard support (*)
        if (str_contains($rule, '*')) {
            $pattern = str_replace('*', '.*', preg_quote($rule, '/'));
            return preg_match("/^{$pattern}$/", $ip) === 1;
        }

        return false;
    }

    /**
     * Check if IP is within CIDR range.
     */
    private static function ipInCidr(string $ip, string $cidr): bool
    {
        list($subnet, $mask) = explode('/', $cidr);

        if (filter_var($subnet, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) &&
            filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            return self::ipv4InCidr($ip, $subnet, (int)$mask);
        }

        if (filter_var($subnet, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6) &&
            filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
            return self::ipv6InCidr($ip, $subnet, (int)$mask);
        }

        return false;
    }

    /**
     * Check IPv4 in CIDR range.
     */
    private static function ipv4InCidr(string $ip, string $subnet, int $mask): bool
    {
        $ip = ip2long($ip);
        $subnet = ip2long($subnet);
        $mask = -1 << (32 - $mask);
        return ($ip & $mask) === ($subnet & $mask);
    }

    /**
     * Check IPv6 in CIDR range.
     */
    private static function ipv6InCidr(string $ip, string $subnet, int $mask): bool
    {
        // For simplicity, convert to binary and compare
        $ipBinary = inet_pton($ip);
        $subnetBinary = inet_pton($subnet);

        $maskBytes = ceil($mask / 8);
        $maskBinary = str_repeat("\xFF", $maskBytes);

        if (strlen($maskBinary) < 16) {
            $maskBinary .= str_repeat("\x00", 16 - strlen($maskBinary));
        }

        return ($ipBinary & $maskBinary) === ($subnetBinary & $maskBinary);
    }
}
