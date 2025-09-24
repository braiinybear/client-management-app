"use client";

import React, { useState } from "react";

type Props = {
  employeeId: string;
};

export default function UploadClientsComponent({ employeeId }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMessage("Please select a CSV file");
      return;
    }

    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("employeeId", employeeId);

    try {
      const res = await fetch("/api/admin/upload-clients", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      setMessage("Clients uploaded successfully!");
      setFile(null);
      (document.getElementById("file-input") as HTMLInputElement).value = "";
    } catch (err) {
      setMessage(`Error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col items-center justify-center">
      <h3 className="text-xl text-center font-semibold text-gray-900 dark:text-gray-100 mb-6 border-b pb-2">
        Upload Clients CSV
      </h3>
      <form onSubmit={handleSubmit} className="space-y-6 w-[60%] flex flex-col gap-2 p-1 justify-center items-center">
        <label
          htmlFor="file-input"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Select CSV File
        </label>
        <input
          id="file-input"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
            cursor-pointer
            dark:text-gray-400
            dark:file:bg-blue-900
            dark:file:text-blue-300
            dark:hover:file:bg-blue-800
            "
        />
        <button
          type="submit"
          disabled={loading}
          className={`w-full flex justify-center items-center gap-2 rounded-md px-4 py-2 text-white font-semibold transition-colors duration-300 ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          }`}
        >
          {loading && (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
          )}
          {loading ? "Uploading..." : "Upload"}
        </button>
      </form>
      {message && (
        <p
          className={`mt-4 text-center font-medium ${
            message.includes("Error")
              ? "text-red-600 dark:text-red-400"
              : "text-green-600 dark:text-green-400"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
