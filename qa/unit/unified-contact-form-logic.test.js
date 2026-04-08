import { describe, expect, it } from "vitest";
import {
  buildSubmissionPayload,
  getFieldSequence,
  getFormVariantConfig,
  shouldRequireReferralPermission,
} from "../../scripts/site/form-configuration.js";

describe("unified contact form logic", () => {
  it("returns the work-with-us configuration by default", () => {
    expect(getFormVariantConfig("unknown_path").submitLabel).toBe(
      "Start the Conversation",
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
      organization_name: "Bediner Wellness Circle",
      email: "not-an-email",
      phone: "919-555-0100",
      partnership_type: "Community partnership",
      short_message: "Interested in collaborating.",
    });

    expect(payload.normalizedValues.first_name).toBe("Roman");
    expect(payload.validationErrors).toContain("Email Address must be a valid email address.");
  });

  it("requires email consent for stay-connected submissions", () => {
    const payload = buildSubmissionPayload("stay_connected", {
      first_name: "Marianna",
      last_name: "Bediner",
      email: "marianna@example.com",
      email_updates_consent: false,
    });

    expect(payload.validationErrors).toContain(
      "Yes, I’d like to receive email updates about launch news, pre-sales, and Founding Member VIP offers. is required.",
    );
  });

  it("adds the referral permission checkbox only when referred-person information is present", () => {
    expect(
      shouldRequireReferralPermission({
        referred_first_name: "",
        referred_email: "",
      }),
    ).toBe(false);

    expect(
      shouldRequireReferralPermission({
        referred_first_name: "Alex",
      }),
    ).toBe(true);
  });

  it("requires referral permission only when referred-person details are supplied", () => {
    const payload = buildSubmissionPayload("work_with_us", {
      first_name: "Roman",
      last_name: "Bediner",
      email: "roman@example.com",
      phone: "919-555-0100",
      self_or_referral: "I’d like to refer someone",
      role_interest: "Manager-Studio Development",
      referral_reason: "Trusted connector with strong local credibility.",
      referred_email: "candidate@example.com",
      email_follow_up_consent: true,
      text_follow_up_consent: true,
      referral_permission_confirmed: false,
    });

    expect(payload.validationErrors).toContain(
      "I confirm I have this person’s permission to share their contact information. is required.",
    );
  });
});
