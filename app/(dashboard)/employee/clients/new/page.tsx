"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CallResponse, Status } from "@prisma/client";
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
import { UploadCloud, Trash2, FileText, User } from "lucide-react";

type DocState = {
  id: string;
  name: string;
  url: string;
  saved: boolean;
};

export default function NewClientPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    status: "HOT" as Status,
    course: "",
    notes: "",
    hostelFee: "",
    courseFee: "",
    totalFee: "0.00",
    courseFeePaid: "",
    hostelFeePaid: "",
    totalFeePaid: "0.00",
    callResponse: "" as "" | "HANGUP" | "NOTINTERESTED" | "WRONG" | "NOTRESPONDED",
  });

  const [creating, setCreating] = useState(false);
  const [documents, setDocuments] = useState<DocState[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Auto-calc totals
  useEffect(() => {
    const total = ((parseFloat(formData.hostelFee) || 0) + (parseFloat(formData.courseFee) || 0)).toFixed(2);
    if (total !== formData.totalFee) setFormData((p) => ({ ...p, totalFee: total }));
  }, [formData.hostelFee, formData.courseFee]);

  useEffect(() => {
    const totalPaid = ((parseFloat(formData.hostelFeePaid) || 0) + (parseFloat(formData.courseFeePaid) || 0)).toFixed(2);
    if (totalPaid !== formData.totalFeePaid) setFormData((p) => ({ ...p, totalFeePaid: totalPaid }));
  }, [formData.hostelFeePaid, formData.courseFeePaid]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 3500);
      return () => clearTimeout(t);
    }
  }, [success]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "totalFee" || name === "totalFeePaid") return;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploadingDoc(true);
    setError(null);
    setSuccess(null);

    try {
      const file = e.target.files[0];
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) throw new Error("Cloudinary config missing");

      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", uploadPreset);

      const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
        method: "POST",
        body: fd,
      });

      if (!cloudRes.ok) throw new Error("Cloudinary upload failed");

      const cloudData = await cloudRes.json();
      const url = cloudData.secure_url as string;

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setDocuments((prev) => [...prev, { id: tempId, name: file.name, url, saved: false }]);
      setSuccess("Document uploaded (pending) — will be attached when client is created.");
    } catch (err: any) {
      setError(err?.message || "Upload failed");
    } finally {
      setUploadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteDoc = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    setSuccess("Document removed.");
  };

  const handleUploadButtonClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const createClient = async () => {
    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      if (!formData.phone.trim()) throw new Error("Phone is required");

      const pendingDocs = documents.filter((d) => !d.saved).map((d) => ({ name: d.name, url: d.url }));

      const payload: any = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        status: formData.status,
        course: formData.course?.trim() || null,
        CallResponse: formData.callResponse || null,
        notes: formData.notes || null,
        hostelFee: formData.hostelFee ? parseFloat(formData.hostelFee) : null,
        courseFee: formData.courseFee ? parseFloat(formData.courseFee) : null,
        totalFee: formData.totalFee ? parseFloat(formData.totalFee) : null,
        courseFeePaid: formData.courseFeePaid ? parseFloat(formData.courseFeePaid) : null,
        hostelFeePaid: formData.hostelFeePaid ? parseFloat(formData.hostelFeePaid) : null,
        totalFeePaid: formData.totalFeePaid ? parseFloat(formData.totalFeePaid) : null,
      };

      if (pendingDocs.length > 0) payload.documents = pendingDocs;

      const res = await fetch("/api/employee/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.message || "Failed to create client");
      }

      const created = await res.json();
      setSuccess("Client created successfully!");
      router.push(`/employee/clients/${created.id}`);
    } catch (err: any) {
      setError(err?.message || "Create failed");
    } finally {
      setCreating(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createClient();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2 text-gray-900">
          <User className="w-8 h-8 text-blue-600" /> Create Client
        </h1>
      </div>

      {/* Client form */}
      <Card className="shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle>Client Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label>Name</Label>
              <Input name="name" value={formData.name} onChange={handleChange} className="w-full" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input name="phone" value={formData.phone} onChange={handleChange} required className="w-full" />
            </div>
            <div>
              <label className="block font-medium mb-1" htmlFor="callResponse">
                Call Response
              </label>
              <Select
                name="callResponse"
                value={formData.callResponse}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, callResponse: value as CallResponse }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HANGUP">Hang Up</SelectItem>
                  <SelectItem value="NOTINTERESTED">Not Interested</SelectItem>
                  <SelectItem value="WRONG">Wrong</SelectItem>
                  <SelectItem value="NOTRESPONDED">Not Responded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData((p) => ({ ...p, status: v as Status }))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="HOT">Hot</SelectItem>
                  <SelectItem value="PROSPECT">Prospect</SelectItem>
                  <SelectItem value="FOLLOWUP">Follow Up</SelectItem>
                  <SelectItem value="COLD">Cold</SelectItem>
                  <SelectItem value="SUCCESS">Success</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <Label>Course</Label>
              <Input name="course" value={formData.course} onChange={handleChange} className="w-full" />
            </div>
            <div>
              <Label>Hostel Fee</Label>
              <Input name="hostelFee" type="number" step="0.01" value={formData.hostelFee} onChange={handleChange} className="w-full" />
            </div>
            <div>
              <Label>Course Fee</Label>
              <Input name="courseFee" type="number" step="0.01" value={formData.courseFee} onChange={handleChange} className="w-full" />
            </div>
            <div>
              <Label>Total Fee (auto)</Label>
              <p className="px-3 py-2 bg-gray-100 rounded w-full">{formData.totalFee}</p>
            </div>
            <div>
              <Label>Course Fee Paid</Label>
              <Input name="courseFeePaid" type="number" step="0.01" value={formData.courseFeePaid} onChange={handleChange} className="w-full" />
            </div>
            <div>
              <Label>Hostel Fee Paid</Label>
              <Input name="hostelFeePaid" type="number" step="0.01" value={formData.hostelFeePaid} onChange={handleChange} className="w-full" />
            </div>
            <div>
              <Label>Total Fee Paid (auto)</Label>
              <p className="px-3 py-2 bg-gray-100 rounded w-full">{formData.totalFeePaid}</p>
            </div>
            {/* notes */}
            <div className="col-span-1 md:col-span-2 lg:col-span-3">
              <Label>Notes</Label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    notes: e.target.value
                  }))
                }
                rows={5}
                className="w-full border rounded-md p-3"
                placeholder="Enter notes here..."
              />
            </div>
            <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-end">
              <Button type="submit" disabled={creating} className="w-full sm:w-auto">
                {creating ? "Creating..." : "Create Client"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card className="shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-green-600" />
            <CardTitle>Documents</CardTitle>
          </div>
          <div>
            <input ref={fileInputRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={handleFileChange} disabled={uploadingDoc} />
            <button type="button" onClick={handleUploadButtonClick} className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white rounded-md shadow transition-colors duration-200 w-full sm:w-auto ${uploadingDoc ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"}`}>
              <UploadCloud className="w-5 h-5" />
              {uploadingDoc ? "Uploading..." : "Upload Document"}
            </button>
          </div>
        </CardHeader>
        <CardContent className="max-h-60 overflow-y-auto">
          {documents.length === 0 ? (
            <p className="text-gray-500 italic">No documents uploaded.</p>
          ) : (
            <ul className="space-y-3">
              {documents.map((doc) => (
                <li key={doc.id} className="flex flex-col sm:flex-row justify-between items-center break-words bg-gray-50 rounded-md p-2 shadow-sm hover:bg-gray-100 transition-colors duration-150">
                  <a href={doc.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate w-full sm:w-auto flex-1">
                    {doc.name} {!doc.saved && <span className="text-xs ml-2 text-gray-500">(pending)</span>}
                  </a>
                  <Button size="sm" variant="ghost" className="ml-0 sm:ml-3 text-red-600 hover:bg-red-100 w-full sm:w-auto mt-2 sm:mt-0" onClick={() => handleDeleteDoc(doc.id)} disabled={deletingDocId === doc.id}>
                    {deletingDocId === doc.id ? <span className="text-xs">Deleting…</span> : <Trash2 className="w-5 h-5" />}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Messages */}
      {(error || success) && (
        <div className={`max-w-4xl mx-auto px-4 py-3 rounded-md text-center ${error ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`} role="alert">
          {error || success}
        </div>
      )}
    </div>
  );
}
