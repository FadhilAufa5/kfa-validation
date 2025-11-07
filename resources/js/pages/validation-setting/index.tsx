import { useState } from "react";
import AppLayout from "@/layouts/app-layout";
import { Head, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import { Button } from "@/components/ui/button";
import { Settings, Upload, Database, Clock, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster, toast } from "sonner";
import ToleranceDialog from "@/components/ToleranceDialog";
import ImDataUploadDialog from "@/components/ImDataUploadDialog";
import type { BreadcrumbItem } from "@/types";

interface ImDataDetails {
  row_count: number;
  last_updated_at: string | null;
  last_updated_by: string | null;
  last_updated_human: string | null;
}

interface ImDataInfo {
  pembelian: ImDataDetails | null;
  penjualan: ImDataDetails | null;
}

interface ValidationSettingProps {
  currentTolerance: number;
  imDataInfo: ImDataInfo;
}

export default function ValidationSettingIndex({ 
  currentTolerance,
  imDataInfo 
}: ValidationSettingProps) {
  const [isToleranceDialogOpen, setIsToleranceDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Validation Setting", href: "/validation-setting" }
  ];

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const handleToleranceUpdate = (tolerance: number) => {
    router.post(
      route("validation-setting.tolerance"),
      { tolerance },
      {
        onSuccess: () => {
          toast.success("Rounding tolerance updated successfully!");
          setIsToleranceDialogOpen(false);
        },
        onError: (errors) => {
          toast.error(errors.tolerance || "Failed to update tolerance");
        },
      }
    );
  };

  const handleImDataUpload = (file: File, dataType: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("data_type", dataType);

    router.post(route("validation-setting.upload-im-data"), formData, {
      onSuccess: () => {
        toast.success("File uploaded successfully and is being processed in the background.");
        setIsUploadDialogOpen(false);
      },
      onError: (errors: any) => {
        toast.error(errors.file || "Failed to upload file");
      },
      forceFormData: true,
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Validation Setting" />
      <Toaster position="top-right" richColors />

      <div className="w-full px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-3">
              <Settings className="text-blue-600" />
              Validation Setting
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure validation parameters and update IM data
            </p>
          </div>
        </div>

        {/* IM Data Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pembelian IM Data Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                IM Pembelian Data
              </CardTitle>
              <CardDescription>im_purchases_and_return table information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {imDataInfo.pembelian ? (
                <>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">Total Rows</span>
                    <span className="text-lg font-bold">{formatNumber(imDataInfo.pembelian.row_count)}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Last Updated</p>
                        <p className="font-medium">{imDataInfo.pembelian.last_updated_human}</p>
                        <p className="text-xs text-muted-foreground">{imDataInfo.pembelian.last_updated_at}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Updated By</p>
                        <p className="font-medium">{imDataInfo.pembelian.last_updated_by}</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No data available</p>
              )}
            </CardContent>
          </Card>

          {/* Penjualan IM Data Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-green-600" />
                IM Penjualan Data
              </CardTitle>
              <CardDescription>im_jual table information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {imDataInfo.penjualan ? (
                <>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">Total Rows</span>
                    <span className="text-lg font-bold">{formatNumber(imDataInfo.penjualan.row_count)}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Last Updated</p>
                        <p className="font-medium">{imDataInfo.penjualan.last_updated_human}</p>
                        <p className="text-xs text-muted-foreground">{imDataInfo.penjualan.last_updated_at}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Updated By</p>
                        <p className="font-medium">{imDataInfo.penjualan.last_updated_by}</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Settings Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rounding Tolerance Card */}
          <Card>
            <CardHeader>
              <CardTitle>Rounding Tolerance</CardTitle>
              <CardDescription>
                Adjust the tolerance value for validation rounding calculations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Current Tolerance</p>
                <p className="text-2xl font-bold">{currentTolerance}</p>
              </div>
              <Button
                onClick={() => setIsToleranceDialogOpen(true)}
                className="w-full"
              >
                <Settings className="mr-2 h-4 w-4" />
                Adjust Tolerance
              </Button>
            </CardContent>
          </Card>

          {/* IM Data Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle>Update IM Data</CardTitle>
              <CardDescription>
                Upload validation data files (Pembelian or Penjualan)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">Supported Files:</p>
                <ul className="text-sm text-muted-foreground list-disc list-inside">
                  <li>Pembelian: im_purchases_and_return</li>
                  <li>Penjualan: im_jual</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  Max file size: 7GB
                </p>
              </div>
              <Button
                onClick={() => setIsUploadDialogOpen(true)}
                className="w-full"
                variant="default"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload IM Data
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Important Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <p className="text-sm font-medium">Rounding Tolerance:</p>
              <p className="text-sm text-muted-foreground">
                This value is used to determine acceptable differences in validation calculations. 
                Values within the tolerance range are considered valid matches.
              </p>
            </div>
            <div className="space-y-1 mt-4">
              <p className="text-sm font-medium">IM Data Upload:</p>
              <p className="text-sm text-muted-foreground">
                Large files (300MB - 7GB) are processed in the background using a queue system. 
                The system will automatically handle batch insertions to ensure efficient processing.
                You will be notified once the upload is complete.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <ToleranceDialog
        isOpen={isToleranceDialogOpen}
        onClose={() => setIsToleranceDialogOpen(false)}
        currentTolerance={currentTolerance}
        onConfirm={handleToleranceUpdate}
      />

      <ImDataUploadDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        onConfirm={handleImDataUpload}
      />
    </AppLayout>
  );
}
