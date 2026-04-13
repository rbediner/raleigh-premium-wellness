const SPREADSHEET_ID = "1rRNeWWqNsdbr1kuwpQfzuFWHaIAXx--MfyhgdhDyWV0";

// Mirror the public form paths one-to-one so each sheet tab stays readable and
// does not collapse unrelated submissions into one mixed schema.
const PATH_SCHEMAS = {
  work_with_us: {
    sheetName: "work_with_us",
    fieldColumns: [
      ["first_name", "First Name"],
      ["last_name", "Last Name"],
      ["email", "Email Address"],
      ["phone", "Mobile Phone Number"],
      ["short_message", "Short Message"],
      ["city_area", "City / Area"],
      ["linkedin_url", "LinkedIn URL"],
      ["additional_links", "Additional Links"],
      ["email_follow_up_consent", "Email Follow-up Consent"],
    ],
  },
  partner_with_us: {
    sheetName: "partner_with_us",
    fieldColumns: [
      ["first_name", "First Name"],
      ["last_name", "Last Name"],
      ["organization_name", "Business / Organization Name"],
      ["email", "Email Address"],
      ["phone", "Mobile Phone Number"],
      ["partnership_type", "Partnership Type"],
      ["short_message", "Partnership Idea"],
      ["email_follow_up_consent", "Email Follow-up Consent"],
    ],
  },
  stay_connected: {
    sheetName: "stay_connected",
    fieldColumns: [
      ["first_name", "First Name"],
      ["last_name", "Last Name"],
      ["email", "Email Address"],
      ["phone", "Mobile Phone Number"],
      ["email_updates_consent", "Email Updates Consent"],
    ],
  },
};

const SHARED_COLUMNS = [
  "submitted_at",
  "submission_date",
  "submission_time",
  "path",
  "source_url",
  "is_test_submission",
];

function buildJsonResponse(responseBody) {
  return ContentService.createTextOutput(JSON.stringify(responseBody)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function getSheetHeadersForPath(pathKey) {
  const pathSchema = PATH_SCHEMAS[pathKey];

  if (!pathSchema) {
    throw new Error(`Unknown submission path: ${pathKey}`);
  }

  return [...SHARED_COLUMNS, ...pathSchema.fieldColumns.map(([, columnLabel]) => columnLabel)];
}

function ensureSheetForPath(spreadsheet, pathKey) {
  const pathSchema = PATH_SCHEMAS[pathKey];
  let sheet = spreadsheet.getSheetByName(pathSchema.sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(pathSchema.sheetName);
  }

  const expectedHeaders = getSheetHeadersForPath(pathKey);
  const existingHeaders = sheet.getRange(1, 1, 1, expectedHeaders.length).getDisplayValues()[0];
  const headerMismatch = expectedHeaders.some((headerValue, index) => existingHeaders[index] !== headerValue);

  if (headerMismatch) {
    // Re-assert the header row on deploy or schema updates so new writes always
    // land under a predictable, human-readable column order.
    sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function buildRowValues(pathKey, normalizedValues, payloadMetadata) {
  const pathSchema = PATH_SCHEMAS[pathKey];
  const now = new Date();
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheetTimeZone = spreadsheet.getSpreadsheetTimeZone() || "America/New_York";

  const sharedValues = [
    now.toISOString(),
    Utilities.formatDate(now, sheetTimeZone, "yyyy-MM-dd"),
    Utilities.formatDate(now, sheetTimeZone, "HH:mm:ss"),
    pathKey,
    payloadMetadata.sourceUrl || "",
    payloadMetadata.isTestSubmission ? "TRUE" : "FALSE",
  ];

  const fieldValues = pathSchema.fieldColumns.map(([fieldKey]) => {
    const rawValue = normalizedValues[fieldKey];

    if (typeof rawValue === "boolean") {
      return rawValue ? "TRUE" : "FALSE";
    }

    return rawValue || "";
  });

  return [...sharedValues, ...fieldValues];
}

function parseIncomingPayload(event) {
  if (!event.postData || !event.postData.contents) {
    throw new Error("Missing request body.");
  }

  const payload = JSON.parse(event.postData.contents);

  if (!payload.path || !PATH_SCHEMAS[payload.path]) {
    throw new Error("Missing or invalid path.");
  }

  return payload;
}

function writeSubmissionRow(payload) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ensureSheetForPath(spreadsheet, payload.path);
  const rowValues = buildRowValues(payload.path, payload.normalized_values || {}, {
    sourceUrl: payload.source_url,
    isTestSubmission: payload.is_test_submission,
  });

  sheet.appendRow(rowValues);

  return {
    ok: true,
    sheet_name: sheet.getName(),
    row_number: sheet.getLastRow(),
  };
}

function doGet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);

  return buildJsonResponse({
    ok: true,
    service: "raleigh-premium-wellness-form-submissions",
    spreadsheet_id: SPREADSHEET_ID,
    spreadsheet_timezone: spreadsheet.getSpreadsheetTimeZone(),
    available_paths: Object.keys(PATH_SCHEMAS),
  });
}

function doPost(event) {
  try {
    const payload = parseIncomingPayload(event);
    const responseBody = writeSubmissionRow(payload);

    return buildJsonResponse(responseBody);
  } catch (error) {
    return buildJsonResponse({
      ok: false,
      message: error && error.message ? error.message : "Submission failed.",
    });
  }
}
