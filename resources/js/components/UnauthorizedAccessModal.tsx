import { useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, ShieldAlert, ShieldX, Lock, ArrowLeft, Mail, UserPlus, AlertTriangle } from 'lucide-react';
import { router } from '@inertiajs/react';

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

export interface UnauthorizedAccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message?: string;
    requiredPermission?: string;
    riskLevel?: RiskLevel;
    showRequestAccess?: boolean;
    redirectUrl?: string;
    onRequestAccess?: () => void;
    onContactAdmin?: () => void;
}

interface RiskConfig {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    borderColor: string;
    alertVariant: 'default' | 'destructive';
    title: string;
}

const riskConfigs: Record<RiskLevel, RiskConfig> = {
    critical: {
        icon: ShieldX,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        alertVariant: 'destructive',
        title: 'Critical Security Alert',
    },
    high: {
        icon: ShieldAlert,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        alertVariant: 'destructive',
        title: 'High Risk Access Denied',
    },
    medium: {
        icon: Shield,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        alertVariant: 'default',
        title: 'Access Restricted',
    },
    low: {
        icon: Lock,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        alertVariant: 'default',
        title: 'Permission Required',
    },
};

export function UnauthorizedAccessModal({
    isOpen,
    onClose,
    title,
    message,
    requiredPermission,
    riskLevel = 'medium',
    showRequestAccess = false,
    redirectUrl = '/dashboard',
    onRequestAccess,
    onContactAdmin,
}: UnauthorizedAccessModalProps) {
    const config = riskConfigs[riskLevel];
    const IconComponent = config.icon;

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    const handleGoBack = useCallback(() => {
        onClose();
        if (redirectUrl) {
            router.visit(redirectUrl);
        } else {
            window.history.back();
        }
    }, [onClose, redirectUrl]);

    const handleRequestAccess = useCallback(() => {
        if (onRequestAccess) {
            onRequestAccess();
        } else {
            // Default behavior: redirect to permission request page
            router.visit('/admin/permissions/request', {
                method: 'get',
                data: { permission: requiredPermission },
            });
        }
        onClose();
    }, [onRequestAccess, onClose, requiredPermission]);

    const handleContactAdmin = useCallback(() => {
        if (onContactAdmin) {
            onContactAdmin();
        } else {
            // Default behavior: open mailto or redirect to contact page
            window.location.href = 'mailto:admin@hospital.com?subject=Access Request';
        }
        onClose();
    }, [onContactAdmin, onClose]);

    const displayTitle = title || config.title;
    const displayMessage = message || getDefaultMessage(riskLevel, requiredPermission);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                className={`sm:max-w-md ${config.bgColor} ${config.borderColor} border-2`}
                onInteractOutside={(e) => {
                    // Prevent closing when clicking outside for critical/high risk
                    if (riskLevel === 'critical' || riskLevel === 'high') {
                        e.preventDefault();
                    }
                }}
            >
                <DialogHeader className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${config.bgColor} ${config.borderColor} border`}>
                            <IconComponent className={`h-6 w-6 ${config.color}`} />
                        </div>
                        <DialogTitle className={`text-lg font-semibold ${config.color}`}>
                            {displayTitle}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-muted-foreground">
                        {displayMessage}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {requiredPermission && (
                        <Alert variant={config.alertVariant} className={`${config.bgColor} ${config.borderColor}`}>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                <span className="font-medium">Required Permission:</span>{' '}
                                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                                    {requiredPermission}
                                </code>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Risk Level Indicator */}
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Risk Level:</span>
                        <RiskBadge level={riskLevel} />
                    </div>

                    {/* Additional context for high/critical risks */}
                    {(riskLevel === 'critical' || riskLevel === 'high') && (
                        <div className={`rounded-lg border p-3 text-sm ${config.bgColor} ${config.borderColor}`}>
                            <p className="font-medium flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                Security Notice
                            </p>
                            <p className="mt-1 text-muted-foreground">
                                This access attempt has been logged and may be reviewed by security administrators.
                                Repeated unauthorized attempts may result in account suspension.
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={handleGoBack}
                        className="w-full sm:w-auto"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Go Back
                    </Button>

                    {showRequestAccess && (
                        <Button
                            variant="secondary"
                            onClick={handleRequestAccess}
                            className="w-full sm:w-auto"
                        >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Request Access
                        </Button>
                    )}

                    <Button
                        variant={riskLevel === 'critical' || riskLevel === 'high' ? 'default' : 'outline'}
                        onClick={handleContactAdmin}
                        className="w-full sm:w-auto"
                    >
                        <Mail className="mr-2 h-4 w-4" />
                        Contact Admin
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function RiskBadge({ level }: { level: RiskLevel }) {
    const colors = {
        critical: 'bg-red-100 text-red-800 border-red-200',
        high: 'bg-orange-100 text-orange-800 border-orange-200',
        medium: 'bg-amber-100 text-amber-800 border-amber-200',
        low: 'bg-blue-100 text-blue-800 border-blue-200',
    };

    const labels = {
        critical: 'Critical',
        high: 'High',
        medium: 'Medium',
        low: 'Low',
    };

    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors[level]}`}>
            {labels[level]}
        </span>
    );
}

function getDefaultMessage(riskLevel: RiskLevel, permission?: string): string {
    const baseMessages: Record<RiskLevel, string> = {
        critical: 'You have attempted to access a restricted area with critical security implications. This incident will be reported.',
        high: 'You do not have the required permissions to perform this action. This attempt has been logged for security review.',
        medium: 'Access denied. You need additional permissions to access this resource.',
        low: 'This action requires additional permissions. Please contact your administrator if you need access.',
    };

    let message = baseMessages[riskLevel];
    
    if (permission) {
        message += ` The permission '${permission}' is required.`;
    }

    return message;
}

export default UnauthorizedAccessModal;
