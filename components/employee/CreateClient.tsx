"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Status } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  UploadCloud,
  Trash2,
  FileText,
  User,
  IndianRupee,
  Info,
  Save,
} from "lucide-react";

interface Document {
  id: string;
  name: string;
  url: string;
}

interface ClientCreateResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: Status;
  course?: string | null;
  hostelFee?: number | null;
  totalFee?: number | null;
  courseFee?: number | null;
  courseFeePaid?: number | null;
  hostelFeePaid?: number | null;
  totalFeePaid?: number | null;
  createdAt?: string;
  updatedAt?: string;
  documents?: Document[];
}

export default function NewClientPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    status: "HOT" as Status,
    course: "",
    hostelFee: "",
    courseFee: "",
    totalFee: "0.00",
    courseFeePaid: "",
    hostelFeePaid: "",
    totalFeePaid: "0.00",
  });

  const [creating, setCreating] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);

  // documents uploaded for newly created client
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Auto-calc totalFee (hostel + course)
  useEffect(() => {
    const h = parseFloat(formData.hostelFee) || 0;
    const c = parseFloat(formData.courseFee) || 0;
    const total = (h + c).toFixed(2);
    if (total !== formData.totalFee) setFormData((p) => ({ ...p, totalFee: total }));
  }, [formData.hostelFee, formData.courseFee]);

  // Auto-calc totalFeePaid
  useEffect(() => {
    const cp = parseFloat(formData.courseFeePaid) || 0;
    const hp = parseFloat(formData.hostelFeePaid) || 0;
    const totalPaid = (cp + hp).toFixed(2);
    if (totalPaid !== formData.totalFeePaid) setFormData((p) => ({ ...p, totalFeePaid: totalPaid }));
  }, [formData.courseFeePaid, formData.hostelFeePaid]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 4000);
      return () => clearTimeout(t);
    }
  }, [success]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // prevent manual edit of totals
    if (name === "totalFee" || name === "totalFeePaid") return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const createClient = async () => {
    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      // Payload convert numeric fields
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        status: formData.status,
        course: formData.course?.trim() || null,
        hostelFee: formData.hostelFee ? parseFloat(formData.hostelFee) : null,
        courseFee: formData.courseFee ? parseFloat(formData.courseFee) : null,
        totalFee: formData.totalFee ? parseFloat(formData.totalFee) : null,
        courseFeePaid: formData.courseFeePaid ? parseFloat(formData.courseFeePaid) : null,
        hostelFeePaid: formData.hostelFeePaid ? parseFloat(formData.hostelFeePaid) : null,
        totalFeePaid: formData.totalFeePaid ? parseFloat(formData.totalFeePaid) : null,
      };

      const res = await fetch("/api/employee/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.message || "Failed to create client");
      }

      const created: ClientCreateResponse = await res.json();
      setClientId(created.id);
      setSuccess("Client created. You can now upload documents (optional).");
      // if server returned documents, set them (likely empty)
      if (created.documents && Array.isArray(created.documents)) setDocuments(created.documents);
      // navigate to client details page or keep on same page — we'll keep on same page so user can upload docs
      // router.push(`/employee/clients/${created.id}`) // optional redirect
    } catch (err: any) {
      setError(err?.message || "Server error");
    } finally {
      setCreating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // simple client validation
    if (!formData.name.trim()) return setError("Name is required");
    if (!formData.email.trim()) return setError("Email is required");
    if (!formData.phone.trim()) return setError("Phone is required");

    await createClient();
  };

  // Document upload (Cloudinary -> save record)
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!clientId) {
      setError("Create client first before uploading documents.");
      return;
    }
    if (!e.target.files?.length) return;
    setUploadingDoc(true);
    setError(null);
    setSuccess(null);

    try {
      const file = e.target.files[0];
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        throw new Error("Cloudinary cloud name or upload preset is not set");
      }

      const formDataCloudinary = new FormData();
      formDataCloudinary.append("file", file);
      formDataCloudinary.append("upload_preset", uploadPreset);

      const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
        method: "POST",
        body: formDataCloudinary,
      });

      if (!cloudRes.ok) throw new Error("Failed to upload document");

      const cloudData = await cloudRes.json();

      const apiRes = await fetch(`/api/employee/clients/${clientId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          url: cloudData.secure_url,
        }),
      });

      if (!apiRes.ok) {
        const apiError = await apiRes.json().catch(() => null);
        throw new Error(apiError?.message || "Failed to save document");
      }

      const newDoc: Document = await apiRes.json();
      setDocuments((prev) => [...prev, newDoc]);
      setSuccess("Document uploaded successfully!");
    } catch (err: any) {
      setError(err.message || "Upload error");
    } finally {
      setUploadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const handleDeleteDoc = async (docId: string) => {
    if (!clientId) return;
    if (!confirm("Are you sure you want to delete this document?")) return;

    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/employee/clients/${clientId}/documents/${docId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.message || "Failed to delete document");
      }
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      setSuccess("Document deleted successfully!");
    } catch (err: any) {
      setError(err.message || "Delete failed");
    }
  };

  // Single combined save button: after client created you can edit fields and click Save All to update
  const handleSaveAll = async () => {
    if (!clientId) {
      setError("Create client first.");
      return;
    }
    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        status: formData.status,
        course: formData.course?.trim() || null,
        hostelFee: formData.hostelFee ? parseFloat(formData.hostelFee) : null,
        courseFee: formData.courseFee ? parseFloat(formData.courseFee) : null,
        totalFee: formData.totalFee ? parseFloat(formData.totalFee) : null,
        courseFeePaid: formData.courseFeePaid ? parseFloat(formData.courseFeePaid) : null,
        hostelFeePaid: formData.hostelFeePaid ? parseFloat(formData.hostelFeePaid) : null,
        totalFeePaid: formData.totalFeePaid ? parseFloat(formData.totalFeePaid) : null,
      };

      const res = await fetch(`/api/employee/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.message || "Failed to save client");
      }

      setSuccess("Client updated successfully!");
    } catch (err: any) {
      setError(err.message || "Save failed");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 font-sans">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h1 className="text-3xl font-extrabold flex items-center gap-2 text-gray-900">
          <User className="w-8 h-8 text-blue-600" /> Create Client
        </h1>
      </div>

      <Card className="shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle>Client Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={(e) => { e.preventDefault(); clientId ? handleSaveAll() : handleSubmit(e); }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input name="name" value={formData.name} onChange={handleChange} required />
            </div>

            <div>
              <Label>Email</Label>
              <Input name="email" type="email" value={formData.email} onChange={handleChange} required />
            </div>

            <div>
              <Label>Phone</Label>
              <Input name="phone" value={formData.phone} onChange={handleChange} required />
            </div>

            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData((p) => ({ ...p, status: v as Status }))}>
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

            <div className="md:col-span-2">
              <Label>Course</Label>
              <Input name="course" value={formData.course} onChange={handleChange} />
            </div>

            <div>
              <Label>Hostel Fee</Label>
              <Input name="hostelFee" type="number" step="0.01" value={formData.hostelFee} onChange={handleChange} />
            </div>

            <div>
              <Label>Course Fee</Label>
              <Input name="courseFee" type="number" step="0.01" value={formData.courseFee} onChange={handleChange} />
            </div>

            <div>
              <Label>Total Fee (auto)</Label>
              <p className="px-3 py-2 bg-gray-100 rounded">{formData.totalFee}</p>
            </div>

            <div>
              <Label>Course Fee Paid</Label>
              <Input name="courseFeePaid" type="number" step="0.01" value={formData.courseFeePaid} onChange={handleChange} />
            </div>

            <div>
              <Label>Hostel Fee Paid</Label>
              <Input name="hostelFeePaid" type="number" step="0.01" value={formData.hostelFeePaid} onChange={handleChange} />
            </div>

            <div>
              <Label>Total Fee Paid (auto)</Label>
              <p className="px-3 py-2 bg-gray-100 rounded">{formData.totalFeePaid}</p>
            </div>

            <div className="md:col-span-2 flex justify-end gap-3">
              <Button type="submit" disabled={creating}>
                <Save className="w-4 h-4 mr-2" /> {clientId ? (creating ? "Saving..." : "Save All") : (creating ? "Creating..." : "Create Client")}
              </Button>
              {clientId && (
                <Button type="button" variant="outline" onClick={() => router.push(`/employee/clients/${clientId}`)}>
                  Go to Client
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card className="shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-green-600" />
            <CardTitle>Documents</CardTitle>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploadingDoc || !clientId}
              id="upload-doc-input"
            />
            <label
              htmlFor="upload-doc-input"
              className={`cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white rounded-md shadow transition-colors duration-200 ${!clientId ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
              title={!clientId ? "Create client first" : "Upload document"}
            >
              <UploadCloud className="w-5 h-5" />
              {uploadingDoc ? "Uploading..." : "Upload Document"}
            </label>
          </div>
        </CardHeader>
        <CardContent className="max-h-60 overflow-y-auto">
          {documents.length === 0 ? (
            <p className="text-gray-500 italic">No documents uploaded.</p>
          ) : (
            <ul className="space-y-3">
              {documents.map((doc) => (
                <li key={doc.id} className="flex justify-between items-center break-words bg-gray-50 rounded-md p-2 shadow-sm hover:bg-gray-100 transition-colors duration-150">
                  <a href={doc.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate flex-1">
                    {doc.name}
                  </a>
                  <Button size="sm" variant="ghost" className="ml-3 text-red-600 hover:bg-red-100" onClick={() => handleDeleteDoc(doc.id)}>
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* messages */}
      {(error || success) && (
        <div className={`max-w-4xl mx-auto px-4 py-3 rounded-md text-center ${error ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`} role="alert">
          {error || success}
        </div>
      )}
    </div>
  );
}
