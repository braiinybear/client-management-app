"use client";

import React, { useState, useRef } from "react";
import { Status, CallResponse } from "@prisma/client";
import { toast } from "sonner";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../ui/select";
import { Label } from "../ui/label";
import { 
  User,
  FileText,
  IndianRupee,
  StickyNote,
  UploadCloud,
  Trash2,
  Download,
  UserCheck 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { DeleteDialog } from "../DeleteDialog";

interface Document {
  id: string;
  name: string | null;
  url: string;
}

interface AssignedEmployee {
  id: string;
  name: string | null;
  email: string;
}

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface Client {
  id: string;
  name: string | null;
  phone: string | null;
  status: Status;
  course: string | null;
  callResponse?: CallResponse | null;
  notes?: string | null;
  hostelFee: number | null;
  totalFee: number | null;
  courseFee: number | null;
  courseFeePaid: number | null;
  hostelFeePaid: number | null;
  totalFeePaid: number | null;
  user: User;
  assignedEmployee: AssignedEmployee | null;
  documents: Document[];
  createdAt: string;
  updatedAt: string;
}

interface Props {
  client: Client;
}

export default function AdminClientProfileClient({ client: initialClient }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [client, setClient] = useState(initialClient);
  const [detailsEditable, setDetailsEditable] = useState(false);
  const [feesEditable, setFeesEditable] = useState(false);
  const [notesEditable, setNotesEditable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<"json" | "csv" | "txt" | "">("");

  const [formData, setFormData] = useState({
    name: client.name || "",
    phone: client.phone || "",
    status: client.status,
    course: client.course || "",
    callResponse: client.callResponse || "NOTRESPONDED",
    notes: client.notes || "",
    hostelFee: client.hostelFee?.toString() || "",
    courseFee: client.courseFee?.toString() || "",
    courseFeePaid: client.courseFeePaid?.toString() || "",
    hostelFeePaid: client.hostelFeePaid?.toString() || "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveDetails = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/clients/${client.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          status: formData.status,
          callResponse: formData.callResponse,
          course: formData.course,
        }),
      });

      if (!res.ok) throw new Error("Failed to update client");

      setClient((prev) => ({
        ...prev,
        name: formData.name,
        phone: formData.phone,
        status: formData.status as Status,
        callResponse: formData.callResponse as CallResponse,
        course: formData.course,
      }));
      
      setDetailsEditable(false);
      toast.success("Client details updated successfully");
    } catch (error) {
      toast.error("Failed to update client details");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/clients/${client.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: formData.notes }),
      });

      if (!res.ok) throw new Error("Failed to update notes");

      setClient((prev) => ({
        ...prev,
        notes: formData.notes,
      }));
      
      setNotesEditable(false);
      toast.success("Notes updated successfully");
    } catch (error) {
      toast.error("Failed to update notes");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFees = async () => {
    setSaving(true);
    try {
      const payload = {
        hostelFee: formData.hostelFee ? Number(formData.hostelFee) : null,
        courseFee: formData.courseFee ? Number(formData.courseFee) : null,
        courseFeePaid: formData.courseFeePaid ? Number(formData.courseFeePaid) : null,
        hostelFeePaid: formData.hostelFeePaid ? Number(formData.hostelFeePaid) : null,
      };

      const res = await fetch(`/api/admin/clients/${client.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update fees");

      setClient((prev) => ({
        ...prev,
        ...payload,
      }));
      
      setFeesEditable(false);
      toast.success("Fees updated successfully");
    } catch (error) {
      toast.error("Failed to update fees");
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploadingDoc(true);

    try {
      const file = e.target.files[0];
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        throw new Error("Cloudinary configuration is missing");
      }

      const formDataCloudinary = new FormData();
      formDataCloudinary.append("file", file);
      formDataCloudinary.append("upload_preset", uploadPreset);

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
        { method: "POST", body: formDataCloudinary }
      );

      if (!cloudRes.ok) throw new Error("Failed to upload to Cloudinary");

      const cloudData: { secure_url: string } = await cloudRes.json();

      const apiRes = await fetch(`/api/admin/clients/${client.id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, url: cloudData.secure_url }),
      });

      if (!apiRes.ok) throw new Error("Failed to save document");

      const newDoc: Document = await apiRes.json();
      setClient((prev) => ({
        ...prev,
        documents: [...prev.documents, newDoc],
      }));

      toast.success("Document uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload document");
    } finally {
      setUploadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    try {
      const res = await fetch(`/api/admin/clients/${client.id}/documents/${docId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete document");

      setClient((prev) => ({
        ...prev,
        documents: prev.documents.filter((doc) => doc.id !== docId),
      }));

      toast.success("Document deleted successfully");
    } catch (error) {
      toast.error("Failed to delete document");
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/admin/clients/${client.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete client");

      toast.success("Client deleted successfully");
      router.push("/admin/clients");
    } catch (error) {
      toast.error("Failed to delete client");
    }
  };

  const downloadClientData = (format: "json" | "csv" | "txt") => {
    const data = {
      ...client,
      documents: client.documents.map((doc) => ({ name: doc.name, url: doc.url })),
      assignedEmployee: client.assignedEmployee?.name ?? null,
    };

    let fileContent = "";
    let mimeType = "";
    let fileExtension = "";

    switch (format) {
      case "json":
        fileContent = JSON.stringify(data, null, 2);
        mimeType = "application/json";
        fileExtension = "json";
        break;

      case "csv":
        const csvRows = [
          ["Field", "Value"],
          ...Object.entries(data).map(([key, value]) => {
            const val = typeof value === "object" ? JSON.stringify(value) : value ?? "";
            return [key, val];
          }),
        ];
        fileContent = csvRows.map((row) => row.join(",")).join("\n");
        mimeType = "text/csv";
        fileExtension = "csv";
        break;

      case "txt":
        fileContent = Object.entries(data)
          .map(([key, value]) => `${key}: ${typeof value === "object" ? JSON.stringify(value) : value}`)
          .join("\n");
        mimeType = "text/plain";
        fileExtension = "txt";
        break;
    }

    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `client_${client.id}.${fileExtension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalFee = Number(formData.hostelFee || 0) + Number(formData.courseFee || 0);
  const totalPaid = Number(formData.hostelFeePaid || 0) + Number(formData.courseFeePaid || 0);
  const remainingFee = totalFee - totalPaid;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header with Download Options */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <User className="w-8 h-8" /> Client Profile
        </h1>

        <div className="flex items-center gap-2">
          <Select
            value={downloadFormat}
            onValueChange={(value) => setDownloadFormat(value as "json" | "csv" | "txt")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Download Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="json">Download JSON</SelectItem>
              <SelectItem value="csv">Download CSV</SelectItem>
              <SelectItem value="txt">Download TXT</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={() => {
              if (downloadFormat) downloadClientData(downloadFormat);
            }}
            disabled={!downloadFormat}
            variant="outline"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>

          <DeleteDialog onConfirm={handleDelete} />
        </div>
      </div>

      {/* Basic Details Card */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <User className="w-5 h-5" /> Basic Details
          </h2>
          <Button
            onClick={() => {
              if (detailsEditable) {
                handleSaveDetails();
              } else {
                setDetailsEditable(true);
              }
            }}
            disabled={saving}
          >
            {detailsEditable ? (saving ? "Saving..." : "Save") : "Edit"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Name</Label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={!detailsEditable || saving}
            />
          </div>

          <div>
            <Label>Phone</Label>
            <Input
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              disabled={!detailsEditable || saving}
            />
          </div>

          <div>
            <Label>Call Response</Label>
            <Select
              value={formData.callResponse}
              onValueChange={(value) => setFormData(prev => ({ ...prev, callResponse: value as CallResponse }))}
              disabled={!detailsEditable || saving}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select response" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HANGUP">Hang Up</SelectItem>
                <SelectItem value="NOTINTERESTED">Not Interested</SelectItem>
                <SelectItem value="WRONG">Wrong</SelectItem>
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
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as Status }))}
              disabled={!detailsEditable || saving}
            >
              <SelectTrigger className="w-full">
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

          <div className="col-span-2">
            <Label>Course</Label>
            <Input
              name="course"
              value={formData.course}
              onChange={handleInputChange}
              disabled={!detailsEditable || saving}
            />
          </div>
        </div>
      </Card>

      {/* Notes Card */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <StickyNote className="w-5 h-5" /> Notes
          </h2>
          <Button
            onClick={() => {
              if (notesEditable) {
                handleSaveNotes();
              } else {
                setNotesEditable(true);
              }
            }}
            disabled={saving}
          >
            {notesEditable ? (saving ? "Saving..." : "Save") : "Edit"}
          </Button>
        </div>

        {notesEditable ? (
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            className="w-full min-h-[100px] p-2 border rounded-md"
            disabled={saving}
          />
        ) : (
          <p className="whitespace-pre-wrap">{formData.notes || "No notes available."}</p>
        )}
      </Card>

      {/* Documents Card */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" /> Documents
          </h2>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploadingDoc}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingDoc}
            >
              <UploadCloud className="w-4 h-4 mr-2" />
              {uploadingDoc ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>

        {client.documents.length > 0 ? (
          <div className="space-y-2">
            {client.documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
              >
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {doc.name}
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteDoc(doc.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No documents uploaded</p>
        )}
      </Card>

      {/* Fees Card */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <IndianRupee className="w-5 h-5" /> Fees
          </h2>
          <Button
            onClick={() => {
              if (feesEditable) {
                handleSaveFees();
              } else {
                setFeesEditable(true);
              }
            }}
            disabled={saving}
          >
            {feesEditable ? (saving ? "Saving..." : "Save") : "Edit"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Course Fee</Label>
            <Input
              name="courseFee"
              type="number"
              value={formData.courseFee}
              onChange={handleInputChange}
              disabled={!feesEditable || saving}
            />
          </div>

          <div>
            <Label>Course Fee Paid</Label>
            <Input
              name="courseFeePaid"
              type="number"
              value={formData.courseFeePaid}
              onChange={handleInputChange}
              disabled={!feesEditable || saving}
            />
          </div>

          <div>
            <Label>Hostel Fee</Label>
            <Input
              name="hostelFee"
              type="number"
              value={formData.hostelFee}
              onChange={handleInputChange}
              disabled={!feesEditable || saving}
            />
          </div>

          <div>
            <Label>Hostel Fee Paid</Label>
            <Input
              name="hostelFeePaid"
              type="number"
              value={formData.hostelFeePaid}
              onChange={handleInputChange}
              disabled={!feesEditable || saving}
            />
          </div>

          <div>
            <Label>Total Fee</Label>
            <Input value={`₹${totalFee}`} disabled />
          </div>

          <div>
            <Label>Total Paid</Label>
            <Input value={`₹${totalPaid}`} disabled />
          </div>

          <div>
            <Label>Remaining Fee</Label>
            <Input value={`₹${remainingFee}`} disabled />
          </div>
        </div>
      </Card>

      {/* Assigned Employee Card */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <UserCheck className="w-5 h-5" /> Assigned Employee
        </h2>
        {client.assignedEmployee ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Name:</span> 
              <span>{client.assignedEmployee.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Email:</span>
              <span>{client.assignedEmployee.email}</span>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No employee assigned</p>
        )}
      </Card>

      {/* Metadata */}
      <div className="text-sm text-gray-500 text-center">
        Created: {formatDate(client.createdAt)} | Last Updated:{" "}
        {formatDate(client.updatedAt)}
      </div>
    </div>
  );
}