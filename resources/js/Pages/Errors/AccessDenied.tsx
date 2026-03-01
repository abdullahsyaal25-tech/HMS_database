import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldAlert, Lock, ArrowLeft, Home, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccessDeniedProps {
  status?: number;
  message?: string;
  requestedPage?: string;
  requiredPermission?: string | string[];
  userRole?: string;
}

export default function AccessDenied({
  status = 403,
  message = "You don't have permission to access this page",
  requestedPage,
  requiredPermission,
  userRole,
}: AccessDeniedProps) {
  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      router.visit('/dashboard');
    }
  };

  const formatPermissions = (permissions: string | string[] | undefined): string => {
    if (!permissions) return 'Unknown';
    if (Array.isArray(permissions)) {
      return permissions.join(', ');
    }
    return permissions;
  };

  return (
    <>
      <Head title="Access Denied" />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Main Card */}
          <Card className="border-0 shadow-2xl overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            {/* Top Gradient Bar */}
            <div className="h-2 bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500" />
            
            <CardContent className="p-8 md:p-12">
              <div className="flex flex-col items-center text-center">
                {/* Icon Container with Animation */}
                <div className="relative mb-8">
                  {/* Animated rings */}
                  <div className="absolute inset-0 animate-ping rounded-full bg-rose-200 dark:bg-rose-900 opacity-20" style={{ animationDuration: '3s' }} />
                  <div className="absolute -inset-4 rounded-full bg-gradient-to-br from-rose-100 to-orange-100 dark:from-rose-950/50 dark:to-orange-950/50 opacity-60" />
                  
                  {/* Main Icon */}
                  <div className={cn(
                    "relative flex items-center justify-center w-28 h-28 rounded-full",
                    "bg-gradient-to-br from-rose-500 to-orange-600",
                    "shadow-lg shadow-rose-500/25 dark:shadow-rose-500/10"
                  )}>
                    <ShieldAlert className="w-14 h-14 text-white" strokeWidth={1.5} />
                  </div>
                  
                  {/* Lock badge */}
                  <div className="absolute -bottom-2 -right-2 flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-lg">
                    <Lock className="w-5 h-5 text-rose-500" />
                  </div>
                </div>

                {/* Status Code */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-sm font-semibold mb-4">
                  <AlertCircle className="w-4 h-4" />
                  <span>Error {status}</span>
                </div>

                {/* Main Heading */}
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                  Access Denied
                </h1>

                {/* Message */}
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md mb-8">
                  {message}
                </p>

                {/* Details Card */}
                {(requestedPage || requiredPermission || userRole) && (
                  <div className="w-full max-w-md mb-8">
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-left space-y-3">
                      {requestedPage && (
                        <div className="flex items-start gap-3">
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-24 shrink-0">
                            Page
                          </span>
                          <span className="text-sm text-slate-700 dark:text-slate-300 font-medium truncate">
                            {requestedPage}
                          </span>
                        </div>
                      )}
                      {requiredPermission && (
                        <div className="flex items-start gap-3">
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-24 shrink-0">
                            Required
                          </span>
                          <span className="text-sm text-rose-600 dark:text-rose-400 font-medium">
                            {formatPermissions(requiredPermission)}
                          </span>
                        </div>
                      )}
                      {userRole && (
                        <div className="flex items-start gap-3">
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-24 shrink-0">
                            Your Role
                          </span>
                          <span className="text-sm text-slate-700 dark:text-slate-300 font-medium capitalize">
                            {userRole}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleGoBack}
                    className="w-full sm:w-auto gap-2 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Go Back
                  </Button>
                  
                  <Link href="/dashboard">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto gap-2 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white shadow-lg shadow-rose-500/25 dark:shadow-rose-500/10"
                    >
                      <Home className="w-4 h-4" />
                      Go to Dashboard
                    </Button>
                  </Link>
                </div>

                {/* Help Text */}
                <p className="mt-8 text-sm text-slate-500 dark:text-slate-500">
                  If you believe this is a mistake, please contact your system administrator.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-sm text-slate-400 dark:text-slate-600">
              Hospital Management System
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
