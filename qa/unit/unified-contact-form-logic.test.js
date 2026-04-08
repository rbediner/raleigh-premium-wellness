import { describe, expect, it } from "vitest";
import {
  buildSubmissionPayload,
  getFieldSequence,
  getFormVariantConfig,
} from "../../scripts/site/form-configuration.js";

describe("unified contact form logic", () => {
  it("returns the work-with-us configuration by default", () => {
    expect(getFormVariantConfig("unknown_path").submitLabel).toBe(
      "Share Work With Us Interest",
    );
  });

  it("lists stay-connected required fields before optional fields", () => {
    expect(getFieldSequence("stay_connected")).toEqual([
      "first_name",
      "last_name",
      "email",
      "email_updates_consent",
      "phone",
      "text_updates_consent",
      "interest_type",
      "short_note",
    ]);
  });

  it("trims values and validates email formatting", () => {
    const payload = buildSubmissionPayload("partner_with_us", {
      first_name: " Roman ",
      last_name: " Bediner ",
      organization_name: "The Tox Circle",
      email: "not-an-email",
      phone: "919-555-0100",
      partnership_type: "Community partnership",
      short_message: "Interested in collaborating.",
    });

    expect(payload.normalizedValues.first_name).toBe("Roman");
    expect(payload.validationErrors).toContain("Email format must be valid.");
  });

  it("requires email consent for stay-connected submissions", () => {
    const payload = buildSubmissionPayload("stay_connected", {
      first_name: "Marianna",
      last_name: "Bediner",
      email: "marianna@example.com",
      email_updates_consent: false,
    });

    expect(payload.validationErrors).toContain(
      "I consent to email updates about launch news, pre-sales updates, and Founding Member VIP offers. is required.",
    );
  });
});
