const SPREADSHEET_ID = "1rRNeWWqNsdbr1kuwpQfzuFWHaIAXx--MfyhgdhDyWV0";
// Use the verified-working monitored inbox until the @thetox.com routing issue
// is resolved at the mail/domain level.
const NOTIFICATION_EMAIL = "roman.bediner+thetox@cormanity.com";
const NOTIFICATION_EMAIL_FALLBACK = "roman.bediner@cormanity.com";
const NOTIFICATION_SENDER_NAME = "Raleigh Premium Wellness Intake";
// Preserve support for older deployed clients while normalizing all writes to
// the updated curiosity path key.
const LEGACY_PATH_ALIASES = {
  stay_connected: "find_out_whats_coming",
};

function normalizePathKey(pathKey) {
  return LEGACY_PATH_ALIASES[pathKey] || pathKey;
}

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
  find_out_whats_coming: {
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
const TEST_SUBMISSIONS_SHEET_NAME = "test_submissions";
const TEST_SUBMISSION_CONTEXT_COLUMNS = ["Path Label", "Routed Production Sheet"];

function buildUnifiedTestFieldColumns() {
  const seenFieldKeys = {};
  const unifiedFieldColumns = [];

  Object.values(PATH_SCHEMAS).forEach((pathSchema) => {
    pathSchema.fieldColumns.forEach(([fieldKey, fieldLabel]) => {
      if (seenFieldKeys[fieldKey]) {
        return;
      }

      seenFieldKeys[fieldKey] = true;
      unifiedFieldColumns.push([fieldKey, fieldLabel]);
    });
  });

  return unifiedFieldColumns;
}

const UNIFIED_TEST_FIELD_COLUMNS = buildUnifiedTestFieldColumns();

const PATH_LABELS = {
  work_with_us: "Work With Us",
  partner_with_us: "Partner With Us",
  find_out_whats_coming: "Find Out What’s Coming",
};

function buildJsonResponse(responseBody) {
  return ContentService.createTextOutput(JSON.stringify(responseBody)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function getPathLabel(pathKey) {
  return PATH_LABELS[pathKey] || pathKey;
}

function getSheetHeadersForPath(pathKey, isTestSubmission) {
  const pathSchema = PATH_SCHEMAS[pathKey];

  if (!pathSchema) {
    throw new Error(`Unknown submission path: ${pathKey}`);
  }

  if (isTestSubmission) {
    return [
      ...SHARED_COLUMNS,
      ...TEST_SUBMISSION_CONTEXT_COLUMNS,
      ...UNIFIED_TEST_FIELD_COLUMNS.map(([, columnLabel]) => columnLabel),
    ];
  }

  return [...SHARED_COLUMNS, ...pathSchema.fieldColumns.map(([, columnLabel]) => columnLabel)];
}

function getDestinationSheetName(pathKey, isTestSubmission) {
  const pathSchema = PATH_SCHEMAS[pathKey];

  if (!pathSchema) {
    throw new Error(`Unknown submission path: ${pathKey}`);
  }

  if (isTestSubmission) {
    return TEST_SUBMISSIONS_SHEET_NAME;
  }

  return pathSchema.sheetName;
}

function ensureSheetForPath(spreadsheet, pathKey, isTestSubmission) {
  const pathSchema = PATH_SCHEMAS[pathKey];
  const destinationSheetName = getDestinationSheetName(pathKey, isTestSubmission);
  let sheet = spreadsheet.getSheetByName(destinationSheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(destinationSheetName);
  }

  const expectedHeaders = getSheetHeadersForPath(pathKey, isTestSubmission);
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

function buildRowValues(pathKey, normalizedValues, payloadMetadata, isTestSubmission) {
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

  const fieldColumns = isTestSubmission ? UNIFIED_TEST_FIELD_COLUMNS : pathSchema.fieldColumns;
  const fieldValues = fieldColumns.map(([fieldKey]) => {
    const rawValue = normalizedValues[fieldKey];

    if (typeof rawValue === "boolean") {
      return rawValue ? "TRUE" : "FALSE";
    }

    return rawValue || "";
  });

  if (isTestSubmission) {
    const testContextValues = [getPathLabel(pathKey), pathSchema.sheetName];
    return [...sharedValues, ...testContextValues, ...fieldValues];
  }

  return [...sharedValues, ...fieldValues];
}

function buildRowRecord(pathKey, normalizedValues, payloadMetadata, isTestSubmission) {
  const headers = getSheetHeadersForPath(pathKey, isTestSubmission);
  const rowValues = buildRowValues(pathKey, normalizedValues, payloadMetadata, isTestSubmission);

  return headers.reduce((record, header, index) => {
    record[header] = rowValues[index];
    return record;
  }, {});
}

function buildNotificationSubject(pathKey) {
  return `New Raleigh Premium Wellness inquiry: ${getPathLabel(pathKey)}`;
}

function buildNotificationBody(pathKey, rowRecord, responseBody) {
  const orderedEntries = Object.entries(rowRecord).filter(([, value]) => String(value || "").trim() !== "");
  const lines = [
    "A new inquiry was submitted on the Raleigh Premium Wellness staging site.",
    "",
    `Inquiry type: ${getPathLabel(pathKey)}`,
    `Sheet tab: ${responseBody.sheet_name}`,
    `Row number: ${responseBody.row_number}`,
    "",
    "Submission details:",
    ...orderedEntries.map(([fieldName, fieldValue]) => `${fieldName}: ${fieldValue}`),
  ];

  return lines.join("\n");
}

function sendNotificationEmail(pathKey, rowRecord, responseBody) {
  const subject = buildNotificationSubject(pathKey);
  const body = buildNotificationBody(pathKey, rowRecord, responseBody);
  const recipients = [...new Set([NOTIFICATION_EMAIL, NOTIFICATION_EMAIL_FALLBACK])];
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let emailLogSheet = spreadsheet.getSheetByName("email_delivery_log");

  if (!emailLogSheet) {
    emailLogSheet = spreadsheet.insertSheet("email_delivery_log");
  }

  const emailLogHeaders = ["logged_at", "path", "sheet_tab", "row_number", "recipient", "provider", "status", "error_message"];
  const existingHeaders = emailLogSheet.getRange(1, 1, 1, emailLogHeaders.length).getDisplayValues()[0];
  const headersMismatch = emailLogHeaders.some((header, index) => existingHeaders[index] !== header);

  if (headersMismatch) {
    emailLogSheet.getRange(1, 1, 1, emailLogHeaders.length).setValues([emailLogHeaders]);
    emailLogSheet.setFrozenRows(1);
  }

  const nowIso = new Date().toISOString();
  let lastErrorMessage = "";

  function appendEmailLogRow(recipient, provider, status, errorMessage) {
    emailLogSheet.appendRow([
      nowIso,
      pathKey,
      responseBody.sheet_name || "",
      responseBody.row_number || "",
      recipient,
      provider,
      status,
      errorMessage || "",
    ]);
  }

  // Prefer GmailApp first so message handling matches mailbox-native delivery
  // behavior, and fall back to MailApp for resiliency.
  for (const recipient of recipients) {
    try {
      GmailApp.sendEmail(recipient, subject, body, {
        name: NOTIFICATION_SENDER_NAME,
      });
      appendEmailLogRow(recipient, "GmailApp", "sent", "");
      continue;
    } catch (gmailError) {
      const gmailMessage = gmailError && gmailError.message ? gmailError.message : "Unknown GmailApp error.";
      appendEmailLogRow(recipient, "GmailApp", "failed", gmailMessage);
      lastErrorMessage = gmailMessage;
    }

    try {
      MailApp.sendEmail({
        to: recipient,
        subject,
        body,
        name: NOTIFICATION_SENDER_NAME,
      });
      appendEmailLogRow(recipient, "MailApp", "sent", "");
    } catch (mailError) {
      const mailMessage = mailError && mailError.message ? mailError.message : "Unknown MailApp error.";
      appendEmailLogRow(recipient, "MailApp", "failed", mailMessage);
      lastErrorMessage = mailMessage;
    }
  }

  const allLogRows = emailLogSheet.getDataRange().getDisplayValues().slice(1);
  const sentRowCount = allLogRows.filter(([loggedAt, loggedPath, , loggedRowNumber, , , status]) => {
    return loggedAt === nowIso && loggedPath === pathKey && String(loggedRowNumber) === String(responseBody.row_number) && status === "sent";
  }).length;

  if (sentRowCount === 0) {
    throw new Error(lastErrorMessage || "Email delivery failed for all configured recipients.");
  }
}

function parseIncomingPayload(event) {
  if (!event.postData || !event.postData.contents) {
    throw new Error("Missing request body.");
  }

  const payload = JSON.parse(event.postData.contents);

  const normalizedPath = normalizePathKey(payload.path);

  if (!normalizedPath || !PATH_SCHEMAS[normalizedPath]) {
    throw new Error("Missing or invalid path.");
  }

  payload.path = normalizedPath;

  return payload;
}

function writeSubmissionRow(payload) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const isTestSubmission = Boolean(payload.is_test_submission);
  const sheet = ensureSheetForPath(spreadsheet, payload.path, isTestSubmission);
  const payloadMetadata = {
    sourceUrl: payload.source_url,
    isTestSubmission,
  };
  const rowValues = buildRowValues(payload.path, payload.normalized_values || {}, payloadMetadata, isTestSubmission);
  const rowRecord = buildRowRecord(payload.path, payload.normalized_values || {}, payloadMetadata, isTestSubmission);
  const responseBody = {
    ok: true,
    sheet_name: sheet.getName(),
    row_number: sheet.getLastRow() + 1,
  };

  // Only send internal notification after the row append succeeds so the UI
  // never claims success for a submission that was not captured in Sheets.
  sheet.appendRow(rowValues);

  try {
    sendNotificationEmail(payload.path, rowRecord, responseBody);
    responseBody.notification_email_sent = true;
  } catch (error) {
    responseBody.notification_email_sent = false;
    responseBody.notification_email_error = error && error.message ? error.message : "Unknown email error.";
    console.error("Submission notification email failed.", error);
  }

  return responseBody;
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
