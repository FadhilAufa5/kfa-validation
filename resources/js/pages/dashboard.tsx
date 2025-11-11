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

const COLORS_PURCHASE = ["#F97316", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899"];
const COLORS_SALES = ["#6366F1", "#F59E0B", "#84CC16", "#EC4899", "#06B6D4"];

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

interface Activity {
  id: number;
  user: string;
  action: string;
  time: string;
  isNew: boolean;
}

interface Statistics {
  totalFiles: number;
  totalPembelian: number;
  totalPenjualan: number;
  filesChangeFromLastMonth: number;
  lastWeekPembelian: number;
  todayPenjualan: number;
}

interface ChartData {
  name: string;
  value: number;
}

interface DashboardProps {
  activeUsersCount: number;
  statistics: Statistics;
  pembelianDistribution: ChartData[];
  penjualanDistribution: ChartData[];
  recentActivities: Activity[];
}

export default function Dashboard() {
  const page = usePage();
  const {
    activeUsersCount = 0,
    statistics = {
      totalFiles: 0,
      totalPembelian: 0,
      totalPenjualan: 0,
      filesChangeFromLastMonth: 0,
      lastWeekPembelian: 0,
      todayPenjualan: 0,
    },
    pembelianDistribution = [],
    penjualanDistribution = [],
    recentActivities = [],
  } = page.props as DashboardProps;

  const auth = page.props.auth as any;
  const userName = auth?.user?.name || 'User';

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />

      <div className="flex flex-col gap-6 p-6 bg-muted/20 rounded-xl">
        {/* Header with Notification Bell */}
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-2xl font-semibold leading-tight mb-1">
              Selamat Datang, {userName}! 👋
            </h1>
            <p className="text-sm text-muted-foreground">
              Berikut adalah ringkasan aktivitas validasi Anda
            </p>
          </div>

          {/* Notification Bell Dropdown - improved dark mode support & design */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Notifikasi"
                className="relative h-11 w-11 rounded-xl p-2 
                           bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100
                           ring-1 ring-gray-100 dark:ring-gray-700
                           hover:shadow-md hover:scale-[1.02] transition-all"
              >
                <Bell className="h-5 w-5" />
                {recentActivities.some(a => a.isNew) && (
                  <span
                    className="absolute -top-1 -right-1 inline-flex items-center justify-center
                               min-w-[18px] h-4 px-1 rounded-full text-xs font-semibold
                               bg-red-600 text-white ring-2 ring-white dark:ring-gray-900
                               shadow-sm"
                    title={`${recentActivities.filter(a => a.isNew).length} baru`}
                  >
                    {recentActivities.filter(a => a.isNew).length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-80 max-w-full rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700
                         bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Notifikasi</h3>
                {recentActivities.some(a => a.isNew) ? (
                  <Badge variant="secondary" className="text-xs">
                    {recentActivities.filter(a => a.isNew).length} baru
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">Terbaru</span>
                )}
              </div>

              {/* Body */}
              <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 bg-transparent">
                {recentActivities.length === 0 && (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">
                    Tidak ada notifikasi
                  </p>
                )}
                {recentActivities.map(activity => (
                  <DropdownMenuItem
                    key={activity.id}
                    className="group flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-none"
                  >
                    <div
                      className={`flex-shrink-0 h-9 w-9 flex items-center justify-center rounded-lg
                        ${activity.isNew
                          ? "bg-red-50 dark:bg-red-900/40"
                          : "bg-slate-50 dark:bg-slate-800/50"}
                      `}
                    >
                      <Clock
                        className={`h-4 w-4
                          ${activity.isNew ? "text-red-600 dark:text-red-300" : "text-slate-600 dark:text-slate-300"}`}
                      />
                    </div>

                    <div className="flex-1 text-sm">
                      <p className="text-gray-900 dark:text-gray-100">
                        <span className="font-medium">{activity.user}</span>{" "}
                        <span className="text-gray-700 dark:text-gray-300">{activity.action}</span>
                      </p>
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                    </div>

                    {activity.isNew && (
                      <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold
                                       bg-red-600 text-white">
                        Baru
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-transparent">
                <Button
                  variant="ghost"
                  className="w-full text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Lihat semua notifikasi
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
                    {statistics.totalFiles.toLocaleString("id-ID")}
                </div>
                <p className={`text-xs mt-1 flex items-center gap-1 ${statistics.filesChangeFromLastMonth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {statistics.filesChangeFromLastMonth >= 0 ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {Math.abs(statistics.filesChangeFromLastMonth)} dari bulan lalu
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
                    {statistics.totalPembelian.toLocaleString("id-ID")}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    {statistics.lastWeekPembelian} file baru minggu ini
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
                    {statistics.totalPenjualan.toLocaleString("id-ID")}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    {statistics.todayPenjualan} file baru hari ini
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
              {pembelianDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pembelianDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pembelianDistribution.map((_, index) => (
                        <Cell key={index} fill={COLORS_PURCHASE[index % COLORS_PURCHASE.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>Tidak ada data pembelian</p>
                </div>
              )}
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
              {penjualanDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={penjualanDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {penjualanDistribution.map((_, index) => (
                        <Cell key={index} fill={COLORS_SALES[index % COLORS_SALES.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>Tidak ada data penjualan</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </AppLayout>
  );
}
