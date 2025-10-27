import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AppLayout from "@/layouts/app-layout";
import { dashboard } from "@/routes";
import { type BreadcrumbItem } from "@/types";
import { Head, usePage } from "@inertiajs/react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Sector,
} from "recharts";
import {
  TrendingUp, Package, Users, ShoppingBag, 
  AlertCircle, Clock, Download, Upload,
  ArrowUpRight, ArrowDownRight, Bell
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Dashboard", href: dashboard().url },
];

// Dummy data untuk Pie Chart
const purchaseData = [
  { name: "Retur", value: 12 },
  { name: "Mendesak", value: 7 },
  { name: "Reguler", value: 31 },   
];

const salesTypeData = [
  { name: "Reguler", value: 25 },
  { name: "Debitur", value: 14 },
  { name: "Ecommerce", value: 20 },
  { name: "Konsi", value: 8 },
];

const COLORS_PURCHASE = ["#F97316", "#10B981", "#3B82F6"];
const COLORS_SALES = ["#6366F1", "#F59E0B", "#84CC16", "#EC4899"];

// Label di tengah slice Pie
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-[13px] font-semibold drop-shadow-md"
    >
      {value}
    </text>
  );
};

// Update recentActivities with timestamps
const recentActivities = [
  { id: 1, user: "John Doe", action: "mengupload file penjualan", time: "2 menit yang lalu", isNew: true },
  { id: 2, user: "Jane Smith", action: "memperbarui data pembelian", time: "5 menit yang lalu", isNew: true },
  { id: 3, user: "Mike Johnson", action: "menghapus file", time: "10 menit yang lalu", isNew: false },
  { id: 4, user: "Sarah Wilson", action: "menambahkan user baru", time: "15 menit yang lalu", isNew: false },
];


export default function Dashboard() {
  const {
    activeUsersCount = 1,
    dummyData = { totalSales: 0, activeProducts: 0, incomingOrders: 0 },
  } = usePage().props as {
    activeUsersCount?: number;
    dummyData?: { totalSales: number; activeProducts: number; incomingOrders: number };
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />

      <div className="flex flex-col gap-6 p-6 bg-muted/20 rounded-xl">
        {/* Header with Notification Bell */}
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-2xl font-semibold leading-tight mb-1">
              Selamat Datang Uhuy 👋
            </h1>
            <p className="text-sm text-muted-foreground">
              Lorem ipsum dolor sit amet, consectetur adipisicing elit.
            </p>
          </div>

          {/* Notification Bell Dropdown */}
         <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button className="relative h-10 w-10 rounded-full p-2 hover:bg-gray-800 transition">
            <Bell className="h-5 w-5 dark:text-gray-200" />
            {recentActivities.some(a => a.isNew) && (
                <span
                className="absolute -top-1 -right-1 inline-flex h-3 w-3 animate-pulse rounded-full bg-red-500"
                title={`${recentActivities.filter(a => a.isNew).length} baru`}
                />
            )}
            </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
            align="end"
            className="w-80 max-w-full rounded-lg shadow-lg border bg-white dark:bg-gray-800 overflow-hidden"
        >
            <div className="px-4 py-2 border-b dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold text-gray-700 dark:text-gray-200 text-sm">Notifikasi</h3>
            {recentActivities.some(a => a.isNew) && (
                <span className="text-xs text-red-500 dark:text-red-400 font-medium">
                {recentActivities.filter(a => a.isNew).length} baru
                </span>
            )}
            </div>

            <div className="max-h-64 overflow-y-auto">
            {recentActivities.length === 0 && (
                <p className="text-center text-gray-400 py-4 text-sm">Tidak ada notifikasi</p>
            )}
            {recentActivities.map(activity => (
                <DropdownMenuItem
                key={activity.id}
                className="group flex items-start gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                <div
                    className={`flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full
                    ${activity.isNew
                        ? "bg-red-100 dark:bg-red-900 animate-pulse"
                        : "bg-green-100 dark:bg-green-900"}
                    `}
                >
                    <Clock
                    className={`h-4 w-4 ${
                        activity.isNew
                        ? "text-red-600 dark:text-red-400"
                        : "text-green-600 dark:text-green-400"
                    }`}
                    />
                </div>
                <div className="flex-1 text-sm text-gray-700 dark:text-gray-200">
                    <p className="flex items-center gap-2">
                    <span className="font-medium">{activity.user}</span>
                    {activity.action}
                    {activity.isNew && (
                        <span
                        className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold
                        ${activity.isImportant ? "bg-red-500 text-white" : "bg-green-500 text-white"}`}
                        >
                        Baru
                        </span>
                    )}
                    </p>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{activity.time}</span>
                </div>
                </DropdownMenuItem>
            ))}
            </div>

            <div className="px-4 py-2 border-t dark:border-gray-700">
            <Button variant="outline" size="sm" className="w-full">
                Lihat semua
            </Button>
            </div>
        </DropdownMenuContent>
        </DropdownMenu>

        </div>

        {/* Cards Section */}
       <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
  {/* === Total File Terupload === */}
            <Card className="shadow-md hover:shadow-lg transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total File Terupload
                </CardTitle>
                <TrendingUp className="w-4 h-4 text-green-500" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">
                    {dummyData.totalSales.toLocaleString("id-ID")}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    0 dari bulan lalu
                </p>
                </CardContent>
            </Card>

            {/* === Total File Pembelian === */}
            <Card className="shadow-md hover:shadow-lg transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total File Pembelian
                </CardTitle>
                <Package className="w-4 h-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">
                    {dummyData.activeProducts}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    0 file baru minggu ini
                </p>
                </CardContent>
            </Card>

            {/* === Total File Penjualan === */}
            <Card className="shadow-md hover:shadow-lg transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total File Penjualan
                </CardTitle>
                <ShoppingBag className="w-4 h-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">
                    {dummyData.incomingOrders}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    0 file baru hari ini
                </p>
                </CardContent>
            </Card>

            {/* === Pengguna Aktif === */}
            <Card className="shadow-md hover:shadow-lg transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pengguna Aktif
                </CardTitle>
                <Users className="w-4 h-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">
                    {activeUsersCount}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    Sedang online saat ini
                </p>
                </CardContent>
            </Card>
            </div>


        {/* === Pie Chart Section === */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Pie Chart Pembelian */}
          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-none">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-muted-foreground">
                Distribusi File Pembelian
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={purchaseData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {purchaseData.map((_, index) => (
                      <Cell key={index} fill={COLORS_PURCHASE[index % COLORS_PURCHASE.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Chart Penjualan */}
          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-none">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-muted-foreground">
                Distribusi File Penjualan
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {salesTypeData.map((_, index) => (
                      <Cell key={index} fill={COLORS_SALES[index % COLORS_SALES.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

      </div>
    </AppLayout>
  );
}
