import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, User, KeyRound, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

interface User {
    id: number;
    name: string;
    email: string;
    role?: string;
    permissions?: string[];
}

interface SecurityCenterModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User;
}

export default function SecurityCenterModal({ isOpen, onClose, currentUser }: SecurityCenterModalProps) {
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
    const [ownName, setOwnName] = useState(currentUser.name);
    const [ownEmail, setOwnEmail] = useState(currentUser.email);
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
    const [resetPasswordError, setResetPasswordError] = useState('');
    
    
        
    
    // Tab state
    const [activeTab, setActiveTab] = useState<'my-account' | 'admin-management'>('my-account');
    
    // State for confirmation dialogs
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<number | null>(null);

    // Loading states
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [updatingOwnPassword, setUpdatingOwnPassword] = useState(false);



    // Fetch users when modal opens (only for super admins)
    useEffect(() => {
        if (isOpen && (currentUser.role === 'Hospital Admin' || currentUser.permissions?.includes('manage-users'))) {
            fetchUsers();
        }
    }, [isOpen, currentUser]);

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
                
            // Update the current user in the parent component
            // This assumes there's a way to update the current user context
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
            
            // Close edit form
            setEditingUserId(null);
            
            // Refresh users list
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
            
            // Refresh users list
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
            
            // Refresh users list
            fetchUsers();
            
            // Close confirmation dialog
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
        
        // Clear any previous messages
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
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-6 w-6 text-yellow-600" />
                        Security Center
                    </DialogTitle>
                </DialogHeader>
                
                <div className="w-full">
                    <div className="grid w-full grid-cols-2 mb-4">
                        <Button 
                            type="button"
                            variant={activeTab === 'my-account' ? 'default' : 'outline'}
                            className="rounded-r-none"
                            onClick={() => setActiveTab('my-account')}
                        >
                            My Account
                        </Button>
                        <Button 
                            type="button"
                            variant={activeTab === 'admin-management' ? 'default' : 'outline'}
                            className="rounded-l-none"
                            onClick={() => {
                                if (currentUser.role === 'Hospital Admin' || currentUser.permissions?.includes('manage-users')) {
                                    setActiveTab('admin-management');
                                }
                            }}
                            disabled={!(currentUser.role === 'Hospital Admin' || currentUser.permissions?.includes('manage-users'))}
                        >
                            Admin Management
                        </Button>
                    </div>
                    
                    {/* My Account Content */}
                    {activeTab === 'my-account' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Update Your Profile
                                </CardTitle>
                                <CardDescription>Update your account information and password</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {/* Update Profile Info */}
                                    <form onSubmit={handleUpdateOwnProfile} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="ownName">Name</Label>
                                            <Input
                                                id="ownName"
                                                value={ownName}
                                                onChange={(e) => setOwnName(e.target.value)}
                                                placeholder="Enter your name"
                                            />
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label htmlFor="ownEmail">Email</Label>
                                            <Input
                                                id="ownEmail"
                                                value={ownEmail}
                                                onChange={(e) => setOwnEmail(e.target.value)}
                                                placeholder="Enter your email"
                                            />
                                        </div>
                                        
                                        {ownProfileError && (
                                            <Alert variant="destructive">
                                                <AlertDescription>{ownProfileError}</AlertDescription>
                                            </Alert>
                                        )}
                                        
                                        {ownProfileMessage && (
                                            <Alert>
                                                <AlertDescription>{ownProfileMessage}</AlertDescription>
                                            </Alert>
                                        )}
                                        
                                        <Button type="submit" disabled={updatingOwnProfile} className="w-full">
                                            {updatingOwnProfile ? 'Updating...' : 'Update Profile'}
                                        </Button>
                                    </form>
                                    
                                    <hr className="my-6" />
                                    
                                    {/* Change Password */}
                                    <form onSubmit={handleUpdateOwnPassword} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="currentPassword">Current Password</Label>
                                            <div className="relative">
                                                <Input
                                                    id="currentPassword"
                                                    type={showCurrentPassword ? "text" : "password"}
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    placeholder="Enter current password"
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                >
                                                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label htmlFor="newPassword">New Password</Label>
                                            <div className="relative">
                                                <Input
                                                    id="newPassword"
                                                    type={showNewPassword ? "text" : "password"}
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    placeholder="Enter new password"
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                >
                                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                                            <div className="relative">
                                                <Input
                                                    id="confirmNewPassword"
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    value={confirmNewPassword}
                                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                                    placeholder="Confirm new password"
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                >
                                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {passwordError && (
                                            <Alert variant="destructive">
                                                <AlertDescription>{passwordError}</AlertDescription>
                                            </Alert>
                                        )}
                                        
                                        {passwordMessage && (
                                            <Alert>
                                                <AlertDescription>{passwordMessage}</AlertDescription>
                                            </Alert>
                                        )}
                                        
                                        <Button type="submit" disabled={updatingOwnPassword} className="w-full">
                                            {updatingOwnPassword ? 'Updating...' : 'Update Password'}
                                        </Button>
                                    </form>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    
                    {/* Admin Management Content */}
                    {activeTab === 'admin-management' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <KeyRound className="h-5 w-5" />
                                    Manage User Accounts
                                </CardTitle>
                                <CardDescription>View, create, update, and delete user accounts</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loadingUsers ? (
                                    <div className="text-center py-4">Loading users...</div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Create User Form */}
                                        <div className="border rounded-lg p-4 bg-blue-50">
                                            <h3 className="font-medium mb-3">Create New User</h3>
                                            <form onSubmit={handleCreateUser} className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="userName">Name</Label>
                                                        <Input
                                                            id="userName"
                                                            value={userName}
                                                            onChange={(e) => setUserName(e.target.value)}
                                                            placeholder="Enter user name"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="userEmail">Email</Label>
                                                        <Input
                                                            id="userEmail"
                                                            value={userEmail}
                                                            onChange={(e) => setUserEmail(e.target.value)}
                                                            placeholder="Enter user email"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="userRole">Role</Label>
                                                        <select
                                                            id="userRole"
                                                            value={userRole}
                                                            onChange={(e) => setUserRole(e.target.value)}
                                                            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            <option value="">Select role...</option>
                                                            <option value="Hospital Admin">Super Admin</option>
                                                            <option value="Doctor">Doctor</option>
                                                            <option value="Reception">Reception</option>
                                                            <option value="Pharmacy Admin">Pharmacy Admin</option>
                                                            <option value="Laboratory Admin">Laboratory Admin</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                
                                                {userManagementError && (
                                                    <Alert variant="destructive">
                                                        <AlertDescription>{userManagementError}</AlertDescription>
                                                    </Alert>
                                                )}
                                                
                                                {userManagementMessage && (
                                                    <Alert>
                                                        <AlertDescription>{userManagementMessage}</AlertDescription>
                                                    </Alert>
                                                )}
                                                
                                                <Button 
                                                    type="submit" 
                                                    disabled={creatingUser}
                                                    className="w-full"
                                                >
                                                    {creatingUser ? 'Creating...' : 'Create User'}
                                                </Button>
                                            </form>
                                        </div>
                                        
                                        {/* Users List */}
                                        <div className="border rounded-lg p-4">
                                            <h3 className="font-medium mb-3">All Users</h3>
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead>
                                                        <tr className="border-b">
                                                            <th className="text-left py-2">Name</th>
                                                            <th className="text-left py-2">Email</th>
                                                            <th className="text-left py-2">Role</th>
                                                            <th className="text-left py-2">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {users.map(user => (
                                                            <tr key={user.id} className="border-b">
                                                                <td className="py-2">{user.name}</td>
                                                                <td className="py-2">{user.email}</td>
                                                                <td className="py-2">{user.role || 'User'}</td>
                                                                <td className="py-2 space-x-2">
                                                                    <Button 
                                                                        size="sm" 
                                                                        variant="outline"
                                                                        onClick={() => {
                                                                            setEditingUserId(user.id);
                                                                            setEditingUserName(user.name);
                                                                            setEditingUserEmail(user.email);
                                                                            setEditingUserRole(user.role || '');
                                                                        }}
                                                                    >
                                                                        Edit
                                                                    </Button>
                                                                    <Button 
                                                                        size="sm" 
                                                                        variant="outline"
                                                                        onClick={() => handleResetPassword(user.id)}
                                                                        disabled={resettingPassword}
                                                                    >
                                                                        Reset Pass
                                                                    </Button>
                                                                    <Button 
                                                                        size="sm" 
                                                                        variant="destructive"
                                                                        onClick={() => setShowDeleteConfirmation(user.id)}
                                                                        disabled={deletingUser}
                                                                    >
                                                                        Delete
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                        
                                        {/* Edit User Form */}
                                        {editingUserId && (
                                            <div className="border rounded-lg p-4 bg-yellow-50">
                                                <h3 className="font-medium mb-3">Edit User</h3>
                                                <form onSubmit={handleUpdateUserProfile} className="space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="editUserName">Name</Label>
                                                            <Input
                                                                id="editUserName"
                                                                value={editingUserName}
                                                                onChange={(e) => setEditingUserName(e.target.value)}
                                                                placeholder="Enter user name"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="editUserEmail">Email</Label>
                                                            <Input
                                                                id="editUserEmail"
                                                                value={editingUserEmail}
                                                                onChange={(e) => setEditingUserEmail(e.target.value)}
                                                                placeholder="Enter user email"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="editUserRole">Role</Label>
                                                            <select
                                                                id="editUserRole"
                                                                value={editingUserRole}
                                                                onChange={(e) => setEditingUserRole(e.target.value)}
                                                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                <option value="Hospital Admin">Super Admin</option>
                                                                <option value="Doctor">Doctor</option>
                                                                <option value="Reception">Reception</option>
                                                                <option value="Pharmacy Admin">Pharmacy Admin</option>
                                                                <option value="Laboratory Admin">Laboratory Admin</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    
                                                    {userProfileError && (
                                                        <Alert variant="destructive">
                                                            <AlertDescription>{userProfileError}</AlertDescription>
                                                        </Alert>
                                                    )}
                                                    
                                                    {userProfileMessage && (
                                                        <Alert>
                                                            <AlertDescription>{userProfileMessage}</AlertDescription>
                                                        </Alert>
                                                    )}
                                                    
                                                    <div className="flex space-x-2">
                                                        <Button 
                                                            type="submit" 
                                                            disabled={updatingUserProfile}
                                                            className="w-full"
                                                        >
                                                            {updatingUserProfile ? 'Updating...' : 'Update User'}
                                                        </Button>
                                                        <Button 
                                                            type="button" 
                                                            variant="outline"
                                                            onClick={() => setEditingUserId(null)}
                                                            className="w-full"
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
                                                <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                                                    <h3 className="font-bold text-lg mb-2">Confirm Deletion</h3>
                                                    <p className="mb-4">Are you sure you want to delete this user? This action cannot be undone.</p>
                                                    <div className="flex space-x-2">
                                                        <Button 
                                                            variant="destructive" 
                                                            onClick={() => handleDeleteUser(showDeleteConfirmation)}
                                                            disabled={deletingUser}
                                                        >
                                                            {deletingUser ? 'Deleting...' : 'Delete'}
                                                        </Button>
                                                        <Button 
                                                            variant="outline"
                                                            onClick={() => setShowDeleteConfirmation(null)}
                                                            disabled={deletingUser}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}