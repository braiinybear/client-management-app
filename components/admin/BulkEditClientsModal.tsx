"use client";

import React from "react";
import { toast } from "sonner";
import { Status } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { Button } from "../ui/button";

export interface BulkEditFields {
  status: Status;
  courseFee: string;
  courseFeePaid: string;
  hostelFee: string;
  hostelFeePaid: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  selectedCount: number;
  onConfirm: (fields: BulkEditFields) => Promise<void>;
}

export default function BulkEditClientsModal({
  open,
  onClose,
  selectedCount,
  onConfirm,
}: Props) {
  const [fields, setFields] = React.useState<BulkEditFields>({
    status: "HOT",
    courseFee: "",
    courseFeePaid: "",
    hostelFee: "",
    hostelFeePaid: "",
  });
  const [loading, setLoading] = React.useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm(fields);
      toast.success(`Successfully updated ${selectedCount} clients`);
      onClose();
    } catch {
      toast.error("Failed to update clients");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Update {selectedCount} Clients</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">New Status</label>
            <Select
              value={fields.status}
              onValueChange={(value) => setFields(prev => ({ ...prev, status: value as Status }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HOT">Hot</SelectItem>
                <SelectItem value="PROSPECT">Prospect</SelectItem>
                <SelectItem value="FOLLOWUP">Follow Up</SelectItem>
                <SelectItem value="COLD">Cold</SelectItem>
                <SelectItem value="SUCCESS">Success</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Course Fee</label>
            <input
              type="number"
              value={fields.courseFee}
              onChange={(e) => setFields(prev => ({ ...prev, courseFee: e.target.value }))}
              className="w-full border rounded-md px-3 py-2"
              disabled={loading}
              min="0"
              placeholder="Enter course fee"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Course Fee Paid</label>
            <input
              type="number"
              value={fields.courseFeePaid}
              onChange={(e) => setFields(prev => ({ ...prev, courseFeePaid: e.target.value }))}
              className="w-full border rounded-md px-3 py-2"
              disabled={loading}
              min="0"
              placeholder="Enter course fee paid"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Hostel Fee</label>
            <input
              type="number"
              value={fields.hostelFee}
              onChange={(e) => setFields(prev => ({ ...prev, hostelFee: e.target.value }))}
              className="w-full border rounded-md px-3 py-2"
              disabled={loading}
              min="0"
              placeholder="Enter hostel fee"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Hostel Fee Paid</label>
            <input
              type="number"
              value={fields.hostelFeePaid}
              onChange={(e) => setFields(prev => ({ ...prev, hostelFeePaid: e.target.value }))}
              className="w-full border rounded-md px-3 py-2"
              disabled={loading}
              min="0"
              placeholder="Enter hostel fee paid"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={loading}>
              {loading ? "Updating..." : "Update"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}