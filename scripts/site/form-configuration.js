export const GOOGLE_SHEET_TARGET_URL =
  "https://docs.google.com/spreadsheets/d/1rRNeWWqNsdbr1kuwpQfzuFWHaIAXx--MfyhgdhDyWV0/edit?usp=sharing";

export const EMAIL_NOTIFICATION_TARGET = "roman.bediner@thetox.com";
export const WORK_SELF_OPTION = "I’m interested for myself";
export const WORK_REFERRAL_OPTION = "I’d like to refer someone";
export const STUDIO_DEVELOPMENT_MANAGER_LABEL = "Studio Development Manager";

export const FORM_VARIANT_CONFIG = {
  work_with_us: {
    introduction:
      "If you see yourself in this opportunity, or someone came to mind while reading about it, we’d love to hear from you. Share a few details below and we’ll take it from there.",
    submitLabel: "Start the Conversation",
    successMessage:
      "Thank you. Your message has been saved for this review build, and we’ll be ready to connect the live follow-up flow next.",
  },
  partner_with_us: {
    introduction:
      "If you see an opportunity to collaborate, host something together, or introduce us to your community, we’d love to hear from you. Share a few details below and let’s explore it.",
    submitLabel: "Explore a Partnership",
    successMessage:
      "Thank you. Your partnership note has been saved for this review build.",
  },
  stay_connected: {
    introduction:
      "Want to be first in line when pre-sales opens? Sign up below to be notified when a limited number of discounted Founding Member VIP packages become available and to stay connected as we build toward launch in Raleigh.",
    submitLabel: "Join the List",
    successMessage:
      "Thank you. Your early-access note has been saved for this review build.",
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
    label: "Email Address",
    type: "email",
    autocomplete: "email",
  },
  phone: {
    label: "Mobile Phone Number",
    type: "tel",
    autocomplete: "tel",
  },
  self_or_referral: {
    label: "Are you reaching out for yourself or referring someone?",
    type: "select",
    options: [WORK_SELF_OPTION, WORK_REFERRAL_OPTION],
  },
  role_interest: {
    label: "Role of Interest",
    type: "select",
    options: [
      STUDIO_DEVELOPMENT_MANAGER_LABEL,
      "Front of House (FOH) Team Member",
      "Licensed Esthetician Opportunity",
    ],
  },
  short_message: {
    label: "Short Message",
    type: "textarea",
    helperText: "A few thoughtful details are plenty.",
    composerChips: [],
  },
  city_area: {
    label: "City / Area",
    type: "text",
  },
  linkedin_url: {
    label: "LinkedIn URL",
    type: "url",
  },
  portfolio_url: {
    label: "Personal Website / Portfolio URL",
    type: "url",
  },
  video_intro_url: {
    label: "Video Introduction URL",
    type: "url",
  },
  social_media_link: {
    label: "Social Media Link",
    type: "url",
  },
  referral_reason: {
    label: "Why do you think this person would be a great fit?",
    type: "textarea",
    helperText: "Share what stands out about this person and why they came to mind.",
    composerChips: [
      {
        label: "How I know them",
        text: "I know them through ",
      },
      {
        label: "Why they stand out",
        text: "They stand out because ",
      },
      {
        label: "Community credibility",
        text: "They’re well regarded in the community because ",
      },
    ],
  },
  referred_first_name: {
    label: "Referred Person First Name",
    type: "text",
  },
  referred_last_name: {
    label: "Referred Person Last Name",
    type: "text",
  },
  referred_email: {
    label: "Referred Person Email Address",
    type: "email",
  },
  referred_phone: {
    label: "Referred Person Mobile Phone Number",
    type: "tel",
  },
  referred_city_area: {
    label: "Referred Person City / Area",
    type: "text",
  },
  referred_linkedin_url: {
    label: "Referred Person LinkedIn URL",
    type: "url",
  },
  referred_portfolio_url: {
    label: "Referred Person Personal Website / Portfolio URL",
    type: "url",
  },
  referred_video_intro_url: {
    label: "Referred Person Video Introduction URL",
    type: "url",
  },
  referred_social_media_link: {
    label: "Referred Person Social Media Link",
    type: "url",
  },
  referral_permission_confirmed: {
    label: "I confirm I have this person’s permission to share their contact information.",
    type: "checkbox",
  },
  organization_name: {
    label: "Business / Organization Name",
    type: "text",
  },
  partnership_type: {
    label: "Partnership Type",
    type: "select",
    options: [
      "Community partnership",
      "Event collaboration",
      "Referral partnership",
      "Wellness collaboration",
      "Other",
    ],
  },
  website_url: {
    label: "Website URL",
    type: "url",
  },
  collaboration_idea: {
    label: "Collaboration Idea",
    type: "textarea",
    helperText: "Outline the idea, audience, or format you have in mind.",
    composerChips: [],
  },
  short_note: {
    label: "Short Note",
    type: "textarea",
    helperText: "Optional, but helpful if you want to share what interests you most.",
    composerChips: [
      {
        label: "Founding Member VIP",
        text: "I’m most interested in Founding Member VIP because ",
      },
      {
        label: "Launch updates",
        text: "I’d like updates about ",
      },
    ],
  },
  interest_type: {
    label: "Interest Type",
    type: "select",
    options: ["Founding Member VIP", "Launch updates", "General early access"],
  },
  email_follow_up_consent: {
    label: "Yes, you may email me about this inquiry.",
    type: "checkbox",
  },
  text_follow_up_consent: {
    label: "Yes, you may text me about this inquiry.",
    type: "checkbox",
    helperText: "Message frequency varies. Message and data rates may apply. Reply STOP to opt out.",
  },
  email_updates_consent: {
    label:
      "Yes, I’d like to receive email updates about launch news, pre-sales, and Founding Member VIP offers.",
    type: "checkbox",
  },
  text_updates_consent: {
    label:
      "Yes, I agree to receive text messages about launch updates, pre-sales, and Founding Member VIP offers.",
    type: "checkbox",
    helperText: "Message frequency varies. Message and data rates may apply. Reply STOP to opt out.",
  },
};

export function getFieldPresentation(fieldKey, pathKey, currentValues = {}) {
  const baseField = FIELD_DEFINITIONS[fieldKey];

  if (!baseField) {
    return undefined;
  }

  const isWorkReferral = pathKey === "work_with_us" && currentValues.self_or_referral === WORK_REFERRAL_OPTION;

  if (pathKey === "partner_with_us") {
    if (fieldKey === "short_message") {
      return {
        ...baseField,
        label: "Partnership Idea",
        helperText: "Share the collaboration, introduction, or activation you have in mind.",
        composerChips: [
          { label: "Partnership idea", text: "Partnership idea: " },
          { label: "Audience/community", text: "Audience/community: " },
          { label: "Activation concept", text: "Activation concept: " },
          { label: "Venue/business fit", text: "Venue/business fit: " },
        ],
      };
    }

    if (fieldKey === "collaboration_idea") {
      return {
        ...baseField,
        label: "Additional Details",
        helperText: "Optional if you want to outline timing, logistics, or what would make this a strong fit.",
        composerChips: [
          { label: "Timing", text: "Timing: " },
          { label: "What success looks like", text: "What success looks like: " },
        ],
      };
    }
  }

  if (pathKey === "work_with_us" && !isWorkReferral) {
    if (fieldKey === "short_message") {
      return {
        ...baseField,
        helperText: "Share what sparked your interest, what feels aligned, or anything helpful for a first conversation.",
        composerChips: [
          { label: "Why I’m interested", text: "I’m interested because " },
          { label: "Community connection", text: "I’m connected to Raleigh through " },
          { label: "Relevant experience", text: "Relevant experience: " },
        ],
      };
    }
  }

  if (isWorkReferral) {
    const referringPersonLabels = {
      first_name: "Your First Name",
      last_name: "Your Last Name",
      email: "Your Email Address",
      phone: "Your Mobile Phone Number",
    };

    if (referringPersonLabels[fieldKey]) {
      return {
        ...baseField,
        label: referringPersonLabels[fieldKey],
      };
    }
  }

  return baseField;
}

export function getFormVariantConfig(pathKey, currentValues = {}) {
  const baseVariant = FORM_VARIANT_CONFIG[pathKey] ?? FORM_VARIANT_CONFIG.work_with_us;

  if (pathKey === "work_with_us" && currentValues.self_or_referral === WORK_REFERRAL_OPTION) {
    return {
      ...baseVariant,
      introduction:
        "If someone came to mind while reading this, share a few details below and tell us why they feel like the right fit. We’d love strong referrals from the community.",
      submitLabel: "Share a Referral",
      successMessage:
        "Thank you. Your referral has been saved for this review build, and we’ll be ready to follow up thoughtfully.",
    };
  }

  return baseVariant;
}

export function getFieldGroups(pathKey, currentValues = {}) {
  if (pathKey === "partner_with_us") {
    return [
      {
        key: "partner_core",
        label: "Partnership Details",
        fields: [
          "first_name",
          "last_name",
          "organization_name",
          "email",
          "phone",
          "partnership_type",
          "short_message",
          "website_url",
          "social_media_link",
          "collaboration_idea",
          "email_follow_up_consent",
          "text_follow_up_consent",
        ],
      },
    ];
  }

  if (pathKey === "stay_connected") {
    return [
      {
        key: "stay_connected",
        label: "Stay Connected",
        fields: [
          "first_name",
          "last_name",
          "email",
          "email_updates_consent",
          "phone",
          "text_updates_consent",
          "interest_type",
          "short_note",
        ],
      },
    ];
  }

  const isReferral = currentValues.self_or_referral === WORK_REFERRAL_OPTION;
  const showPermissionCheckbox = shouldRequireReferralPermission(currentValues);

  const groups = [
    {
      key: "work_core",
      label: isReferral ? "Referring Person Details" : "Your Details",
      fields: [
        "first_name",
        "last_name",
        "email",
        "phone",
        "self_or_referral",
        "role_interest",
      ],
    },
  ];

  if (!isReferral) {
    groups.push({
      key: "work_self",
      label: "A Few Helpful Details",
      fields: [
        "short_message",
        "city_area",
        "linkedin_url",
        "portfolio_url",
        "video_intro_url",
        "social_media_link",
        "email_follow_up_consent",
        "text_follow_up_consent",
      ],
    });

    return groups;
  }

  groups.push({
    key: "work_referral_reason",
    label: "Why They Came to Mind",
    fields: [
      "referral_reason",
      "email_follow_up_consent",
      "text_follow_up_consent",
    ],
  });

  groups.push({
    key: "work_referred_person",
    label: "About the Person You’re Referring",
    fields: [
      "referred_first_name",
      "referred_last_name",
      "referred_email",
      "referred_phone",
      "referred_city_area",
      "referred_linkedin_url",
      "referred_portfolio_url",
      "referred_video_intro_url",
      "referred_social_media_link",
      ...(showPermissionCheckbox ? ["referral_permission_confirmed"] : []),
    ],
  });

  return groups;
}

export function getFieldSequence(pathKey, currentValues = {}) {
  return getFieldGroups(pathKey, currentValues).flatMap((group) => group.fields);
}

export function shouldRequireReferralPermission(currentValues = {}) {
  return [
    "referred_first_name",
    "referred_last_name",
    "referred_email",
    "referred_phone",
    "referred_city_area",
    "referred_linkedin_url",
    "referred_portfolio_url",
    "referred_video_intro_url",
    "referred_social_media_link",
  ].some((fieldKey) => {
    const fieldValue = currentValues[fieldKey];
    return typeof fieldValue === "string" && fieldValue.trim().length > 0;
  });
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

export function getRequiredFields(pathKey, currentValues = {}) {
  if (pathKey === "partner_with_us") {
    return [
      "first_name",
      "last_name",
      "organization_name",
      "email",
      "phone",
      "partnership_type",
      "short_message",
    ];
  }

  if (pathKey === "stay_connected") {
    return ["first_name", "last_name", "email", "email_updates_consent"];
  }

  const workRequiredFields = [
    "first_name",
    "last_name",
    "email",
    "phone",
    "self_or_referral",
    "role_interest",
    "email_follow_up_consent",
    "text_follow_up_consent",
  ];

  if (currentValues.self_or_referral === WORK_REFERRAL_OPTION) {
    workRequiredFields.push("referral_reason");
    if (shouldRequireReferralPermission(currentValues)) {
      workRequiredFields.push("referral_permission_confirmed");
    }
  } else {
    workRequiredFields.push("short_message");
  }

  return workRequiredFields;
}

function validateEmail(fieldLabel, fieldValue, validationErrors) {
  if (fieldValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fieldValue)) {
    validationErrors.push(`${fieldLabel} must be a valid email address.`);
  }
}

function validatePhone(fieldLabel, fieldValue, validationErrors) {
  if (fieldValue && !/^\+?[0-9()\-\s.]{10,}$/.test(fieldValue)) {
    validationErrors.push(`${fieldLabel} must be a valid phone number.`);
  }
}

function validateUrl(fieldLabel, fieldValue, validationErrors) {
  if (!fieldValue) {
    return;
  }

  try {
    new URL(fieldValue);
  } catch {
    validationErrors.push(`${fieldLabel} must be a valid URL.`);
  }
}

export function validateFormValues(pathKey, rawValues) {
  const normalizedValues = normalizeFormValues(rawValues);
  const requiredFields = getRequiredFields(pathKey, normalizedValues);
  const validationErrors = [];

  for (const requiredField of requiredFields) {
    const fieldValue = normalizedValues[requiredField];
    const fieldDefinition = getFieldPresentation(requiredField, pathKey, normalizedValues);

    if (fieldDefinition?.type === "checkbox") {
      if (!fieldValue) {
        validationErrors.push(`${fieldDefinition.label} is required.`);
      }
      continue;
    }

    if (!fieldValue || (typeof fieldValue === "string" && fieldValue.trim().length === 0)) {
      validationErrors.push(`${fieldDefinition.label} is required.`);
    }
  }

  for (const [fieldKey, fieldValue] of Object.entries(normalizedValues)) {
    const fieldDefinition = getFieldPresentation(fieldKey, pathKey, normalizedValues);

    if (!fieldDefinition) {
      continue;
    }

    if (fieldDefinition.type === "email") {
      validateEmail(fieldDefinition.label, fieldValue, validationErrors);
    }

    if (fieldDefinition.type === "tel") {
      validatePhone(fieldDefinition.label, fieldValue, validationErrors);
    }

    if (fieldDefinition.type === "url") {
      validateUrl(fieldDefinition.label, fieldValue, validationErrors);
    }
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
    formLabel: getFormVariantConfig(pathKey, normalizedValues).submitLabel,
    normalizedValues,
    validationErrors,
    integrationHooks: {
      googleSheetsTarget: GOOGLE_SHEET_TARGET_URL,
      emailNotificationTarget: EMAIL_NOTIFICATION_TARGET,
      analyticsEvents: [
        "page_load",
        "hero_cta_click",
        "nav_click",
        "form_path_selection",
        "form_submission_success",
      ],
    },
  };
}
