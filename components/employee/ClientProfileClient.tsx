"use client";
import React, { useState, useRef, useEffect } from "react";
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
import Link from "next/link";
import {
  Edit2,
  Save,
  XCircle,
  UploadCloud,
  Trash2,
  User,
  FileText,
  IndianRupee,
  Info,
} from "lucide-react";

// Document type
interface Document {
  id: string;
  name: string;
  url: string;
}

// Employee type
interface AssignedEmployee {
  id: string;
  name: string;
}

// Client type
interface Client {
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
  assignedEmployee?: AssignedEmployee | null;
  documents: Document[];
  createdAt: string;
  updatedAt: string;
}

// Props
interface ClientProfileClientProps {
  client: Client;
  employeeId: string;
}

// Form Data type
interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  status: Status;
  course: string;
  hostelFee: string;
  courseFee: string;
  totalFee: string;
  courseFeePaid: string;
  hostelFeePaid: string;
  totalFeePaid: string;
}

export default function ClientProfileClient({
  client,
  employeeId,
}: ClientProfileClientProps) {
  const [detailsEditable, setDetailsEditable] = useState(false);
  const [feesEditable, setFeesEditable] = useState(false);

  const [formData, setFormData] = useState<ClientFormData>({
    name: client.name,
    email: client.email,
    phone: client.phone,
    status: client.status,
    course: client.course ?? "",
    hostelFee: client.hostelFee?.toString() ?? "",
    courseFee: client.courseFee?.toString() ?? "",
    totalFee: client.totalFee?.toString() ?? "0.00",
    courseFeePaid: client.courseFeePaid?.toString() ?? "",
    hostelFeePaid: client.hostelFeePaid?.toString() ?? "",
    totalFeePaid: client.totalFeePaid?.toString() ?? "0.00",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>(client.documents);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Auto-calc totalFee
  useEffect(() => {
    const h = parseFloat(formData.hostelFee) || 0;
    const c = parseFloat(formData.courseFee) || 0;
    const total = (h + c).toFixed(2);
    if (total !== formData.totalFee) {
      setFormData((prev) => ({ ...prev, totalFee: total }));
    }
  }, [formData.hostelFee, formData.courseFee]);

  // Auto-calc totalFeePaid
  useEffect(() => {
    const cp = parseFloat(formData.courseFeePaid) || 0;
    const hp = parseFloat(formData.hostelFeePaid) || 0;
    const totalPaid = (cp + hp).toFixed(2);
    if (totalPaid !== formData.totalFeePaid) {
      setFormData((prev) => ({ ...prev, totalFeePaid: totalPaid }));
    }
  }, [formData.courseFeePaid, formData.hostelFeePaid]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "totalFee" || name === "totalFeePaid") return;
    setFormData(prev => ({ ...prev, [name]: value } as Pick<ClientFormData, keyof ClientFormData>));
  };

  const handleCancelEdit = (section: "details" | "fees") => {
    setError(null);
    setSuccess(null);
    if (section === "details") {
      setFormData((prev) => ({
        ...prev,
        name: client.name,
        email: client.email,
        phone: client.phone,
        status: client.status,
        course: client.course ?? "",
      }));
      setDetailsEditable(false);
    } else {
      setFormData((prev) => ({
        ...prev,
        hostelFee: client.hostelFee?.toString() ?? "",
        courseFee: client.courseFee?.toString() ?? "",
        hostelFeePaid: client.hostelFeePaid?.toString() ?? "",
        courseFeePaid: client.courseFeePaid?.toString() ?? "",
        totalFee: client.totalFee?.toString() ?? "0.00",
        totalFeePaid: client.totalFeePaid?.toString() ?? "0.00",
      }));
      setFeesEditable(false);
    }
  };

  const handleSaveSection = async (section: "details" | "fees") => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const payload =
        section === "details"
          ? {
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              status: formData.status,
              course: formData.course,
            }
          : {
              hostelFee: Number(formData.hostelFee) || 0,
              courseFee: Number(formData.courseFee) || 0,
              hostelFeePaid: Number(formData.hostelFeePaid) || 0,
              courseFeePaid: Number(formData.courseFeePaid) || 0,
              totalFee: Number(formData.totalFee) || 0,
              totalFeePaid: Number(formData.totalFeePaid) || 0,
            };

      const res = await fetch(`/api/employee/clients/${client.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data: { message?: string } = await res.json();
        throw new Error(data.message || "Update failed");
      }

      setSuccess("Saved successfully!");
      section === "details" ? setDetailsEditable(false) : setFeesEditable(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Document upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
        { method: "POST", body: formDataCloudinary }
      );

      if (!cloudRes.ok) throw new Error("Failed to upload document");

      const cloudData: { secure_url: string } = await cloudRes.json();

      const apiRes = await fetch(`/api/employee/clients/${client.id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, url: cloudData.secure_url }),
      });

      if (!apiRes.ok) {
        const apiError: { message?: string } = await apiRes.json();
        throw new Error(apiError.message || "Failed to save document");
      }

      const newDoc: Document = await apiRes.json();
      setDocuments((prev) => [...prev, newDoc]);
      setSuccess("Document uploaded successfully!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Delete document
  const handleDeleteDoc = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/employee/clients/${client.id}/documents/${docId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errData: { message?: string } = await res.json();
        throw new Error(errData.message || "Failed to delete document");
      }
      setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
      setSuccess("Document deleted successfully!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-10 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h1 className="text-3xl font-extrabold flex items-center gap-2 text-gray-900">
          <User className="w-8 h-8 text-blue-600" /> Client Profile & Edit
        </h1>
        <Link href="/dashboard/employee/my-clients" passHref>
          <Button
            variant="outline"
            className="flex items-center gap-1 hover:bg-blue-100 transition-colors duration-200"
          >
            <Info className="w-4 h-4" />
            Back to My Clients
          </Button>
        </Link>
      </div>

      {/* Overview */}
      <Card className="shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-600" />
          <CardTitle>Client Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-gray-700 text-base">
          <p>
            <strong>Name:</strong> {client.name}
          </p>
          <p>
            <strong>Email:</strong> {client.email}
          </p>
          <p>
            <strong>Phone:</strong> {client.phone}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            <span
              className={`inline-block px-2 py-1 rounded font-semibold tracking-wide ${
                client.status === "HOT"
                  ? "bg-red-200 text-red-800"
                  : client.status === "FOLLOWUP"
                  ? "bg-yellow-200 text-yellow-800"
                  : client.status === "COLD"
                  ? "bg-blue-200 text-blue-800"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              {client.status}
            </span>
          </p>
          <p>
            <strong>Assigned Employee:</strong>{" "}
            {client.assignedEmployee?.name || "Unassigned"}
          </p>
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
              disabled={uploadingDoc}
              id="upload-doc-input"
            />
            <label
              htmlFor="upload-doc-input"
              className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white bg-green-600 rounded-md shadow hover:bg-green-700 transition-colors duration-200"
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
                <li
                  key={doc.id}
                  className="flex justify-between items-center break-words bg-gray-50 rounded-md p-2 shadow-sm hover:bg-gray-100 transition-colors duration-150"
                >
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate flex-1"
                  >
                    {doc.name}
                  </a>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-3 text-red-600 hover:bg-red-100 transition-colors duration-150"
                    onClick={() => handleDeleteDoc(doc.id)}
                    disabled={loading}
                    aria-label={`Delete document ${doc.name}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Details Section */}
      <Card className="shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <User className="w-6 h-6 text-blue-600" />
            <CardTitle>Details</CardTitle>
          </div>
          {!detailsEditable ? (
            <Button
              size="sm"
              onClick={() => setDetailsEditable(true)}
              className="flex items-center gap-1 transition-transform hover:scale-105"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCancelEdit("details")}
                disabled={loading}
                className="flex items-center gap-1"
              >
                <XCircle className="w-4 h-4" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleSaveSection("details")}
                disabled={loading}
                className="flex items-center gap-1"
              >
                {loading ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save
                  </>
                )}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { id: "name", label: "Name", type: "text" },
            { id: "email", label: "Email", type: "email" },
            { id: "phone", label: "Phone", type: "text" },
          ].map(({ id, label, type }) => (
            <div key={id}>
              <label className="block font-medium mb-1" htmlFor={id}>
                {label}
              </label>
              {detailsEditable ? (
                <Input
                  id={id}
                  name={id}
                  type={type}
                  value={(formData as any)[id]}
                  onChange={handleChange}
                  required
                  className="transition-shadow focus:shadow-outline"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-100 rounded select-text truncate max-w-full">
                  {(formData as any)[id]}
                </p>
              )}
            </div>
          ))}

          {/* Status */}
          <div>
            <label className="block font-medium mb-1" htmlFor="status">
              Status
            </label>
            {detailsEditable ? (
              <Select
                name="status"
                value={formData.status}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, status: value as Status }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HOT">Hot</SelectItem>
                  <SelectItem value="FOLLOWUP">Follow Up</SelectItem>
                  <SelectItem value="COLD">Cold</SelectItem>
                  <SelectItem value="PROSPECT">Prospect</SelectItem>
                  <SelectItem value="SUCCESS">Success</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="px-3 py-2 bg-gray-100 rounded select-text max-w-full truncate">
                {formData.status}
              </p>
            )}
          </div>

          {/* Course */}
          <div>
            <label className="block font-medium mb-1" htmlFor="course">
              Course
            </label>
            {detailsEditable ? (
              <Input
                id="course"
                name="course"
                value={formData.course}
                onChange={handleChange}
                className="transition-shadow focus:shadow-outline"
              />
            ) : (
              <p className="px-3 py-2 bg-gray-100 rounded select-text truncate max-w-full">
                {formData.course || "-"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fees Section */}
      <Card className="shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <IndianRupee className="w-6 h-6 text-amber-600" />
            <CardTitle>Fees</CardTitle>
          </div>
          {!feesEditable ? (
            <Button
              size="sm"
              onClick={() => setFeesEditable(true)}
              className="flex items-center gap-1 transition-transform hover:scale-105"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCancelEdit("fees")}
                disabled={loading}
                className="flex items-center gap-1"
              >
                <XCircle className="w-4 h-4" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleSaveSection("fees")}
                disabled={loading}
                className="flex items-center gap-1"
              >
                {loading ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save
                  </>
                )}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Editable hostelFee and courseFee */}
          {["hostelFee", "courseFee"].map((id) => (
            <div key={id}>
              <label htmlFor={id} className="block font-medium mb-1">
                {id === "hostelFee" ? "Hostel Fee" : "Course Fee"}
              </label>
              {feesEditable ? (
                <Input
                  id={id}
                  name={id}
                  type="number"
                  min={0}
                  step="0.01"
                  value={(formData as any)[id]}
                  onChange={handleChange}
                  className="transition-shadow focus:shadow-outline"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-100 rounded select-text truncate max-w-full">
                  {(formData as any)[id] || "-"}
                </p>
              )}
            </div>
          ))}

          {/* Read-only totalFee */}
          <div>
            <label
              htmlFor="totalFee"
              className="block font-medium mb-1"
              title="Automatically calculated from Hostel Fee + Course Fee"
            >
              Total Fee
            </label>
            <p
              id="totalFee"
              className="px-3 py-2 bg-gray-100 rounded select-text truncate max-w-full cursor-default"
              aria-readonly="true"
            >
              {formData.totalFee || "0.00"}
            </p>
          </div>

          {/* Other fees inputs: courseFeePaid, hostelFeePaid,*/}
          {["courseFeePaid", "hostelFeePaid"].map((id) => (
            <div key={id}>
              <label htmlFor={id} className="block font-medium mb-1">
                {id === "courseFeePaid"
                  ? "Course Fee Paid"
                  : id === "hostelFeePaid"
                  ? "Hostel Fee Paid"
                  : "Total Fee Paid"}
              </label>
              {feesEditable ? (
                <Input
                  id={id}
                  name={id}
                  type="number"
                  min={0}
                  step="0.01"
                  value={(formData as any)[id]}
                  onChange={handleChange}
                  className="transition-shadow focus:shadow-outline"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-100 rounded select-text truncate max-w-full">
                  {(formData as any)[id] || "-"}
                </p>
              )}
            </div>
          ))}

            {/* Read-only totalFeePaid */}
              <div>
                <label
                  htmlFor="totalFeePaid"
                  className="block font-medium mb-1"
                  title="Automatically calculated from Course Fee Paid + Hostel Fee Paid"
                >
                  Total Fee Paid
                </label>
                <p
                  id="totalFeePaid"
                  className="px-3 py-2 bg-gray-100 rounded select-text truncate max-w-full cursor-default"
                  aria-readonly="true"
                >
                  {formData.totalFeePaid || "0.00"}
                </p>
              </div>
        </CardContent>
      </Card>

      {/* Show success or error messages */}
      {(error || success) && (
        <div
          className={`max-w-4xl mx-auto px-4 py-3 rounded-md text-center ${
            error
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
          role="alert"
        >
          {error || success}
        </div>
      )}
    </div>
  );
}
