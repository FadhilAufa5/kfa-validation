import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

interface ToleranceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentTolerance: number;
  onConfirm: (tolerance: number) => void;
}

export default function ToleranceDialog({
  isOpen,
  onClose,
  currentTolerance,
  onConfirm,
}: ToleranceDialogProps) {
  const [tolerance, setTolerance] = useState(currentTolerance.toString());
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const value = parseFloat(tolerance);

    if (isNaN(value) || value < 0) {
      setError("Please enter a valid positive number");
      return;
    }

    setError("");
    onConfirm(value);
  };

  const handleClose = () => {
    setTolerance(currentTolerance.toString());
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adjust Rounding Tolerance</DialogTitle>
          <DialogDescription>
            Set the tolerance value for validation calculations. Values within this
            range are considered valid matches.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="tolerance">Tolerance Value</Label>
            <Input
              id="tolerance"
              type="number"
              step="0.01"
              min="0"
              value={tolerance}
              onChange={(e) => setTolerance(e.target.value)}
              placeholder="Enter tolerance value"
              className={error ? "border-red-500" : ""}
            />
            {error && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            )}
          </div>

          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Current value:</strong> {currentTolerance}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              This setting affects all validation calculations across the system.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Update Tolerance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
