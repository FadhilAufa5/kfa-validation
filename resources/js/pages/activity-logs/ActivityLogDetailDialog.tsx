import { format, formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { User, Monitor, Globe, Clock, FileJson, Calendar } from "lucide-react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface ActivityLogType {
  id: number;
  user_id: number | null;
  user_name: string | null;
  user_role: string | null;
  action: string;
  category: string | null;
  entity_type: string | null;
  entity_id: string | null;
  description: string | null;
  metadata: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user?: User | null;
}

interface ActivityLogDetailDialogProps {
  log: ActivityLogType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ActivityLogDetailDialog({
  log,
  open,
  onOpenChange,
}: ActivityLogDetailDialogProps) {
  if (!log) return null;

  const getActionBadgeColor = (action: string) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes("create") || lowerAction.includes("tambah")) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (lowerAction.includes("update") || lowerAction.includes("edit")) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    if (lowerAction.includes("delete") || lowerAction.includes("hapus")) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
  };

  const formatAbsoluteTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy, HH:mm:ss", { locale: idLocale });
    } catch {
      return dateString;
    }
  };

  const formatRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: idLocale });
    } catch {
      return "";
    }
  };

  const formatJSON = (data: any) => {
    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      return null;
    }
    return JSON.stringify(data, null, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileJson className="w-5 h-5 text-blue-600" />
            Detail Log Aktivitas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Metadata Pengguna
              </h3>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-sm text-muted-foreground">User ID:</span>
                  <span className="text-sm font-medium col-span-2">{log.user_id || "System"}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-sm text-muted-foreground">Username:</span>
                  <span className="text-sm font-medium col-span-2">{log.user_name || "System"}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-sm text-muted-foreground">Role:</span>
                  <span className="text-sm font-medium col-span-2">
                    {log.user_role ? (
                      <Badge variant="outline">{log.user_role}</Badge>
                    ) : (
                      "-"
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    IP Address:
                  </span>
                  <span className="text-sm font-mono col-span-2">{log.ip_address || "-"}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Monitor className="w-3 h-3" />
                    User Agent:
                  </span>
                  <span className="text-sm font-mono col-span-2 break-all">{log.user_agent || "-"}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Waktu
              </h3>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Waktu Absolut:
                  </span>
                  <span className="text-sm font-medium col-span-2">{formatAbsoluteTime(log.created_at)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Waktu Relatif:
                  </span>
                  <span className="text-sm font-medium col-span-2">{formatRelativeTime(log.created_at)}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3">Detail Aktivitas</h3>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-sm text-muted-foreground">Aksi:</span>
                  <span className="text-sm font-medium col-span-2">
                    <Badge className={getActionBadgeColor(log.action)}>{log.action}</Badge>
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-sm text-muted-foreground">Kategori:</span>
                  <span className="text-sm font-medium col-span-2">{log.category || "-"}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-sm text-muted-foreground">Entity Type:</span>
                  <span className="text-sm font-medium col-span-2">{log.entity_type || "-"}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-sm text-muted-foreground">Entity ID:</span>
                  <span className="text-sm font-medium col-span-2">{log.entity_id || "-"}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-sm text-muted-foreground">Deskripsi:</span>
                  <span className="text-sm col-span-2">{log.description || "-"}</span>
                </div>
              </div>
            </div>

            {formatJSON(log.metadata) && (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <FileJson className="w-4 h-4" />
                  Properties (Data yang Diubah)
                </h3>
                <div className="bg-muted/50 rounded-lg p-4">
                  <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap break-words">
                    {formatJSON(log.metadata)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
