"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
// import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { Status, CallResponse } from "@prisma/client";
import { toast } from "sonner";

type Props = {
  employeeId: string;
};

export default function AddClientForm({ employeeId }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    callResponse: "" as CallResponse | "",
    status: "PROSPECT" as Status,
    course: "",
    hostelFee: "",
    hostelFeePaid: "",
    courseFee: "",
    courseFeePaid: "",
    totalFee: "0.00",
    totalFeePaid: "0.00",
    notes: "",
  });

  const [totalRemaining, setTotalRemaining] = useState("0.00");

  // Auto-calc total fee
  useEffect(() => {
    const total = (parseFloat(form.hostelFee) || 0) + (parseFloat(form.courseFee) || 0);
    setForm((p) => ({ ...p, totalFee: total.toFixed(2) }));
  }, [form.hostelFee, form.courseFee]);

  // Auto-calc total paid and remaining
  useEffect(() => {
    const totalPaid = (parseFloat(form.hostelFeePaid) || 0) + (parseFloat(form.courseFeePaid) || 0);
    setForm((p) => ({ ...p, totalFeePaid: totalPaid.toFixed(2) }));
    const remaining = (parseFloat(form.totalFee) - totalPaid || 0).toFixed(2);
    setTotalRemaining(remaining);
  }, [form.hostelFeePaid, form.courseFeePaid, form.totalFee]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        callResponse: form.callResponse || null,
        status: form.status,
        course: form.course || null,
        hostelFee: form.hostelFee ? parseFloat(form.hostelFee) : null,
        hostelFeePaid: form.hostelFeePaid ? parseFloat(form.hostelFeePaid) : null,
        courseFee: form.courseFee ? parseFloat(form.courseFee) : null,
        courseFeePaid: form.courseFeePaid ? parseFloat(form.courseFeePaid) : null,
        totalFee: form.totalFee ? parseFloat(form.totalFee) : null,
        totalFeePaid: form.totalFeePaid ? parseFloat(form.totalFeePaid) : null,
        notes: form.notes || null,
      };

      const res = await fetch(`/api/admin/employees/${employeeId}/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Failed to create client");
      }

      // Reset form
      setForm({
        name: "",
        phone: "",
        callResponse: "" as CallResponse | "",
        status: "PROSPECT" as Status,
        course: "",
        hostelFee: "",
        hostelFeePaid: "",
        courseFee: "",
        courseFeePaid: "",
        totalFee: "0.00",
        totalFeePaid: "0.00",
        notes: "",
      });

      setTotalRemaining("0.00");
      setOpen(false);
      toast.success("Client created successfully!");
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 bg-white/5 mt-4">
      <div
        onClick={() => setOpen((prev) => !prev)}
        className="flex justify-between items-center cursor-pointer"
      >
        <h2 className="text-lg font-semibold text-gray-400 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          {open ? "Hide Add Client" : "Add Single Client"}
        </h2>
        {open ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          <div>
            <Label>Client Name</Label>
            <Input name="name" value={form.name} onChange={handleChange} required />
          </div>

          <div>
            <Label>Phone</Label>
            <Input name="phone" value={form.phone} onChange={handleChange} required />
          </div>

          <div>
            <Label>Call Response</Label>
            <Select
              value={form.callResponse}
              onValueChange={(v) => setForm((p) => ({ ...p, callResponse: v as CallResponse }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select call response" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HANGUP">Hanged Up</SelectItem>
                <SelectItem value="NOTINTERESTED">Not Interested</SelectItem>
                <SelectItem value="WRONG">Wrong Number</SelectItem>
                <SelectItem value="NOTRESPONDED">Not Responded</SelectItem>
                <SelectItem value="NOTREACHED">Not Reached</SelectItem>
                <SelectItem value="ONGOING">Ongoing</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm((p) => ({ ...p, status: v as Status }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HOT">Hot</SelectItem>
                <SelectItem value="PROSPECT">Prospect</SelectItem>
                <SelectItem value="FOLLOWUP">Follow-Up</SelectItem>
                <SelectItem value="COLD">Cold</SelectItem>
                <SelectItem value="SUCCESS">Success</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Course</Label>
            <Input name="course" value={form.course} onChange={handleChange} />
          </div>

          <div>
            <Label>Hostel Fee</Label>
            <Input name="hostelFee" type="number" value={form.hostelFee} onChange={handleChange} />
          </div>

          <div>
            <Label>Hostel Fee Paid</Label>
            <Input name="hostelFeePaid" type="number" value={form.hostelFeePaid} onChange={handleChange} />
          </div>

          <div>
            <Label>Course Fee</Label>
            <Input name="courseFee" type="number" value={form.courseFee} onChange={handleChange} />
          </div>

          <div>
            <Label>Course Fee Paid</Label>
            <Input name="courseFeePaid" type="number" value={form.courseFeePaid} onChange={handleChange} />
          </div>

          <div>
            <Label>Total Fee (auto)</Label>
            <p className="px-3 py-2 rounded w-full">{form.totalFee}</p>
          </div>

          <div>
            <Label>Total Remaining Fee (auto)</Label>
            <p className="px-3 py-2 rounded w-full">{totalRemaining}</p>
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <Label>Notes</Label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={4}
              className="w-full border rounded-md p-2"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating..." : "Create Client"}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
