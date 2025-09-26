import React from "react";

export interface BulkEditFields {
  status: string;
  courseFee: string;
  courseFeePaid: string;
  hostelFee: string;
  hostelFeePaid: string;
}

interface BulkEditClientsModalProps {
  open: boolean;
  loading: boolean;
  fields: BulkEditFields;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const BulkEditClientsModal: React.FC<BulkEditClientsModalProps> = ({
  open,
  loading,
  fields,
  onChange,
  onClose,
  onSubmit,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className=" rounded-lg shadow-lg p-6 w-full max-w-md relative text-white">
        <button
          className="absolute top-2 right-2 "
          onClick={onClose}
          disabled={loading}
        >
          &times;
        </button>
        <h2 className="text-lg font-semibold mb-4">Bulk Edit Clients</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              name="status"
              value={fields.status}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
              disabled={loading}
            >
              <option value="">-- Select Status --</option>
              <option value="hot">Hot</option>
              <option value="prospect">Prospect</option>
              <option value="followup">Followup</option>
              <option value="cold">Cold</option>
              <option value="success">Success</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Course Fee</label>
            <input
              type="number"
              name="courseFee"
              value={fields.courseFee}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
              disabled={loading}
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Course Fee Paid</label>
            <input
              type="number"
              name="courseFeePaid"
              value={fields.courseFeePaid}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
              disabled={loading}
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hostel Fee</label>
            <input
              type="number"
              name="hostelFee"
              value={fields.hostelFee}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
              disabled={loading}
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hostel Fee Paid</label>
            <input
              type="number"
              name="hostelFeePaid"
              value={fields.hostelFeePaid}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
              disabled={loading}
              min="0"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 rounded bg-yellow-500 text-white font-semibold disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};
