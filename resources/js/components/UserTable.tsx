import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye,Trash2,Edit } from "lucide-react";
import RoleBadge from "./RoleBadge";
import { cn } from "@/lib/utils";

export default function UserTable({ users, onEdit, onDelete }: any) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-200/60 dark:bg-gray-900/60">
          {["Name", "Status", "Email", "Role", "Created At", "Action"].map((head) => (
            <TableHead key={head}>{head}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length > 0 ? (
          users.map((user: any) => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span
                    className={cn("h-2 w-2 rounded-full", {
                      "bg-green-500 animate-pulse": user.is_online,
                      "bg-gray-400": !user.is_online,
                    })}
                  ></span>
                  <span className="text-sm">
                    {user.is_online ? "Online" : "Offline"}
                  </span>
                </div>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell><RoleBadge role={user.role} /></TableCell>
              <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" onClick={() => onEdit(user)}>
                  <Edit className="w-4 h-4 mr-1" /> 
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(user)}>
                  <Trash2 className="w-4 h-4 mr-1" /> 
                </Button>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-6 text-gray-500">
              Tidak ada user ditemukan.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
