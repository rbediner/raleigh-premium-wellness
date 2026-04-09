import { describe, expect, it } from "vitest";
import {
  FIELD_DEFINITIONS,
  STUDIO_DEVELOPMENT_MANAGER_LABEL,
  buildSubmissionPayload,
  getFieldPresentation,
  getFieldSequence,
  getFormVariantConfig,
} from "../../scripts/site/form-configuration.js";

describe("unified contact form logic", () => {
  it("returns the work-with-us configuration by default", () => {
    expect(getFormVariantConfig("unknown_path").submitLabel).toBe("Start the Conversation");
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

  it("keeps the Studio Development Manager label available for future role-driven flows", () => {
    expect(FIELD_DEFINITIONS.role_interest.options).toContain(STUDIO_DEVELOPMENT_MANAGER_LABEL);
    expect(FIELD_DEFINITIONS.role_interest.options).not.toContain("Manager-Studio Development");
  });

  it("uses partner-specific helper chips without candidate leakage", () => {
    const partnerMessageField = getFieldPresentation("short_message", "partner_with_us", {});

    expect(partnerMessageField.label).toBe("Partnership Idea");
    expect(partnerMessageField.composerChips.map((chip) => chip.label)).toEqual([
      "Partnership idea",
      "Audience/community",
      "Activation concept",
      "Venue/business fit",
    ]);
    expect(partnerMessageField.composerChips.map((chip) => chip.label)).not.toContain("Why I’m interested");
    expect(partnerMessageField.composerChips.map((chip) => chip.label)).not.toContain("Referral opportunity");
  });

  it("keeps the work-with-us path intentionally light for first-touch outreach", () => {
    expect(getFieldSequence("work_with_us")).toEqual([
      "first_name",
      "last_name",
      "email",
      "phone",
      "short_message",
      "city_area",
      "linkedin_url",
      "additional_links",
      "email_follow_up_consent",
    ]);

    const shortMessageField = getFieldPresentation("short_message", "work_with_us", {});
    const additionalLinksField = getFieldPresentation("additional_links", "work_with_us", {});

    expect(shortMessageField.helperText).toBe(
      "Share what sparked your interest, what feels aligned, or anything helpful for a first conversation.",
    );
    expect(shortMessageField.composerChips).toEqual([]);
    expect(additionalLinksField.helperText).toBe(
      "Optional. Feel free to share anything helpful, such as LinkedIn, a portfolio, a personal website, or a short introduction video.",
    );
  });

  it("uses the approved work-with-us consent wording", () => {
    expect(FIELD_DEFINITIONS.email_follow_up_consent.label).toBe(
      "Yes, I’d be glad to hear from you by email about this opportunity.",
    );
  });

  it("uses the approved path-specific success states", () => {
    expect(getFormVariantConfig("work_with_us").successMessage).toBe(
      "Thanks for reaching out. We’ve received your note and will review it carefully. If there looks to be a strong fit, we’ll be in touch about next steps.",
    );
    expect(getFormVariantConfig("partner_with_us").successMessage).toBe(
      "Thanks so much for reaching out. We’re grateful for your interest and excited to learn more about you, your business, and the kind of collaboration you have in mind. We’ll review your note and be back in touch soon.",
    );
    expect(getFormVariantConfig("stay_connected").successMessage).toBe(
      "Thank you so much for joining us early. We’re truly grateful for your interest and excited to keep you in the loop as launch plans take shape. We’ll share updates along the way and let you know as soon as founding-member opportunities become available. If you know someone in your circle who’d want to be part of this early, feel free to share the page with them.",
    );
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

  it("requires only the lighter first-touch work-with-us fields", () => {
    const payload = buildSubmissionPayload("work_with_us", {
      first_name: "Roman",
      last_name: "Bediner",
      email: "roman@example.com",
      short_message: "",
      email_follow_up_consent: false,
    });

    expect(payload.validationErrors).toContain("Short Message is required.");
    expect(payload.validationErrors).toContain(
      "Yes, I’d be glad to hear from you by email about this opportunity. is required.",
    );
    expect(payload.validationErrors).not.toContain("Mobile Phone Number is required.");
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
});
