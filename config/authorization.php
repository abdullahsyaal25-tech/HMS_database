<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Authorization Service Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains configuration settings for the global authorization
    | service that handles unauthorized access attempts with standardized
    | notifications, flash messages, and modal dialogs.
    |
    */

    /*
    |--------------------------------------------------------------------------
    | Enable/Disable Authorization Features
    |--------------------------------------------------------------------------
    */
    'enabled' => env('AUTHORIZATION_SERVICE_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | Alerting Configuration
    |--------------------------------------------------------------------------
    */
    'alerting' => [
        'default' => [
            'enabled' => true,
            'database_alert' => true,
            'email_alert' => false,
            'broadcast' => false,
        ],
        'critical' => [
            'enabled' => true,
            'database_alert' => true,
            'email_alert' => true,
            'broadcast' => true,
        ],
        'high' => [
            'enabled' => true,
            'database_alert' => true,
            'email_alert' => true,
            'broadcast' => false,
        ],
        'medium' => [
            'enabled' => true,
            'database_alert' => true,
            'email_alert' => false,
            'broadcast' => false,
        ],
        'low' => [
            'enabled' => true,
            'database_alert' => true,
            'email_alert' => false,
            'broadcast' => false,
        ],
        'repeated_violation' => [
            'enabled' => true,
            'database_alert' => true,
            'email_alert' => true,
            'broadcast' => true,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Notification Thresholds
    |--------------------------------------------------------------------------
    | Number of attempts before sending notifications for each violation type.
    */
    'notification_thresholds' => [
        'critical' => 1,    // Notify immediately
        'high' => 3,        // Notify after 3 attempts
        'medium' => 5,      // Notify after 5 attempts
        'low' => 10,        // Notify after 10 attempts
    ],

    /*
    |--------------------------------------------------------------------------
    | Rate Limiting Configuration
    |--------------------------------------------------------------------------
    */
    'rate_limiting' => [
        'enabled' => env('AUTHORIZATION_RATE_LIMITING_ENABLED', true),
        'max_attempts' => env('AUTHORIZATION_RATE_LIMIT_MAX', 10),
        'decay_minutes' => env('AUTHORIZATION_RATE_LIMIT_DECAY', 15),
    ],

    /*
    |--------------------------------------------------------------------------
    | Admin Notification Settings
    |--------------------------------------------------------------------------
    */
    'admin_emails' => explode(',', env('AUTHORIZATION_ADMIN_EMAILS', 'admin@hospital.com')),

    /*
    |--------------------------------------------------------------------------
    | Default Redirect Route
    |--------------------------------------------------------------------------
    | Route to redirect users after unauthorized access attempt.
    */
    'default_redirect_route' => env('AUTHORIZATION_REDIRECT_ROUTE', 'dashboard'),

    /*
    |--------------------------------------------------------------------------
    | Modal Dialog Configuration
    |--------------------------------------------------------------------------
    | Show modal dialogs for critical authorization errors.
    */
    'modal_on_critical' => env('AUTHORIZATION_MODAL_ON_CRITICAL', true),

    /*
    |--------------------------------------------------------------------------
    | Critical Permissions
    |--------------------------------------------------------------------------
    | List of permissions considered critical security risks.
    */
    'critical_permissions' => [
        'super-admin',
        'delete-users',
        'delete-roles',
        'delete-permissions',
        'delete-patients',
        'delete-doctors',
        'delete-medicines',
        'view-audit-logs',
        'restore-backups',
        'edit-settings',
        'maintenance-mode',
    ],

    /*
    |--------------------------------------------------------------------------
    | Privileged Roles
    |--------------------------------------------------------------------------
    | Roles that have elevated access and whose unauthorized attempts
    | are treated with higher severity.
    */
    'privileged_roles' => [
        'super-admin',
        'hospital-admin',
    ],

    /*
    |--------------------------------------------------------------------------
    | Permission Categories
    |--------------------------------------------------------------------------
    | Group permissions by category for different handling strategies.
    */
    'permission_categories' => [
        'critical' => [
            'super-admin',
            'delete-users',
            'delete-roles',
            'delete-permissions',
            'restore-backups',
        ],
        'high' => [
            'edit-users',
            'edit-roles',
            'manage-user-permissions',
            'view-financial-reports',
            'edit-settings',
        ],
        'medium' => [
            'view-users',
            'view-roles',
            'view-permissions',
            'edit-patients',
            'edit-doctors',
        ],
        'low' => [
            'view-patients',
            'view-doctors',
            'view-appointments',
            'view-reports',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Response Configuration by Scenario
    |--------------------------------------------------------------------------
    | Configure different response strategies based on scenarios.
    */
    'responses' => [
        'web' => [
            'type' => 'redirect',
            'with_flash' => true,
            'with_modal' => false,
        ],
        'api' => [
            'type' => 'json',
            'status_code' => 403,
        ],
        'inertia' => [
            'type' => 'inertia',
            'with_flash' => true,
            'with_modal' => true,
        ],
        'ajax' => [
            'type' => 'json',
            'status_code' => 403,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Audit Logging Configuration
    |--------------------------------------------------------------------------
    */
    'audit_logging' => [
        'enabled' => env('AUTHORIZATION_AUDIT_LOGGING', true),
        'log_level' => env('AUTHORIZATION_LOG_LEVEL', 'warning'),
        'include_request_data' => env('AUTHORIZATION_LOG_REQUEST_DATA', false),
        'include_user_agent' => true,
        'include_ip_address' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Security Settings
    |--------------------------------------------------------------------------
    */
    'security' => [
        'block_repeat_offenders' => env('AUTHORIZATION_BLOCK_REPEATERS', false),
        'block_threshold' => env('AUTHORIZATION_BLOCK_THRESHOLD', 50),
        'block_duration_minutes' => env('AUTHORIZATION_BLOCK_DURATION', 60),
        'notify_on_privileged_violation' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Frontend Integration
    |--------------------------------------------------------------------------
    | Configuration for frontend toast and modal handling.
    */
    'frontend' => [
        'toast_duration' => 5000,  // milliseconds
        'modal_confirm_required' => true,
        'auto_dismiss_warnings' => true,
        'persistent_errors' => true,
    ],
];
