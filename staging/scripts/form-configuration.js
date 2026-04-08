// This module centralizes the adaptive contact form rules so the site and the
// test suite both read from one source of truth.

export const FORM_VARIANT_CONFIG = {
  work_with_us: {
    introduction:
      "Tell us about yourself or the person you want us to meet. This path supports direct interest and referrals for the Studio Development Manager opportunity.",
    submitLabel: "Share Work With Us Interest",
    successMessage:
      "Thanks. This review-build submission was saved locally on this device and is ready for live Google Sheets wiring once approved.",
    requiredFields: [
      "first_name",
      "last_name",
      "email",
      "phone",
      "self_or_referral",
      "role_interest",
      "short_message",
    ],
    optionalFields: [
      "linkedin_url",
      "portfolio_url",
      "video_intro_url",
      "city_area",
      "instagram_handle",
      "email_follow_up_consent",
      "text_follow_up_consent",
    ],
  },
  partner_with_us: {
    introduction:
      "Use this path if you want to explore local collaboration opportunities with The Tox in Raleigh.",
    submitLabel: "Share Partnership Interest",
    successMessage:
      "Thanks. This review-build submission was saved locally on this device and can be connected to the live follow-up workflow after approval.",
    requiredFields: [
      "first_name",
      "last_name",
      "organization_name",
      "email",
      "phone",
      "partnership_type",
      "short_message",
    ],
    optionalFields: [
      "website_url",
      "instagram_url_or_handle",
      "collaboration_idea",
      "email_follow_up_consent",
      "text_follow_up_consent",
    ],
  },
  stay_connected: {
    introduction:
      "Want to be first in line when pre-sales opens? Sign up below to be notified when a limited number of discounted Founding Member VIP packages become available and to stay connected as we build toward launch in Raleigh.",
    submitLabel: "Stay Connected",
    successMessage:
      "Thanks. This review-build submission was saved locally on this device and represents the future launch-updates flow.",
    requiredFields: [
      "first_name",
      "last_name",
      "email",
      "email_updates_consent",
    ],
    optionalFields: [
      "phone",
      "text_updates_consent",
      "interest_type",
      "short_note",
    ],
  },
};

export const FIELD_DEFINITIONS = {
  first_name: {
    label: "First Name",
    type: "text",
    autocomplete: "given-name",
  },
  last_name: {
    label: "Last Name",
    type: "text",
    autocomplete: "family-name",
  },
  email: {
    label: "Email",
    type: "email",
    autocomplete: "email",
  },
  phone: {
    label: "Phone",
    type: "tel",
    autocomplete: "tel",
  },
  self_or_referral: {
    label: "Are you reaching out for yourself or referring someone?",
    type: "select",
    options: [
      "I am reaching out for myself",
      "I am referring someone else",
    ],
  },
  role_interest: {
    label: "What role are you interested in?",
    type: "select",
    options: [
      "Studio Development Manager",
      "Another future role",
    ],
  },
  short_message: {
    label: "Tell us why this feels like a fit",
    type: "textarea",
  },
  linkedin_url: {
    label: "LinkedIn URL",
    type: "url",
  },
  portfolio_url: {
    label: "Personal Website or Portfolio URL",
    type: "url",
  },
  video_intro_url: {
    label: "Video Introduction URL",
    type: "url",
  },
  city_area: {
    label: "City or Area",
    type: "text",
  },
  instagram_handle: {
    label: "Instagram Handle",
    type: "text",
  },
  organization_name: {
    label: "Business or Organization Name",
    type: "text",
  },
  partnership_type: {
    label: "Partnership Type",
    type: "select",
    options: [
      "Event collaboration",
      "Community partnership",
      "Referral partnership",
      "Brand collaboration",
      "Other",
    ],
  },
  website_url: {
    label: "Website URL",
    type: "url",
  },
  instagram_url_or_handle: {
    label: "Instagram URL or Handle",
    type: "text",
  },
  collaboration_idea: {
    label: "Collaboration Idea",
    type: "textarea",
  },
  email_follow_up_consent: {
    label: "Yes, you may email me about this inquiry.",
    type: "checkbox",
  },
  text_follow_up_consent: {
    label: "Yes, you may text me about this inquiry.",
    type: "checkbox",
  },
  email_updates_consent: {
    label: "I consent to email updates about launch news, pre-sales updates, and Founding Member VIP offers.",
    type: "checkbox",
  },
  text_updates_consent: {
    label: "I consent to text-message updates about launch news, pre-sales updates, and Founding Member VIP offers.",
    type: "checkbox",
  },
  interest_type: {
    label: "Interest Type",
    type: "select",
    options: [
      "Launch updates",
      "VIP updates",
      "General community updates",
    ],
  },
  short_note: {
    label: "Short Note",
    type: "textarea",
  },
};

export function getFormVariantConfig(pathKey) {
  return FORM_VARIANT_CONFIG[pathKey] ?? FORM_VARIANT_CONFIG.work_with_us;
}

export function getFieldSequence(pathKey) {
  const variant = getFormVariantConfig(pathKey);
  return [...variant.requiredFields, ...variant.optionalFields];
}

export function trimOptionalValue(rawValue) {
  if (typeof rawValue !== "string") {
    return rawValue;
  }

  return rawValue.trim();
}

export function normalizeFormValues(rawValues) {
  return Object.fromEntries(
    Object.entries(rawValues).map(([fieldKey, fieldValue]) => [
      fieldKey,
      typeof fieldValue === "string" ? trimOptionalValue(fieldValue) : fieldValue,
    ]),
  );
}

export function validateFormValues(pathKey, rawValues) {
  const normalizedValues = normalizeFormValues(rawValues);
  const variant = getFormVariantConfig(pathKey);
  const validationErrors = [];

  for (const requiredField of variant.requiredFields) {
    const fieldValue = normalizedValues[requiredField];

    if (FIELD_DEFINITIONS[requiredField]?.type === "checkbox") {
      if (!fieldValue) {
        validationErrors.push(`${FIELD_DEFINITIONS[requiredField].label} is required.`);
      }
      continue;
    }

    if (!fieldValue) {
      validationErrors.push(`${FIELD_DEFINITIONS[requiredField].label} is required.`);
    }
  }

  if (normalizedValues.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedValues.email)) {
    validationErrors.push("Email format must be valid.");
  }

  if (normalizedValues.phone && !/^[0-9()\-\s+.]{7,}$/.test(normalizedValues.phone)) {
    validationErrors.push("Phone format must be valid when provided.");
  }

  return {
    normalizedValues,
    validationErrors,
  };
}

export function buildSubmissionPayload(pathKey, rawValues) {
  const { normalizedValues, validationErrors } = validateFormValues(pathKey, rawValues);

  return {
    interestPath: pathKey,
    formLabel: getFormVariantConfig(pathKey).submitLabel,
    normalizedValues,
    validationErrors,
  };
}
