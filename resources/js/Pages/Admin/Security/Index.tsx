import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  Users,
  Plus,
  Edit3,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import axios from 'axios';
import { useState, useEffect } from 'react';
import HospitalLayout from '@/layouts/HospitalLayout';

interface User {
    id: number;
    name: string;
    email: string;
    role?: string;
    permissions?: string[];
}

interface SecurityCenterProps {
    auth: {
        user: User;
    };
}

export default function SecurityCenter({ auth }: SecurityCenterProps) {
    // State for changing own password
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState('');
    const [passwordError, setPasswordError] = useState('');

    // State for updating own profile
    const [ownName, setOwnName] = useState(auth.user.name);
    const [ownEmail, setOwnEmail] = useState(auth.user.email);
    const [updatingOwnProfile, setUpdatingOwnProfile] = useState(false);
    const [ownProfileMessage, setOwnProfileMessage] = useState('');
    const [ownProfileError, setOwnProfileError] = useState('');

    // State for admin to manage other users
    const [users, setUsers] = useState<User[]>([]);

    // State for user management
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userRole, setUserRole] = useState('');
    const [creatingUser, setCreatingUser] = useState(false);
    const [deletingUser, setDeletingUser] = useState(false);
    const [userManagementMessage, setUserManagementMessage] = useState('');
    const [userManagementError, setUserManagementError] = useState('');

    // State for user profile updates
    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const [editingUserName, setEditingUserName] = useState('');
    const [editingUserEmail, setEditingUserEmail] = useState('');
    const [editingUserRole, setEditingUserRole] = useState('');
    const [updatingUserProfile, setUpdatingUserProfile] = useState(false);
    const [userProfileMessage, setUserProfileMessage] = useState('');
    const [userProfileError, setUserProfileError] = useState('');

    // State for password reset
    const [resettingPassword, setResettingPassword] = useState(false);
    const [resetPasswordMessage, setResetPasswordMessage] = useState('');

    // Tab state
    const [activeTab, setActiveTab] = useState<'my-account' | 'admin-management'>('my-account');

    // State for confirmation dialogs
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<number | null>(null);

    // Loading states
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [updatingOwnPassword, setUpdatingOwnPassword] = useState(false);

    // Enhanced UI states
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

    // Fetch users when component mounts (only for super admins)
    useEffect(() => {
        if (auth.user.role === 'Hospital Admin' || auth.user.permissions?.includes('manage-users')) {
            fetchUsers();
        }
    }, [auth.user]);

    // Password strength calculator
    useEffect(() => {
        if (newPassword) {
            let strength = 0;
            if (newPassword.length >= 8) strength += 25;
            if (/[A-Z]/.test(newPassword)) strength += 25;
            if (/[0-9]/.test(newPassword)) strength += 25;
            if (/[^A-Za-z0-9]/.test(newPassword)) strength += 25;
            setPasswordStrength(strength);
        } else {
            setPasswordStrength(0);
        }
    }, [newPassword]);

    // Success animation handler
    useEffect(() => {
        if (passwordMessage || ownProfileMessage || userManagementMessage || userProfileMessage || resetPasswordMessage) {
            setShowSuccessAnimation(true);
            const timer = setTimeout(() => setShowSuccessAnimation(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [passwordMessage, ownProfileMessage, userManagementMessage, userProfileMessage, resetPasswordMessage]);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const response = await axios.get('/api/v1/admin/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            setUserManagementError('Failed to load users');
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleUpdateOwnPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordMessage('');

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            setPasswordError('All fields are required');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setPasswordError('New passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setPasswordError('New password must be at least 8 characters');
            return;
        }

        setUpdatingOwnPassword(true);

        try {
            await axios.put('/api/v1/admin/change-password', {
                current_password: currentPassword,
                new_password: newPassword,
                new_password_confirmation: confirmNewPassword,
            });

            setPasswordMessage('Password updated successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        } catch (error: unknown) {
            console.error('Error updating password:', error);
            let errorMessage = 'Failed to update password. Please try again.';
            if (error instanceof Error && error.message) {
                errorMessage = error.message;
            } else if (typeof error === 'object' && error !== null && 'response' in error) {
                const err = error as { response?: { data?: { message?: string } } };
                if (err.response?.data?.message) {
                    errorMessage = err.response.data.message;
                }
            }
            setPasswordError(errorMessage);
        } finally {
            setUpdatingOwnPassword(false);
        }
    };

    const handleUpdateOwnProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setOwnProfileError('');
        setOwnProfileMessage('');

        if (!ownName.trim()) {
            setOwnProfileError('Name is required');
            return;
        }

        setUpdatingOwnProfile(true);

        try {
            await axios.put('/api/v1/admin/update-profile', {
                name: ownName,
                email: ownEmail,
            });

            setOwnProfileMessage('Profile updated successfully');

        } catch (error: unknown) {
            console.error('Error updating profile:', error);
            let errorMessage = 'Failed to update profile. Please try again.';
            if (error instanceof Error && error.message) {
                errorMessage = error.message;
            } else if (typeof error === 'object' && error !== null && 'response' in error) {
                const err = error as { response?: { data?: { message?: string } } };
                if (err.response?.data?.message) {
                    errorMessage = err.response.data.message;
                }
            }
            setOwnProfileError(errorMessage);
        } finally {
            setUpdatingOwnProfile(false);
        }
    };

    const handleUpdateUserProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setUserProfileError('');
        setUserProfileMessage('');

        if (!editingUserId) {
            setUserProfileError('No user selected for update');
            return;
        }

        setUpdatingUserProfile(true);

        try {
            await axios.put(`/api/v1/admin/users/${editingUserId}/update-profile`, {
                name: editingUserName,
                email: editingUserEmail,
                role: editingUserRole,
            });

            setUserProfileMessage('User profile updated successfully');
            setEditingUserId(null);
            fetchUsers();
        } catch (error: unknown) {
            console.error('Error updating user profile:', error);
            let errorMessage = 'Failed to update user profile. Please try again.';
            if (error instanceof Error && error.message) {
                errorMessage = error.message;
            } else if (typeof error === 'object' && error !== null && 'response' in error) {
                const err = error as { response?: { data?: { message?: string } } };
                if (err.response?.data?.message) {
                    errorMessage = err.response.data.message;
                }
            }
            setUserProfileError(errorMessage);
        } finally {
            setUpdatingUserProfile(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setUserManagementError('');
        setUserManagementMessage('');

        if (!userName.trim() || !userEmail.trim() || !userRole.trim()) {
            setUserManagementError('All fields are required');
            return;
        }

        setCreatingUser(true);

        try {
            await axios.post('/api/v1/admin/users', {
                name: userName,
                email: userEmail,
                role: userRole,
            });

            setUserManagementMessage('User created successfully');
            setUserName('');
            setUserEmail('');
            setUserRole('');
            fetchUsers();
        } catch (error: unknown) {
            console.error('Error creating user:', error);
            let errorMessage = 'Failed to create user. Please try again.';
            if (error instanceof Error && error.message) {
                errorMessage = error.message;
            } else if (typeof error === 'object' && error !== null && 'response' in error) {
                const err = error as { response?: { data?: { message?: string } } };
                if (err.response?.data?.message) {
                    errorMessage = err.response.data.message;
                }
            }
            setUserManagementError(errorMessage);
        } finally {
            setCreatingUser(false);
        }
    };

    const handleDeleteUser = async (userId: number) => {
        setDeletingUser(true);

        try {
            await axios.delete(`/api/v1/admin/users/${userId}`);

            setUserManagementMessage('User deleted successfully');
            fetchUsers();
            setShowDeleteConfirmation(null);
        } catch (error: unknown) {
            console.error('Error deleting user:', error);
            let errorMessage = 'Failed to delete user. Please try again.';
            if (error instanceof Error && error.message) {
                errorMessage = error.message;
            } else if (typeof error === 'object' && error !== null && 'response' in error) {
                const err = error as { response?: { data?: { message?: string } } };
                if (err.response?.data?.message) {
                    errorMessage = err.response.data.message;
                }
            }
            setUserManagementError(errorMessage);
        } finally {
            setDeletingUser(false);
        }
    };

    const handleResetPassword = async (userId: number) => {
        setResettingPassword(true);
        setResetPasswordError('');
        setResetPasswordMessage('');

        try {
            await axios.put(`/api/v1/admin/users/${userId}/reset-password`);

            setResetPasswordMessage('Password reset successfully');
        } catch (error: unknown) {
            console.error('Error resetting password:', error);
            let errorMessage = 'Failed to reset password. Please try again.';
            if (error instanceof Error && error.message) {
                errorMessage = error.message;
            } else if (typeof error === 'object' && error !== null && 'response' in error) {
                const err = error as { response?: { data?: { message?: string } } };
                if (err.response?.data?.message) {
                    errorMessage = err.response.data.message;
                }
            }
            setResetPasswordError(errorMessage);
        } finally {
            setResettingPassword(false);
        }
    };

    return (
        <HospitalLayout>
            <div className="min-h-screen bg-gray-50 p-4 md:p-8">
                <Head title="Security Center" />

                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Security Center</h1>
                        <p className="text-gray-600 mt-2">Manage usernames, passwords and admin accounts</p>
                    </div>

                    <Tabs value={activeTab} onValueChange={(value) => {
                        if (value === 'admin-management' && !(auth.user.role === 'Hospital Admin' || auth.user.permissions?.includes('manage-users'))) {
                            return;
                        }
                        setActiveTab(value as 'my-account' | 'admin-management');
                    }} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl h-12 mb-6">
                            <TabsTrigger
                                value="my-account"
                                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm rounded-lg h-10 flex items-center gap-2"
                            >
                                <User className="h-4 w-4" />
                                My Account
                            </TabsTrigger>
                            <TabsTrigger
                                value="admin-management"
                                disabled={!(auth.user.role === 'Hospital Admin' || auth.user.permissions?.includes('manage-users'))}
                                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm rounded-lg h-10 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Users className="h-4 w-4" />
                                Admin Management
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="my-account" className="space-y-6">
                            <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
                                <CardHeader className="border-b border-gray-100 dark:border-gray-700 pb-6">
                                    <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900 dark:text-white">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        Account Settings
                                    </CardTitle>
                                    <CardDescription className="text-gray-600 dark:text-gray-300">
                                        Manage your profile information and security settings
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="space-y-8">
                                        {/* Update Profile Info */}
                                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-100 dark:border-gray-800">
                                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                <Edit3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                Personal Information
                                            </h3>
                                            <form onSubmit={handleUpdateOwnProfile} className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="ownName" className="text-gray-700 dark:text-gray-300 font-medium">
                                                        Full Name
                                                    </Label>
                                                    <Input
                                                        id="ownName"
                                                        value={ownName}
                                                        onChange={(e) => setOwnName(e.target.value)}
                                                        placeholder="Enter your full name"
                                                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="ownEmail" className="text-gray-700 dark:text-gray-300 font-medium">
                                                        Email Address
                                                    </Label>
                                                    <Input
                                                        id="ownEmail"
                                                        type="email"
                                                        value={ownEmail}
                                                        onChange={(e) => setOwnEmail(e.target.value)}
                                                        placeholder="Enter your email address"
                                                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>

                                                {ownProfileError && (
                                                    <Alert variant="destructive" className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20">
                                                        <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                                        <AlertDescription className="text-red-800 dark:text-red-200">{ownProfileError}</AlertDescription>
                                                    </Alert>
                                                )}

                                                {ownProfileMessage && (
                                                    <Alert className="border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20">
                                                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                        <AlertDescription className="text-green-800 dark:text-green-200">{ownProfileMessage}</AlertDescription>
                                                    </Alert>
                                                )}

                                                <Button
                                                    type="submit"
                                                    disabled={updatingOwnProfile}
                                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                                                >
                                                    {updatingOwnProfile ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Updating Profile...
                                                        </>
                                                    ) : (
                                                        'Save Changes'
                                                    )}
                                                </Button>
                                            </form>
                                        </div>

                                        <div className="bg-gray-50 rounded-lg p-6 border">
                                            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                                                <Lock className="h-5 w-5" />
                                                Security Settings
                                            </h3>
                                            <form onSubmit={handleUpdateOwnPassword} className="space-y-5">
                                                <div className="space-y-2">
                                                    <Label htmlFor="currentPassword" className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2">
                                                        <Lock className="h-4 w-4" />
                                                        Current Password
                                                    </Label>
                                                    <div className="relative">
                                                        <Input
                                                            id="currentPassword"
                                                            type={showCurrentPassword ? "text" : "password"}
                                                            value={currentPassword}
                                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                                            placeholder="Enter your current password"
                                                            className="pr-12 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                                                        />
                                                        <button
                                                            type="button"
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                        >
                                                            {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="newPassword" className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2">
                                                        <KeyRound className="h-4 w-4" />
                                                        New Password
                                                    </Label>
                                                    <div className="relative">
                                                        <Input
                                                            id="newPassword"
                                                            type={showNewPassword ? "text" : "password"}
                                                            value={newPassword}
                                                            onChange={(e) => setNewPassword(e.target.value)}
                                                            placeholder="Create a strong password"
                                                            className="pr-12 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                                                        />
                                                        <button
                                                            type="button"
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                                        >
                                                            {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                        </button>
                                                    </div>
                                                    {/* Password Strength Indicator */}
                                                    {newPassword && (
                                                        <div className="mt-2">
                                                            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                                                                <span>Password Strength</span>
                                                                <span>
                                                                    {passwordStrength < 50 ? 'Weak' :
                                                                     passwordStrength < 75 ? 'Medium' : 'Strong'}
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                                <div
                                                                    className={`h-2 rounded-full transition-all duration-300 ${
                                                                        passwordStrength < 50 ? 'bg-red-500' :
                                                                        passwordStrength < 75 ? 'bg-yellow-500' : 'bg-green-500'
                                                                    }`}
                                                                    style={{ width: `${passwordStrength}%` }}
                                                                ></div>
                                                            </div>
                                                            <div className="flex gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                                <span className={passwordStrength >= 25 ? 'text-green-600 dark:text-green-400' : ''}>• 8+ chars</span>
                                                                <span className={passwordStrength >= 50 ? 'text-green-600 dark:text-green-400' : ''}>• Uppercase</span>
                                                                <span className={passwordStrength >= 75 ? 'text-green-600 dark:text-green-400' : ''}>• Number</span>
                                                                <span className={passwordStrength >= 100 ? 'text-green-600 dark:text-green-400' : ''}>• Symbol</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="confirmNewPassword" className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2">
                                                        <CheckCircle className="h-4 w-4" />
                                                        Confirm New Password
                                                    </Label>
                                                    <div className="relative">
                                                        <Input
                                                            id="confirmNewPassword"
                                                            type={showConfirmPassword ? "text" : "password"}
                                                            value={confirmNewPassword}
                                                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                                                            placeholder="Re-enter your new password"
                                                            className={`pr-12 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 ${
                                                                confirmNewPassword && newPassword !== confirmNewPassword
                                                                    ? 'border-red-300 focus:ring-red-500'
                                                                    : ''
                                                            }`}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        >
                                                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                        </button>
                                                    </div>
                                                    {confirmNewPassword && newPassword !== confirmNewPassword && (
                                                        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                                                            <AlertTriangle className="h-4 w-4" />
                                                            Passwords do not match
                                                        </p>
                                                    )}
                                                </div>

                                                {passwordError && (
                                                    <Alert variant="destructive" className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20">
                                                        <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                                        <AlertDescription className="text-red-800 dark:text-red-200">{passwordError}</AlertDescription>
                                                    </Alert>
                                                )}

                                                {passwordMessage && showSuccessAnimation && (
                                                    <Alert className="border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20 animate-pulse">
                                                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                        <AlertDescription className="text-green-800 dark:text-green-200">{passwordMessage}</AlertDescription>
                                                    </Alert>
                                                )}

                                                <Button
                                                    type="submit"
                                                    disabled={updatingOwnPassword || !currentPassword || !newPassword || !confirmNewPassword || newPassword !== confirmNewPassword}
                                                    className="w-full"
                                                >
                                                    {updatingOwnPassword ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Updating Password...
                                                        </>
                                                    ) : (
                                                        'Update Password'
                                                    )}
                                                </Button>
                                            </form>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="admin-management" className="space-y-6">
                            <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
                                <CardHeader className="border-b border-gray-100 dark:border-gray-700 pb-6">
                                    <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900 dark:text-white">
                                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                            <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        User Management
                                    </CardTitle>
                                    <CardDescription className="text-gray-600 dark:text-gray-300">
                                        Create, edit, and manage user accounts and permissions
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    {loadingUsers ? (
                                        <div className="text-center py-12">
                                            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                                                <Loader2 className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-spin" />
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-400">Loading user data...</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-8">
                                            {/* Create User Form */}
                                            <div className="bg-gray-50 rounded-lg p-6 border">
                                                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                                                    <Plus className="h-5 w-5" />
                                                    Create New User
                                                </h3>
                                                <form onSubmit={handleCreateUser} className="space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="userName" className="text-gray-700 dark:text-gray-300 font-medium">
                                                                Full Name
                                                            </Label>
                                                            <Input
                                                                id="userName"
                                                                value={userName}
                                                                onChange={(e) => setUserName(e.target.value)}
                                                                placeholder="Enter user's full name"
                                                                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="userEmail" className="text-gray-700 dark:text-gray-300 font-medium">
                                                                Email Address
                                                            </Label>
                                                            <Input
                                                                id="userEmail"
                                                                type="email"
                                                                value={userEmail}
                                                                onChange={(e) => setUserEmail(e.target.value)}
                                                                placeholder="Enter user's email"
                                                                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="userRole" className="text-gray-700 dark:text-gray-300 font-medium">
                                                                User Role
                                                            </Label>
                                                            <select
                                                                id="userRole"
                                                                value={userRole}
                                                                onChange={(e) => setUserRole(e.target.value)}
                                                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                                            >
                                                                <option value="">Select a role...</option>
                                                                <option value="Hospital Admin">🏥 Hospital Admin</option>
                                                                <option value="Doctor">👨‍⚕️ Doctor</option>
                                                                <option value="Reception">📋 Reception</option>
                                                                <option value="Pharmacy Admin">💊 Pharmacy Admin</option>
                                                                <option value="Laboratory Admin">🧪 Laboratory Admin</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {userManagementError && (
                                                        <Alert variant="destructive" className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20">
                                                            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                                            <AlertDescription className="text-red-800 dark:text-red-200">{userManagementError}</AlertDescription>
                                                        </Alert>
                                                    )}

                                                    {userManagementMessage && showSuccessAnimation && (
                                                        <Alert className="border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20 animate-pulse">
                                                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                            <AlertDescription className="text-green-800 dark:text-green-200">{userManagementMessage}</AlertDescription>
                                                        </Alert>
                                                    )}

                                                    <Button
                                                        type="submit"
                                                        disabled={creatingUser || !userName.trim() || !userEmail.trim() || !userRole.trim()}
                                                        className="w-full"
                                                    >
                                                        {creatingUser ? (
                                                            <>
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                Creating User...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Plus className="mr-2 h-4 w-4" />
                                                                Create User
                                                            </>
                                                        )}
                                                    </Button>
                                                </form>
                                            </div>

                                            {/* Users List */}
                                            <div className="border rounded-lg p-6 bg-white dark:bg-gray-800">
                                                <h3 className="font-semibold mb-4 text-lg text-gray-900 dark:text-white">All Users</h3>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead>
                                                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                                                <th className="text-left py-3 px-2 text-gray-700 dark:text-gray-300 font-medium">Name</th>
                                                                <th className="text-left py-3 px-2 text-gray-700 dark:text-gray-300 font-medium">Email</th>
                                                                <th className="text-left py-3 px-2 text-gray-700 dark:text-gray-300 font-medium">Role</th>
                                                                <th className="text-left py-3 px-2 text-gray-700 dark:text-gray-300 font-medium">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {users.map(user => (
                                                                <tr key={user.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                                    <td className="py-3 px-2 text-gray-900 dark:text-white">{user.name}</td>
                                                                    <td className="py-3 px-2 text-gray-900 dark:text-white">{user.email}</td>
                                                                    <td className="py-3 px-2">
                                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                            user.role === 'Hospital Admin' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                                            user.role === 'Doctor' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                                                            user.role === 'Reception' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                                            user.role === 'Pharmacy Admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                                                                            user.role === 'Laboratory Admin' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                                                                            'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                                                                        }`}>
                                                                            {user.role || 'User'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-3 px-2">
                                                                        <div className="flex space-x-2">
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={() => {
                                                                                    setEditingUserId(user.id);
                                                                                    setEditingUserName(user.name);
                                                                                    setEditingUserEmail(user.email);
                                                                                    setEditingUserRole(user.role || '');
                                                                                }}
                                                                                className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
                                                                            >
                                                                                <Edit3 className="h-3 w-3" />
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={() => handleResetPassword(user.id)}
                                                                                disabled={resettingPassword}
                                                                                className="text-yellow-600 border-yellow-200 hover:bg-yellow-50 dark:border-yellow-700 dark:text-yellow-400 dark:hover:bg-yellow-900/20"
                                                                            >
                                                                                <KeyRound className="h-3 w-3" />
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="destructive"
                                                                                onClick={() => setShowDeleteConfirmation(user.id)}
                                                                                disabled={deletingUser}
                                                                            >
                                                                                <Trash2 className="h-3 w-3" />
                                                                            </Button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Edit User Form */}
                                            {editingUserId && (
                                                <div className="border rounded-lg p-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                                                    <h3 className="font-semibold mb-4 text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                                        <Edit3 className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                                                        Edit User
                                                    </h3>
                                                    <form onSubmit={handleUpdateUserProfile} className="space-y-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="editUserName" className="text-gray-700 dark:text-gray-300 font-medium">Name</Label>
                                                                <Input
                                                                    id="editUserName"
                                                                    value={editingUserName}
                                                                    onChange={(e) => setEditingUserName(e.target.value)}
                                                                    placeholder="Enter user name"
                                                                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="editUserEmail" className="text-gray-700 dark:text-gray-300 font-medium">Email</Label>
                                                                <Input
                                                                    id="editUserEmail"
                                                                    value={editingUserEmail}
                                                                    onChange={(e) => setEditingUserEmail(e.target.value)}
                                                                    placeholder="Enter user email"
                                                                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="editUserRole" className="text-gray-700 dark:text-gray-300 font-medium">Role</Label>
                                                                <select
                                                                    id="editUserRole"
                                                                    value={editingUserRole}
                                                                    onChange={(e) => setEditingUserRole(e.target.value)}
                                                                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm shadow-xs transition-colors"
                                                                >
                                                                    <option value="">Select role...</option>
                                                                    <option value="Hospital Admin">Hospital Admin</option>
                                                                    <option value="Doctor">Doctor</option>
                                                                    <option value="Reception">Reception</option>
                                                                    <option value="Pharmacy Admin">Pharmacy Admin</option>
                                                                    <option value="Laboratory Admin">Laboratory Admin</option>
                                                                </select>
                                                            </div>
                                                        </div>

                                                        {userProfileError && (
                                                            <Alert variant="destructive" className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20">
                                                                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                                                <AlertDescription className="text-red-800 dark:text-red-200">{userProfileError}</AlertDescription>
                                                            </Alert>
                                                        )}

                                                        {userProfileMessage && showSuccessAnimation && (
                                                            <Alert className="border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20 animate-pulse">
                                                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                                <AlertDescription className="text-green-800 dark:text-green-200">{userProfileMessage}</AlertDescription>
                                                            </Alert>
                                                        )}

                                                        <div className="flex space-x-3 pt-2">
                                                            <Button
                                                                type="submit"
                                                                disabled={updatingUserProfile}
                                                                className="flex-1"
                                                            >
                                                                {updatingUserProfile ? (
                                                                    <>
                                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                        Updating User...
                                                                    </>
                                                                ) : (
                                                                    'Save Changes'
                                                                )}
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                onClick={() => setEditingUserId(null)}
                                                                className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    </form>
                                                </div>
                                            )}

                                            {/* Delete Confirmation Dialog */}
                                            {showDeleteConfirmation && (
                                                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirm Deletion</h3>
                                                        </div>
                                                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                                                            Are you sure you want to delete this user? This action cannot be undone.
                                                        </p>
                                                        <div className="flex space-x-3 justify-end">
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => setShowDeleteConfirmation(null)}
                                                                disabled={deletingUser}
                                                                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                            >
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                onClick={() => handleDeleteUser(showDeleteConfirmation)}
                                                                disabled={deletingUser}
                                                            >
                                                                {deletingUser ? (
                                                                    <>
                                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                        Deleting...
                                                                    </>
                                                                ) : (
                                                                    'Delete User'
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </HospitalLayout>
    );
}