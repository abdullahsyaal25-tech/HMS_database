<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Authorization Language Lines
    |--------------------------------------------------------------------------
    |
    | Standardized messages for authorization-related notifications and errors.
    |
    */

    // Default unauthorized messages
    'unauthorized_default' => 'You are not authorized to access this resource.',
    'unauthorized_critical' => 'Critical: Unauthorized access attempt detected. This incident has been logged.',
    'unauthorized_api' => 'Access denied. You do not have the required permissions to perform this action.',
    'unauthorized_guest' => 'Please log in to access this resource.',
    
    // Permission-specific messages
    'permission_required' => 'The ":permission" permission is required to access this resource.',
    'permission_missing' => 'You do not have the required permission: :permission',
    'permission_revoked' => 'Your access to :permission has been revoked.',
    'permission_expired' => 'Your temporary access to :permission has expired.',
    
    // Role-based messages
    'role_required' => 'This action requires the :role role.',
    'role_invalid' => 'Your current role does not permit this action.',
    'role_hierarchy_violation' => 'You cannot modify users with higher or equal role privileges.',
    
    // Rate limiting messages
    'rate_limited' => 'Too many unauthorized access attempts. Please try again later.',
    'rate_limited_with_time' => 'Too many attempts. Please try again in :minutes minutes.',
    'attempts_remaining' => 'You have :attempts remaining attempts before temporary lockout.',
    
    // Critical security messages
    'critical_violation' => 'Critical security violation detected. Administrators have been notified.',
    'security_breach_attempt' => 'Potential security breach attempt detected and blocked.',
    'privileged_access_denied' => 'Privileged access denied. This incident has been escalated.',
    
    // Modal dialog text
    'modal_title' => 'Access Denied',
    'modal_message' => 'You do not have permission to perform this action.',
    'modal_confirm' => 'Understood',
    'modal_cancel' => 'Go Back',
    'modal_contact_admin' => 'Contact Administrator',
    
    // Toast notification titles
    'toast_error_title' => 'Error',
    'toast_warning_title' => 'Warning',
    'toast_info_title' => 'Information',
    'toast_success_title' => 'Success',
    
    // Specific module messages
    'module_patient_access' => 'You do not have access to patient records.',
    'module_doctor_access' => 'You do not have access to doctor management.',
    'module_billing_access' => 'You do not have access to billing functions.',
    'module_pharmacy_access' => 'You do not have access to pharmacy management.',
    'module_lab_access' => 'You do not have access to laboratory functions.',
    'module_admin_access' => 'Administrative access required.',
    
    // API-specific messages
    'api_key_missing' => 'API key is missing or invalid.',
    'api_key_revoked' => 'Your API key has been revoked.',
    'api_rate_limited' => 'API rate limit exceeded.',
    'api_permission_scope' => 'Your API key does not have the required scope: :scope',
    
    // Email notification subjects
    'email_subject_critical' => 'Critical Security Alert - HMS',
    'email_subject_high' => 'High Priority Security Alert - HMS',
    'email_subject_medium' => 'Security Alert - HMS',
    'email_subject_repeated' => 'Repeated Authorization Violations - HMS',
    
    // Email notification body
    'email_greeting' => 'Hello Administrator,',
    'email_critical_body' => 'A critical security violation has been detected on the HMS system.',
    'email_repeated_body' => 'User :user has made multiple unauthorized access attempts.',
    'email_footer' => 'This is an automated security alert from the Hospital Management System.',
    
    // Help and guidance
    'help_contact_admin' => 'Please contact your system administrator if you believe this is an error.',
    'help_request_access' => 'You can request access through the permissions portal.',
    'help_escalation' => 'This incident has been escalated to the security team.',
    
    // Success messages (for access restoration, etc.)
    'access_granted' => 'Access has been granted successfully.',
    'access_restored' => 'Your access has been restored.',
    'permission_approved' => 'Permission request has been approved.',
    
    // Error codes for developers
    'error_code_prefix' => 'Error Code:',
    'error_code_403' => 'AUTH_403_FORBIDDEN',
    'error_code_401' => 'AUTH_401_UNAUTHORIZED',
    'error_code_429' => 'AUTH_429_RATE_LIMITED',
];
