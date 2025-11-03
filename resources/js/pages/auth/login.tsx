import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { Form, Head, Link } from '@inertiajs/react';
import { Shield } from 'lucide-react';

interface LoginProps {
    status?: string;
}

export default function Login({ status }: LoginProps) {
    return (
        <AuthLayout
            title="Hallo! Selamat Datang"
            description="Masukan email aktif anda untuk masuk ke dalam sistem."
        >
            <Head title="Login" />

            <Form action="/login/otp" method="post" className="flex flex-col gap-6">
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                tabIndex={2}
                                disabled={processing}
                            >
                                {processing && <Spinner />}
                                Continue with Email
                            </Button>

                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-200">
                                <p className="font-medium">ℹ️ How it works:</p>
                                <ul className="mt-1 list-inside list-disc space-y-1 text-xs">
                                    <li>Enter your registered email address</li>
                                    <li>We'll send a 6-digit code to your email</li>
                                    <li>Enter the code to login without password</li>
                                    <li>Contact admin if you don't have an account yet</li>
                                </ul>
                            </div>

                            <div className="text-center">
                                <Link 
                                    href="/admin/login" 
                                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <Shield className="w-4 h-4" />
                                    Super Admin Login
                                </Link>
                            </div>
                        </div>
                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </AuthLayout>
    );
}
