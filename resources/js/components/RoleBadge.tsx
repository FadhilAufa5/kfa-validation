import { cn } from "@/lib/utils";

export default function RoleBadge({ role }: { role: string }) {
  const roleClasses = cn("px-2 py-1 text-xs font-semibold rounded-full capitalize", {
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200": role === "super-admin",
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200": role === "admin",
    "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200": role === "user",
  });
  return <span className={roleClasses}>{role.replace("-", " ")}</span>;
}
