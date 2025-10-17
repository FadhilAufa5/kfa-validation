import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

// Komponen Ikon untuk kemudahan
const ValidationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-green-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const AnalyticsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-blue-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12A2.25 2.25 0 0020.25 14.25V3M3.75 21h16.5M16.5 3.75h.008v.008H16.5V3.75z" />
    </svg>
);

const ReportingIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-indigo-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5-15h16.5a2.25 2.25 0 012.25 2.25v10.5A2.25 2.25 0 0118.75 21H5.25A2.25 2.25 0 013 18.75V5.25A2.25 2.25 0 015.25 3z" />
    </svg>
);


export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    // Menambahkan kelas 'loaded' setelah komponen di-mount untuk memicu animasi
    // Anda dapat menggunakan useEffect untuk ini jika diperlukan untuk timing yang lebih kompleks
    return (
        <>
            <Head title="Sistem Validasi Data">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=inter:400,500,600,700,800&display=swap"
                    rel="stylesheet"
                />
            </Head>
            
            {/* Wrapper utama dengan latar belakang gelap */}
            <div className="relative min-h-screen overflow-hidden bg-[#0a192f] text-gray-300 font-sans">
                
                {/* Elemen Latar Belakang Beranimasi (Aurora Effect) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[150%]">
                    <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-blue-500/30 rounded-full filter blur-3xl animate-blob"></div>
                    <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-green-500/30 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
                    <div className="absolute bottom-1/4 left-1/4 w-1/2 h-1/2 bg-indigo-500/30 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
                </div>

                {/* Konten Utama (di atas latar belakang) */}
                <div className="relative z-10 flex flex-col min-h-screen">
                    <header className="w-full p-6">
                        <nav className="flex items-center justify-end gap-6 text-sm font-semibold">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="px-4 py-2 transition hover:text-green-400 focus:outline-none"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="px-4 py-2 transition hover:text-green-400 focus:outline-none"
                                    >
                                        Log In
                                    </Link>
                                    <Link
                                        href={register()}
                                        className="rounded-md bg-green-500 px-4 py-2 text-white shadow-lg shadow-green-500/20 transition-all hover:bg-green-600 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                                    >
                                        Register
                                    </Link>
                                </>
                            )}
                        </nav>
                    </header>

                    <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                     <img src="https://upload.wikimedia.org/wikipedia/commons/c/c3/Kimia-Farma-Apotek_MemberofBiofarma.png" alt="" className="w-32 h-22 mb-12 " />
                        <div className="animate-fade-in-up">
                            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-100">
                                Portal Konsolidasi Data
                            </h1>
                            <p className="mt-6 max-w-2xl mx-auto text-lg leading-8 text-gray-400">
                                Pastikan akurasi data Anda dengan sistem validasi otomatis kami. Cepat, efisien, dan andal untuk mendukung keputusan bisnis Anda.
                            </p>
                            <div className="mt-10 flex items-center justify-center gap-x-6">
                                <Link
                                    href={auth.user ? dashboard() : login()}
                                    className="rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-700 hover:scale-105"
                                >
                                    Mulai Validasi
                                </Link>
                            </div>
                        </div>

                        {/* Kartu Fitur */}
                        <div className="mt-38 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
                            <div className="animate-fade-in-up animation-delay-200 flex flex-col items-center gap-4 rounded-xl bg-white/5 p-8 border border-white/10 backdrop-blur-sm transition-all hover:border-green-400/50 hover:-translate-y-2">
                                <ValidationIcon />
                                <h3 className="text-xl font-bold text-white">Validasi Akurat</h3>
                                <p className="text-gray-400">
                                    Sistem kami secara cerdas membandingkan dan memvalidasi setiap transaksi untuk mencegah kesalahan.
                                </p>
                            </div>
                            <div className="animate-fade-in-up animation-delay-400 flex flex-col items-center gap-4 rounded-xl bg-white/5 p-8 border border-white/10 backdrop-blur-sm transition-all hover:border-blue-400/50 hover:-translate-y-2">
                                <AnalyticsIcon />
                                <h3 className="text-xl font-bold text-white">Dasbor Analitik</h3>
                                <p className="text-gray-400">
                                    Pantau status validasi secara *real-time* melalui dasbor interaktif yang mudah dipahami.
                                </p>
                            </div>
                            <div className="animate-fade-in-up animation-delay-600 flex flex-col items-center gap-4 rounded-xl bg-white/5 p-8 border border-white/10 backdrop-blur-sm transition-all hover:border-indigo-400/50 hover:-translate-y-2">
                                <ReportingIcon />
                                <h3 className="text-xl font-bold text-white">Laporan Otomatis</h3>
                                <p className="text-gray-400">
                                    Hasilkan laporan validasi secara otomatis untuk keperluan audit dan analisis lebih lanjut.
                                </p>
                            </div>
                        </div>
                    </main>
                    
                    <footer className="py-8 text-center text-sm text-gray-500">
                        <p>Kimia Farma Apotek &copy; {new Date().getFullYear()}</p>
                    </footer>
                </div>
            </div>
            
            {/* CSS untuk Animasi */}
            <style>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 { animation-delay: 2s; }
                .animation-delay-4000 { animation-delay: 4s; }

                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.8s ease-out forwards;
                    opacity: 0; /* Start hidden */
                }
                .animation-delay-200 { animation-delay: 0.2s; }
                .animation-delay-400 { animation-delay: 0.4s; }
                .animation-delay-600 { animation-delay: 0.6s; }
            `}</style>
        </>
    );
}