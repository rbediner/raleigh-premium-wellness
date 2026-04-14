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

function loadAppsScriptContext(overrides = {}) {
  // Mirror just enough of the Apps Script runtime so we can verify the gateway
  // logic locally without depending on a live Google deployment.
  const appendRow = vi.fn();
  const sendEmail = vi.fn();
  const setValues = vi.fn();
  const setFrozenRows = vi.fn();
  const sheet = {
    name: "work_with_us",
    lastRow: 1,
    getName() {
      return this.name;
    },
    getLastRow() {
      return this.lastRow;
    },
    appendRow(rowValues) {
      appendRow(rowValues);
      this.lastRow += 1;
    },
    getRange: vi.fn(() => ({
      getDisplayValues: () => [[]],
      setValues,
    })),
    setFrozenRows,
    ...overrides.sheet,
  };

  const spreadsheet = {
    getSheetByName: vi.fn(() => sheet),
    insertSheet: vi.fn(() => sheet),
    getSpreadsheetTimeZone: vi.fn(() => "America/New_York"),
    ...overrides.spreadsheet,
  };

  const context = {
    console,
    JSON,
    Date: class FixedDate extends Date {
      constructor(...args) {
        super(args.length ? args[0] : "2026-04-13T20:00:00.000Z");
      }
      static now() {
        return new Date("2026-04-13T20:00:00.000Z").getTime();
      }
    },
    SpreadsheetApp: {
      openById: vi.fn(() => spreadsheet),
    },
    Utilities: {
      formatDate: vi.fn((dateValue, _timeZone, format) => {
        if (format === "yyyy-MM-dd") {
          return "2026-04-13";
        }
        if (format === "HH:mm:ss") {
          return "16:00:00";
        }
        return String(dateValue);
      }),
    },
    MailApp: {
      sendEmail,
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
  // Execute the checked-in Apps Script file as-is so tests cover the real
  // deployed logic rather than a duplicated helper implementation.
  vm.runInContext(codeSource, context);

  return {
    appendRow,
    sendEmail,
    setValues,
    setFrozenRows,
    sheet,
    spreadsheet,
    context,
  };
}

describe("google sheets submission gateway", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("appends the submission row and sends a notification after success", () => {
    const { appendRow, sendEmail, context } = loadAppsScriptContext();

    const responseBody = context.writeSubmissionRow({
      path: "work_with_us",
      normalized_values: {
        first_name: "Roman",
        last_name: "Bediner",
        email: "roman@example.com",
        short_message: "Happy to help launch this.",
        email_follow_up_consent: true,
      },
      source_url: "https://rbediner.github.io/raleigh-premium-wellness/staging/?interestPath=work_with_us#contact",
      is_test_submission: false,
    });

    expect(appendRow).toHaveBeenCalledTimes(1);
    expect(appendRow.mock.calls[0][0].slice(0, 6)).toEqual([
      "2026-04-13T20:00:00.000Z",
      "2026-04-13",
      "16:00:00",
      "work_with_us",
      "https://rbediner.github.io/raleigh-premium-wellness/staging/?interestPath=work_with_us#contact",
      "FALSE",
    ]);
    expect(responseBody).toMatchObject({
      ok: true,
      sheet_name: "work_with_us",
      row_number: 2,
      notification_email_sent: true,
    });
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "roman.bediner+thetox@cormanity.com",
        name: "Raleigh Premium Wellness Intake",
        subject: "New Raleigh Premium Wellness inquiry: Work With Us",
      }),
    );
    expect(sendEmail.mock.calls[0][0].body).toContain("First Name: Roman");
    expect(sendEmail.mock.calls[0][0].body).toContain("Short Message: Happy to help launch this.");
  });

  it("does not send the notification email if the row append fails", () => {
    const appendFailure = new Error("Sheet write failed.");
    const { sendEmail, context } = loadAppsScriptContext({
      sheet: {
        appendRow: () => {
          throw appendFailure;
        },
      },
    });

    expect(() =>
      context.writeSubmissionRow({
        path: "partner_with_us",
        normalized_values: {
          first_name: "Roman",
        },
      }),
    ).toThrow("Sheet write failed.");
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("keeps the submission successful even if the email notification fails", () => {
    const { context } = loadAppsScriptContext({
      sheet: {
        name: "stay_connected",
      },
      context: {
        MailApp: {
          sendEmail: vi.fn(() => {
            throw new Error("Mailbox unavailable.");
          }),
        },
      },
    });

    const responseBody = context.writeSubmissionRow({
      path: "stay_connected",
      normalized_values: {
        first_name: "Marianna",
        email: "marianna@example.com",
        email_updates_consent: true,
      },
      is_test_submission: true,
    });

    expect(responseBody).toMatchObject({
      ok: true,
      sheet_name: "stay_connected",
      row_number: 2,
      notification_email_sent: false,
      notification_email_error: "Mailbox unavailable.",
    });
  });
});
