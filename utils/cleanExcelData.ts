const STATUS_ENUM = ["HOT", "PROSPECT", "FOLLOWUP", "COLD", "SUCCESS"];

const STATUS_COLUMN_MAP: Record<string, string> = {
  "HOT": "HOT",
  "PROSPECT": "PROSPECT",
  "FOLLOW-UP": "FOLLOWUP",
  "COLD": "COLD",
  "SUCCESS": "SUCCESS",
};

const CALL_RESPONSE_ENUM = [
  "HANGUP",
  "NOTINTERESTED",
  "WRONG",
  "NOTRESPONDED",
  "NOTREACHED",
  "ONGOING",
  "COMPLETED",
];

const CALL_RESPONSE_MAP: Record<string, string> = {
  "hang up": "HANGUP",
  "hung up": "HANGUP",
  "hanged up": "HANGUP",
  "hangup": "HANGUP",
  "hang call": "HANGUP",
  "hang call by client": "HANGUP",
  "hang call by cilent": "HANGUP", // typo fix included
  "not interested": "NOTINTERESTED",
  "wrong": "WRONG",
  "wrong number": "WRONG",
  "not responded": "NOTRESPONDED",
  "no response": "NOTRESPONDED",
  "no answer": "NOTRESPONDED",
  "not reached": "NOTREACHED",
  "ongoing": "ONGOING",
  "completed": "COMPLETED",
};

export const cleanExcelData = (rows: any[]) => {
  const columnMap: Record<string, string> = {
    name: "name",
    "full name": "name",
    fullname: "name",
    phone: "phone",
    "phone number": "phone",
    phonenumber: "phone",
    "contact number": "phone",
    number: "phone",
    notes: "notes",
    remark: "notes",
    comment: "notes",
    course: "course",
    "hostel fee": "hostelFee",
    "course fee": "courseFee",
    "total fee": "totalFee",
    "course fee paid": "courseFeePaid",
    "hostel fee paid": "hostelFeePaid",
    "total fee paid": "totalFeePaid",
    "call response": "callResponse",
    callstatus: "callResponse",
  };

  const cleaned: any[] = [];
  const errors: any[] = [];

  rows.forEach((row: any, index: number) => {
    const cleanedRow: any = {};
    const normalizedRow: Record<string, any> = {};

    // Normalize keys (case-insensitive, trimmed)
    Object.keys(row).forEach((key) => {
      normalizedRow[key.trim().toUpperCase()] = row[key];
    });

    // Map known columns to cleanedRow
    Object.keys(row).forEach((rawKey) => {
      const key = rawKey.trim().toLowerCase();
      const mapped = columnMap[key];
      if (mapped) {
        let value = row[rawKey];
        if (typeof value === "string") value = value.trim();

        if (
          [
            "hostelFee",
            "courseFee",
            "totalFee",
            "courseFeePaid",
            "hostelFeePaid",
            "totalFeePaid",
          ].includes(mapped)
        ) {
          value = value !== undefined && value !== "" ? Number(value) : null;
          cleanedRow[mapped] = value;
        } else if (mapped === "phone") {
          value =
            value !== undefined && value !== null
              ? String(value).replace(/[^\d+]/g, "").trim()
              : null;
          cleanedRow[mapped] = value;
        } else {
          cleanedRow[mapped] = value;
        }
      }
    });

    // Infer status from "YES" columns
    cleanedRow.status = undefined;
    for (const col of Object.keys(STATUS_COLUMN_MAP)) {
      const val = normalizedRow[col];
      if (val && String(val).toLowerCase() === "yes") {
        cleanedRow.status = STATUS_COLUMN_MAP[col];
        break;
      }
    }

    // Override with 'Status' column if present
    if (!cleanedRow.status && normalizedRow["STATUS"]) {
      let val = String(normalizedRow["STATUS"]).trim().toUpperCase();
      val = val.replace(/[\s-]/g, "");
      if (STATUS_ENUM.includes(val)) {
        cleanedRow.status = val;
      }
    }

    // Default status if still missing
    cleanedRow.status = cleanedRow.status ?? null;

    // ✅ New rule: if status is PROSPECT, set it to null
    if (cleanedRow.status === "PROSPECT") {
      cleanedRow.status = null;
    }

    // Handle callResponse mapping
    let rawCallResponse = cleanedRow.callResponse;
    if (rawCallResponse) {
      rawCallResponse = String(rawCallResponse).trim().toLowerCase();
      const mapped = CALL_RESPONSE_MAP[rawCallResponse];
      if (mapped && CALL_RESPONSE_ENUM.includes(mapped)) {
        cleanedRow.callResponse = mapped;
      } else {
        errors.push({
          row: index + 2,
          message: `Invalid call response: "${cleanedRow.callResponse}", defaulted to null.`,
        });
        cleanedRow.callResponse = null;
      }
    } else {
      cleanedRow.callResponse =  null;
    }

    // Set nulls for missing optional fields
    cleanedRow.notes = cleanedRow.notes ?? null;
    cleanedRow.course = cleanedRow.course ?? null;
    cleanedRow.hostelFee = cleanedRow.hostelFee ?? null;
    cleanedRow.courseFee = cleanedRow.courseFee ?? null;
    cleanedRow.totalFee = cleanedRow.totalFee ?? null;
    cleanedRow.courseFeePaid = cleanedRow.courseFeePaid ?? null;
    cleanedRow.hostelFeePaid = cleanedRow.hostelFeePaid ?? null;
    cleanedRow.totalFeePaid = cleanedRow.totalFeePaid ?? null;

    // Final validation: phone is mandatory
    if (!cleanedRow.phone) {
      errors.push({ row: index + 2, message: "Missing phone" });
    } else {
      cleaned.push(cleanedRow);
    }
  });

  return { cleaned, errors };
};
