import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Loader2 } from 'lucide-react';

interface ForgotPasswordProps {
    status?: string;
}

export default function ForgotPassword({ status }: ForgotPasswordProps) {
    const { data, setData, post, processing, errors } = useForm({
        username: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <Head title="Forgot Password" />
            
            <div className="w-full max-w-md">
                <Card className="shadow-lg">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-center">Forgot Password</CardTitle>
                        <CardDescription className="text-center">
                            Enter your username to receive a password reset link
                        </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                        {status && (
                            <Alert className="mb-4">
                                <AlertDescription>{status}</AlertDescription>
                            </Alert>
                        )}

                        {errors.username && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertDescription>{errors.username}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={submit}>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="username">Username</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="username"
                                            name="username"
                                            type="text"
                                            placeholder="Enter your username"
                                            value={data.username}
                                            onChange={(e) => setData('username', e.target.value)}
                                            className="pl-10"
                                            required
                                        />
                                    </div>
                                </div>

                                <Button 
                                    type="submit" 
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending Reset Link...
                                        </>
                                    ) : (
                                        'Send Reset Link'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                    
                    <CardFooter className="flex flex-col">
                        <div className="text-center text-sm text-muted-foreground">
                            <p>
                                Remember your password?{' '}
                                <Link 
                                    href={route('login')} 
                                    className="font-medium text-blue-600 hover:underline"
                                >
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}