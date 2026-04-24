import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";

import { beforeEach, describe, expect, it, vi } from "vitest";

const codePath = path.resolve(
  process.cwd(),
  "integrations",
  "google-sheets-submissions",
  "Code.js",
);
const codeSource = readFileSync(codePath, "utf8");

function createFakeSheet(name) {
  const rowStore = [[""]];

  return {
    name,
    rowStore,
    getName() {
      return this.name;
    },
    getLastRow() {
      return rowStore.length;
    },
    appendRow(rowValues) {
      rowStore.push(rowValues);
    },
    getRange: vi.fn((row, column, _numRows, numColumns) => ({
      getDisplayValues: () => {
        const headerRow = rowStore[0] || [];
        const values = [];

        for (let index = 0; index < numColumns; index += 1) {
          values.push(headerRow[column - 1 + index] || "");
        }

        return [values];
      },
      setValues: (values) => {
        rowStore[row - 1] = values[0];
      },
    })),
    setFrozenRows: vi.fn(),
    getDataRange: vi.fn(() => ({
      getDisplayValues: () => rowStore,
    })),
  };
}

function loadAppsScriptContext(overrides = {}) {
  const sheetsByName = new Map(
    Object.entries(overrides.initialSheets || {}).map(([sheetName, fakeSheet]) => [sheetName, fakeSheet]),
  );

  const spreadsheet = {
    getSheetByName: vi.fn((sheetName) => sheetsByName.get(sheetName) || null),
    insertSheet: vi.fn((sheetName) => {
      const fakeSheet = createFakeSheet(sheetName);
      sheetsByName.set(sheetName, fakeSheet);
      return fakeSheet;
    }),
    getSpreadsheetTimeZone: vi.fn(() => "America/New_York"),
    ...overrides.spreadsheet,
  };

  const context = {
    console,
    JSON,
    Date: class FixedDate extends Date {
      constructor(...args) {
        super(args.length ? args[0] : "2026-04-24T17:59:09.444Z");
      }
      static now() {
        return new Date("2026-04-24T17:59:09.444Z").getTime();
      }
    },
    SpreadsheetApp: {
      openById: vi.fn(() => spreadsheet),
    },
    Utilities: {
      formatDate: vi.fn((_dateValue, _timeZone, format) => {
        if (format === "yyyy-MM-dd") {
          return "2026-04-24";
        }
        if (format === "HH:mm:ss") {
          return "13:59:09";
        }
        return "";
      }),
    },
    GmailApp: {
      sendEmail: vi.fn(() => {
        throw new Error("Missing Gmail scope");
      }),
    },
    MailApp: {
      sendEmail: vi.fn(),
    },
    ContentService: {
      MimeType: {
        JSON: "application/json",
      },
      createTextOutput: vi.fn((body) => ({
        body,
        setMimeType: vi.fn(function setMimeType() {
          return this;
        }),
      })),
    },
    ...overrides.context,
  };

  vm.createContext(context);
  vm.runInContext(codeSource, context);

  return {
    context,
    spreadsheet,
    sheetsByName,
  };
}

describe("google sheets submission gateway", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("routes test submissions into dedicated _test tabs", () => {
    const { context } = loadAppsScriptContext();

    const responseBody = context.writeSubmissionRow({
      path: "work_with_us",
      normalized_values: {
        first_name: "Smoke",
        last_name: "Test",
        email: "qa@example.com",
        phone: "9195551111",
        short_message: "test path",
        city_area: "Raleigh",
        linkedin_url: "",
        additional_links: "",
        email_follow_up_consent: true,
      },
      source_url: "https://staging.local/?test=1",
      is_test_submission: true,
    });

    expect(responseBody).toMatchObject({
      ok: true,
      sheet_name: "test_submissions",
      notification_email_sent: true,
    });
  });

  it("keeps non-test submissions in production tabs", () => {
    const { context } = loadAppsScriptContext();

    const responseBody = context.writeSubmissionRow({
      path: "partner_with_us",
      normalized_values: {
        first_name: "Real",
        last_name: "User",
        organization_name: "Partner Org",
        email: "real@example.com",
        phone: "9195552222",
        partnership_type: "local_business",
        short_message: "real path",
        email_follow_up_consent: true,
      },
      source_url: "https://staging.local/",
      is_test_submission: false,
    });

    expect(responseBody).toMatchObject({
      ok: true,
      sheet_name: "partner_with_us",
      notification_email_sent: true,
    });
  });

  it("normalizes legacy stay_connected path to find_out_whats_coming and keeps tab continuity", () => {
    const { context } = loadAppsScriptContext();

    const response = context.doPost({
      postData: {
        contents: JSON.stringify({
          path: "stay_connected",
          normalized_values: {
            first_name: "Legacy",
            last_name: "User",
            email: "legacy@example.com",
            phone: "9195553333",
            email_updates_consent: true,
          },
          source_url: "https://staging.local/",
          is_test_submission: true,
        }),
      },
    });

    const parsed = JSON.parse(response.body);

    expect(parsed).toMatchObject({
      ok: true,
      sheet_name: "test_submissions",
      notification_email_sent: true,
    });
  });

  it("records email delivery diagnostics and reports failure if all providers fail", () => {
    const { context } = loadAppsScriptContext({
      context: {
        GmailApp: {
          sendEmail: vi.fn(() => {
            throw new Error("GmailApp hard failure");
          }),
        },
        MailApp: {
          sendEmail: vi.fn(() => {
            throw new Error("MailApp hard failure");
          }),
        },
      },
    });

    const responseBody = context.writeSubmissionRow({
      path: "find_out_whats_coming",
      normalized_values: {
        first_name: "Failure",
        last_name: "Case",
        email: "failure@example.com",
        phone: "9195554444",
        email_updates_consent: true,
      },
      source_url: "https://staging.local/",
      is_test_submission: true,
    });

    expect(responseBody).toMatchObject({
      ok: true,
      sheet_name: "test_submissions",
      notification_email_sent: false,
    });
    expect(responseBody.notification_email_error).toContain("MailApp hard failure");
  });

  it("exposes only current public paths in doGet health metadata", () => {
    const { context } = loadAppsScriptContext();
    const response = context.doGet();
    const parsed = JSON.parse(response.body);

    expect(parsed.available_paths).toEqual([
      "work_with_us",
      "partner_with_us",
      "find_out_whats_coming",
    ]);
  });
});
