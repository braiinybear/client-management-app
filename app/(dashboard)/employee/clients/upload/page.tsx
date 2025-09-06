"use client";

import { useState } from "react";
import { CloudUpload, Loader2 } from "lucide-react";

export default function BulkUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file first");
      return;
    }

    setIsUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/employee/clients/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setMessage(data.message || "Upload complete");
    } catch (error) {
      setMessage("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-lg  shadow-md rounded-lg p-8">
        <div className="flex items-center space-x-2 mb-6">
          <CloudUpload className="text-blue-600" size={28} />
          <h2 className="text-2xl font-semibold text-gray-800">Bulk Upload Clients</h2>
        </div>

        <label
          className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition mb-6
            ${file ? "bg-sky-400 border-blue-950" : "border-gray-300 hover:border-blue-500"}`}
        >
          <span className={`${file ? "" : "text-gray-500"}`}>
            {file ? file.name : "Click to select a .csv or Excel file"}
          </span>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleChange}
            className="hidden"
          />
        </label>

        <button
          onClick={handleUpload}
          disabled={isUploading}
          className={`w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700  font-semibold py-2 px-4 rounded transition disabled:opacity-60`}
        >
          {isUploading ? (
            <>
              <Loader2 className="animate-spin mr-2" size={18} />
              Uploading...
            </>
          ) : (
            "Upload"
          )}
        </button>

        {message && (
          <div className="mt-4 text-sm text-center text-gray-700">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
