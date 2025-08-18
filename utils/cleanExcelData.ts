const STATUS_ENUM = ["HOT", "PROSPECT", "FOLLOWUP", "COLD", "SUCCESS"];

const STATUS_COLUMN_MAP: Record<string, string> = {
  "HOT": "HOT",
  "PROSPECT": "PROSPECT",
  "FOLLOW-UP": "FOLLOWUP",  // map hyphenated header to enum key
  "COLD": "COLD",
  "SUCCESS": "SUCCESS",
};

export const cleanExcelData = (rows: any[]) => {
  const columnMap: Record<string, string> = {
    name: "name",
    "full name": "name",
    fullname: "name",
    phone: "phone",
    "phone number": "phone",
    phonenumber: "phone",
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

    // Infer status from YES columns (normalized)
    cleanedRow.status = undefined;
    for (const col of Object.keys(STATUS_COLUMN_MAP)) {
      const val = normalizedRow[col];
      if (val && String(val).toLowerCase() === "yes") {
        cleanedRow.status = STATUS_COLUMN_MAP[col];
        break;
      }
    }

    // Override with 'Status' column if present and valid
    if (!cleanedRow.status && normalizedRow["STATUS"]) {
      let val = String(normalizedRow["STATUS"]).trim().toUpperCase();
      // Normalize: remove spaces and hyphens for matching enum keys
      val = val.replace(/[\s-]/g, "");
      if (STATUS_ENUM.includes(val)) {
        cleanedRow.status = val;
      }
    }

    // Set defaults for missing fields
    cleanedRow.status = cleanedRow.status ?? "PROSPECT";
    cleanedRow.callResponse = cleanedRow.callResponse ?? null;
    cleanedRow.notes = cleanedRow.notes ?? null;
    cleanedRow.course = cleanedRow.course ?? null;
    cleanedRow.hostelFee = cleanedRow.hostelFee ?? null;
    cleanedRow.courseFee = cleanedRow.courseFee ?? null;
    cleanedRow.totalFee = cleanedRow.totalFee ?? null;
    cleanedRow.courseFeePaid = cleanedRow.courseFeePaid ?? null;
    cleanedRow.hostelFeePaid = cleanedRow.hostelFeePaid ?? null;
    cleanedRow.totalFeePaid = cleanedRow.totalFeePaid ?? null;

    console.log(`Row ${index + 2} Status: ${cleanedRow.status}`); // Debug print

    if (!cleanedRow.phone) {
      errors.push({ row: index + 2, message: "Missing phone" });
    } else {
      cleaned.push(cleanedRow);
    }
  });

  return { cleaned, errors };
};
