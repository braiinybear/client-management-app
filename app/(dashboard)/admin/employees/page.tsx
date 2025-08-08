'use client';

import React, { useEffect, useState } from "react";
import { DataTable } from "../data-table";
import { columns, Employee } from "../employeColumns"; // Make sure you have this

export default function AdminEmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEmployees = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/admin/employees");
            if (!res.ok) {
                throw new Error(`Failed to fetch employees: ${res.statusText}`);
            }
            const data: Employee[] = await res.json();
            setEmployees(data);
        } catch (err) {
            setError((err as Error).message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <header className="mb-6">
                <h1 className="text-3xl font-semibold">Employees Management</h1>
                <p className="text-muted-foreground mt-1">
                    View and manage all employees.
                </p>
            </header>

            {loading && (
                <div
                    role="status"
                    aria-live="polite"
                    className="flex items-center justify-center py-20"
                >
                    <svg
                        className="animate-spin h-8 w-8 text-primary"
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
                            d="M4 12a8 8 0 018-8v8z"
                        ></path>
                    </svg>
                    <span className="ml-3 text-lg">Loading employees...</span>
                </div>
            )}

            {error && (
                <div
                    role="alert"
                    aria-live="assertive"
                    className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
                    style={{ maxWidth: "600px" }}
                >
                    <strong className="font-bold">Error:</strong> <span>{error}</span>
                    <button
                        onClick={fetchEmployees}
                        className="ml-4 underline hover:no-underline text-red-700 font-semibold"
                    >
                        Retry
                    </button>
                </div>
            )}

            {!loading && !error && (
                <DataTable
                    columns={columns}
                    data={employees}
                    rowLinkPrefix="/admin/employees"
                />

            )}

            {!loading && !error && employees.length === 0 && (
                <p className="text-center text-muted-foreground py-20">
                    No employees found. Add new employees to get started.
                </p>
            )}
        </div>
    );
}
