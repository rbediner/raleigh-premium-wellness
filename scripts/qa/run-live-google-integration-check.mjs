/**
 * Purpose: Run a live Apps Script + Google Sheets smoke check for all public
 * intake paths and prove row writes plus notification-send evidence.
 * Role: Backend QA guardrail used after Apps Script deploys and staging pushes.
 * Dependencies: Node.js 22+ (native fetch).
 * Risk: Medium. This writes test rows to designated *_test tabs.
 */

const commandLineArguments = process.argv.slice(2);

function readArgument(flagName) {
  const argumentIndex = commandLineArguments.indexOf(flagName);
  return argumentIndex >= 0 ? commandLineArguments[argumentIndex + 1] : undefined;
}

const endpointUrl = readArgument("--endpoint");
const spreadsheetId = readArgument("--spreadsheet-id");
const sourceUrl = readArgument("--source-url") || "https://rbediner.github.io/raleigh-premium-wellness/staging/";
const requiredRecipient = readArgument("--required-recipient") || "roman.bediner+thetox@cormanity.com";
const isDryRun = commandLineArguments.includes("--dry-run");

if (!endpointUrl || !spreadsheetId) {
  throw new Error(
    "Pass --endpoint <apps-script-exec-url> and --spreadsheet-id <google-sheet-id>.",
  );
}

const runTag = new Date().toISOString().replace(/[-:.TZ]/g, "");
const checks = [
  {
    path: "work_with_us",
    expectedSheet: "test_submissions",
    normalizedValues: {
      first_name: `QA_${runTag}`,
      last_name: "WORK",
      email: `qa.work.${runTag}@example.com`,
      phone: "9195552001",
      short_message: `live-backend-check-${runTag}`,
      city_area: "Raleigh",
      linkedin_url: "https://linkedin.com/in/qa-check",
      additional_links: "https://example.com",
      email_follow_up_consent: true,
    },
  },
  {
    path: "partner_with_us",
    expectedSheet: "test_submissions",
    normalizedValues: {
      first_name: `QA_${runTag}`,
      last_name: "PARTNER",
      organization_name: "QA Partner Org",
      email: `qa.partner.${runTag}@example.com`,
      phone: "9195552002",
      partnership_type: "local_business",
      short_message: `live-backend-check-${runTag}`,
      email_follow_up_consent: true,
    },
  },
  {
    path: "find_out_whats_coming",
    expectedSheet: "test_submissions",
    normalizedValues: {
      first_name: `QA_${runTag}`,
      last_name: "CURIOUS",
      email: `qa.curious.${runTag}@example.com`,
      phone: "9195552003",
      email_updates_consent: true,
    },
  },
];

function parseCsvLine(csvLine) {
  const values = [];
  let currentValue = "";
  let inQuotes = false;

  for (let index = 0; index < csvLine.length; index += 1) {
    const char = csvLine[index];
    const nextChar = csvLine[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentValue += '"';
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(currentValue);
      currentValue = "";
      continue;
    }

    currentValue += char;
  }

  values.push(currentValue);
  return values;
}

function parseCsvText(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  const [headerLine, ...rowLines] = lines;
  const headers = parseCsvLine(headerLine);

  return rowLines.map((rowLine) => {
    const rowValues = parseCsvLine(rowLine);
    return headers.reduce((record, header, index) => {
      record[header] = rowValues[index] || "";
      return record;
    }, {});
  });
}

async function fetchCsvSheetRows(sheetName, query, cacheBuster) {
  const url = new URL(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq`);
  url.searchParams.set("tqx", "out:csv");
  url.searchParams.set("sheet", sheetName);
  url.searchParams.set("tq", query);
  url.searchParams.set("cache", cacheBuster);

  const response = await fetch(url.toString(), {
    headers: {
      "Cache-Control": "no-cache",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to read sheet ${sheetName}: ${response.status}`);
  }

  const csvText = await response.text();
  return parseCsvText(csvText);
}

async function assertHealthContract() {
  const response = await fetch(endpointUrl, {
    headers: {
      "Cache-Control": "no-cache",
    },
  });

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}.`);
  }

  const body = await response.json();
  const expectedPaths = ["work_with_us", "partner_with_us", "find_out_whats_coming"];

  for (const expectedPath of expectedPaths) {
    if (!body.available_paths?.includes(expectedPath)) {
      throw new Error(`Health check missing expected path: ${expectedPath}`);
    }
  }

  return body;
}

async function submitPathCheck(check) {
  const payload = {
    path: check.path,
    normalized_values: check.normalizedValues,
    source_url: `${sourceUrl}?liveQa=${runTag}&path=${encodeURIComponent(check.path)}`,
    is_test_submission: true,
  };

  if (isDryRun) {
    return {
      ok: true,
      dry_run: true,
      path: check.path,
      expected_sheet: check.expectedSheet,
      payload,
    };
  }

  const response = await fetch(endpointUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json();

  if (!response.ok || !body.ok) {
    throw new Error(
      `Submission failed for ${check.path}: ${body?.message || response.statusText || "unknown error"}`,
    );
  }

  if (body.sheet_name !== check.expectedSheet) {
    throw new Error(
      `Unexpected destination tab for ${check.path}. Expected ${check.expectedSheet}, got ${body.sheet_name}.`,
    );
  }

  return body;
}

function assertRecentSheetRow(sheetRows, check) {
  const matchingRow = sheetRows.find(
    (row) =>
      row.path === check.path &&
      row["First Name"] === `QA_${runTag}` &&
      row["Email Address"] === check.normalizedValues.email,
  );

  if (!matchingRow) {
    throw new Error(`Did not find expected verification row in ${check.expectedSheet} for ${check.path}.`);
  }
}

function assertEmailDeliveryLog(emailLogRows, check, submissionResult) {
  const sentLogRows = emailLogRows.filter(
    (row) =>
      row.path === check.path &&
      row.sheet_tab === check.expectedSheet &&
      row.row_number === String(submissionResult.row_number) &&
      row.status === "sent",
  );

  if (sentLogRows.length === 0) {
    throw new Error(
      `No sent email log rows found for ${check.path} row ${submissionResult.row_number}.`,
    );
  }

  const hasRequiredRecipient = sentLogRows.some((row) => row.recipient === requiredRecipient);

  if (!hasRequiredRecipient) {
    throw new Error(
      `No sent email log row matched required recipient ${requiredRecipient} for ${check.path}.`,
    );
  }
}

const health = await assertHealthContract();
const submissionResults = [];

for (const check of checks) {
  // Serialize writes to keep row-number assertions deterministic.
  const result = await submitPathCheck(check);
  submissionResults.push({ check, result });
}

if (!isDryRun) {
  for (const { check, result } of submissionResults) {
    const pathRows = await fetchCsvSheetRows(
      check.expectedSheet,
      "select * order by A desc limit 30",
      `${Date.now()}-${check.path}`,
    );
    assertRecentSheetRow(pathRows, check);

    const emailLogRows = await fetchCsvSheetRows(
      "email_delivery_log",
      "select * order by A desc limit 200",
      `${Date.now()}-${check.path}-log`,
    );
    assertEmailDeliveryLog(emailLogRows, check, result);
  }
}

console.log(
  JSON.stringify(
    {
      ok: true,
      dryRun: isDryRun,
      runTag,
      endpointUrl,
      spreadsheetId,
      requiredRecipient,
      availablePaths: health.available_paths,
      results: submissionResults.map(({ check, result }) => ({
        path: check.path,
        expectedSheet: check.expectedSheet,
        response: result,
      })),
    },
    null,
    2,
  ),
);
