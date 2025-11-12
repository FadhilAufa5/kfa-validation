import { Head } from '@inertiajs/react';
import { AlertTriangle, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Maintenance() {
    const handleLogout = () => {
        window.location.href = route('logout');
    };

    return (
        <>
            <Head title="System Maintenance" />
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
                <Card className="max-w-2xl w-full shadow-xl">
                    <CardHeader className="text-center space-y-4">
                        <div className="mx-auto w-20 h-20 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-10 h-10 text-amber-600 dark:text-amber-400" />
                        </div>
                        <CardTitle className="text-3xl font-bold">
                            System Maintenance Required
                        </CardTitle>
                        <CardDescription className="text-base">
                            Pemeliharaan Sistem Diperlukan
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
                            <h3 className="font-semibold text-lg mb-3 text-amber-900 dark:text-amber-100">
                                Validation Data Not Available
                            </h3>
                            <p className="text-gray-700 dark:text-gray-300 mb-4">
                                The system currently does not have the required validation data (IM Purchases and IM Sales data).
                                This data is essential for the validation features to function properly.
                            </p>
                            <p className="text-gray-700 dark:text-gray-300">
                                Sistem saat ini tidak memiliki data validasi yang diperlukan (data IM Pembelian dan IM Penjualan).
                                Data ini sangat penting agar fitur validasi dapat berfungsi dengan baik.
                            </p>
                        </div>

                        <div className="border-t pt-6">
                            <h4 className="font-semibold mb-4 text-gray-900 dark:text-gray-100">
                                What should I do? / Apa yang harus saya lakukan?
                            </h4>
                            <div className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
                                        1
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-gray-700 dark:text-gray-300">
                                            <strong>Contact the System Administrator</strong> to upload the required validation data.
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            Hubungi Administrator Sistem untuk mengunggah data validasi yang diperlukan.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
                                        2
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-gray-700 dark:text-gray-300">
                                            <strong>Wait for confirmation</strong> that the data has been uploaded successfully.
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            Tunggu konfirmasi bahwa data telah berhasil diunggah.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
                                        3
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-gray-700 dark:text-gray-300">
                                            <strong>Login again</strong> to access the system.
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            Login kembali untuk mengakses sistem.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                            <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">
                                Need Help? / Butuh Bantuan?
                            </h4>
                            <div className="space-y-2">
                                <div className="flex items-center text-gray-700 dark:text-gray-300">
                                    <Mail className="w-4 h-4 mr-2 text-gray-500" />
                                    <span className="text-sm">Email: admin@company.com</span>
                                </div>
                                <div className="flex items-center text-gray-700 dark:text-gray-300">
                                    <Phone className="w-4 h-4 mr-2 text-gray-500" />
                                    <span className="text-sm">Phone: +62 xxx-xxxx-xxxx</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center pt-4">
                            <Button
                                onClick={handleLogout}
                                variant="outline"
                                className="w-full sm:w-auto"
                            >
                                Logout
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
