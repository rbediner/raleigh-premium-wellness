import {
  FIELD_DEFINITIONS,
  WORK_REFERRAL_OPTION,
  WORK_SELF_OPTION,
  STUDIO_DEVELOPMENT_MANAGER_LABEL,
  buildSubmissionPayload,
  getFieldGroups,
  getFieldPresentation,
  getRequiredFields,
  getFormVariantConfig,
} from "./form-configuration.js";

const contactFormElement = document.querySelector("#unified-contact-form");
const formFieldGridElement = document.querySelector("#form-field-grid");
const formIntroductionElement = document.querySelector("#form-introduction");
const formStatusMessageElement = document.querySelector("#form-status-message");
const submitButtonElement = document.querySelector("#contact-submit-button");
const observedSections = document.querySelectorAll("main section[id]");
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const siteNavigationElement = document.querySelector(".site-navigation");
const mobileMenuButtonElement = document.querySelector(".site-navigation__menu-button");
const mobileMenuScrimElement = document.querySelector(".site-navigation__scrim");
const mobileMenuLinksElement = document.querySelector("#site-navigation-links");
const prototypeStorageKey = "raleigh-premium-wellness-prototype-submissions";

let currentFormValues = {
  interestPath: "work_with_us",
  self_or_referral: WORK_SELF_OPTION,
  role_interest: STUDIO_DEVELOPMENT_MANAGER_LABEL,
};

function setMobileMenuState(isOpen) {
  if (!mobileMenuButtonElement || !mobileMenuLinksElement || !mobileMenuScrimElement) {
    return;
  }

  mobileMenuButtonElement.setAttribute("aria-expanded", String(isOpen));
  mobileMenuLinksElement.dataset.menuState = isOpen ? "open" : "closed";
  mobileMenuScrimElement.hidden = !isOpen;
  document.body.classList.toggle("body--menu-open", isOpen);
}

function closeMobileMenu() {
  setMobileMenuState(false);
}

function toggleMobileMenu() {
  const isExpanded = mobileMenuButtonElement?.getAttribute("aria-expanded") === "true";
  setMobileMenuState(!isExpanded);
}

function trackEvent(eventName, eventData = {}) {
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({
    event: eventName,
    ...eventData,
  });
}

function escapeHtml(rawValue = "") {
  return String(rawValue)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function readCurrentFormValues() {
  const formData = new FormData(contactFormElement);
  const formValues = {};

  for (const [fieldKey, fieldValue] of formData.entries()) {
    formValues[fieldKey] = fieldValue;
  }

  for (const checkboxElement of contactFormElement.querySelectorAll('input[type="checkbox"]')) {
    formValues[checkboxElement.name] = checkboxElement.checked;
  }

  return formValues;
}

function setStatusMessage(message, status) {
  formStatusMessageElement.textContent = message;
  formStatusMessageElement.dataset.status = status;
}

function buildRequiredMarker(fieldKey, isRequired) {
  if (!isRequired) {
    return "";
  }

  const fieldDefinition = getFieldPresentation(fieldKey, currentFormValues.interestPath, currentFormValues);
  if (fieldDefinition.type === "checkbox") {
    return "";
  }
  const requiredIndicatorText = fieldDefinition.requiredIndicatorText ?? "*";

  return ` <span class="field-required-note">${escapeHtml(requiredIndicatorText)}</span>`;
}

function buildComposerChips(fieldKey) {
  const fieldDefinition = getFieldPresentation(fieldKey, currentFormValues.interestPath, currentFormValues);
  const composerChips = fieldDefinition.composerChips ?? [];

  if (composerChips.length === 0) {
    return "";
  }

  const chipsMarkup = composerChips
    .map(
      (chip) => `
        <button
          type="button"
          class="composer-chip"
          data-composer-chip="${fieldKey}"
          data-chip-text="${escapeHtml(chip.text)}"
        >
          ${escapeHtml(chip.label)}
        </button>
      `,
    )
    .join("");

  return `
    <div class="composer-chip-row" aria-label="${escapeHtml(fieldDefinition.label)} suggestions">
      ${chipsMarkup}
    </div>
  `;
}

function autoResizeTextarea(textareaElement) {
  if (!(textareaElement instanceof HTMLTextAreaElement)) {
    return;
  }

  textareaElement.style.height = "auto";
  textareaElement.style.height = `${textareaElement.scrollHeight}px`;
}

function createFieldMarkup(fieldKey, currentValue, validationMessage, isRequired) {
  const field = getFieldPresentation(fieldKey, currentFormValues.interestPath, currentFormValues);
  const fieldClassName =
    field.type === "textarea" || field.type === "checkbox" ? "form-field form-field--full" : "form-field";
  const helperMarkup = field.helperText
    ? `<p class="${field.type === "checkbox" ? "form-checkbox__helper" : "form-field__helper"}">${escapeHtml(field.helperText)}</p>`
    : "";
  const errorMarkup = validationMessage
    ? `<p class="form-field__error" data-field-error="${fieldKey}">${escapeHtml(validationMessage)}</p>`
    : "";
  const requiredLabel = buildRequiredMarker(fieldKey, isRequired);

  if (field.type === "select") {
    const optionMarkup = field.options
      .map((optionValue) => {
        const isSelected = currentValue === optionValue ? "selected" : "";
        return `<option value="${escapeHtml(optionValue)}" ${isSelected}>${escapeHtml(optionValue)}</option>`;
      })
      .join("");

    return `
      <div class="${fieldClassName}">
        <label for="${fieldKey}">${escapeHtml(field.label)}${requiredLabel}</label>
        <select id="${fieldKey}" name="${fieldKey}">
          <option value="">Select an option</option>
          ${optionMarkup}
        </select>
        ${helperMarkup}
        ${errorMarkup}
      </div>
    `;
  }

  if (field.type === "checkbox") {
    const isChecked = currentValue ? "checked" : "";
    return `
      <div class="${fieldClassName}">
        <div class="form-checkbox">
          <label for="${fieldKey}">
            <input id="${fieldKey}" name="${fieldKey}" type="checkbox" ${isChecked} />
            <span class="form-checkbox__copy">
              <span class="form-checkbox__label-text">${escapeHtml(field.label)}</span>${requiredLabel}
            </span>
          </label>
          ${helperMarkup}
          ${errorMarkup}
        </div>
      </div>
    `;
  }

  if (field.type === "textarea") {
    return `
      <div class="${fieldClassName}">
        <label for="${fieldKey}">${escapeHtml(field.label)}${requiredLabel}</label>
        ${buildComposerChips(fieldKey)}
        <textarea
          id="${fieldKey}"
          name="${fieldKey}"
          class="form-textarea"
          aria-invalid="${validationMessage ? "true" : "false"}"
        >${escapeHtml(currentValue ?? "")}</textarea>
        ${helperMarkup}
        ${errorMarkup}
      </div>
    `;
  }

  return `
    <div class="${fieldClassName}">
      <label for="${fieldKey}">${escapeHtml(field.label)}${requiredLabel}</label>
      <input
        id="${fieldKey}"
        name="${fieldKey}"
        type="${field.type}"
        value="${escapeHtml(currentValue ?? "")}"
        ${field.autocomplete ? `autocomplete="${field.autocomplete}"` : ""}
        aria-invalid="${validationMessage ? "true" : "false"}"
      />
      ${helperMarkup}
      ${errorMarkup}
    </div>
  `;
}

function getFieldValidationMap(pathKey, currentValues) {
  const submissionPayload = buildSubmissionPayload(pathKey, currentValues);
  const validationMap = new Map();

  for (const errorMessage of submissionPayload.validationErrors) {
    const matchingEntry = Object.keys(FIELD_DEFINITIONS).find((fieldKey) => {
      const fieldDefinition = getFieldPresentation(fieldKey, pathKey, currentValues);
      return errorMessage.startsWith(fieldDefinition?.label ?? "");
    });

    if (matchingEntry) {
      validationMap.set(matchingEntry, errorMessage);
    }
  }

  return validationMap;
}

function renderVariant(pathKey, nextValues = currentFormValues, options = {}) {
  currentFormValues = {
    ...currentFormValues,
    ...nextValues,
  };

  const activePathInput = contactFormElement?.querySelector(
    `input[name="interestPath"][value="${CSS.escape(pathKey)}"]`,
  );

  if (activePathInput instanceof HTMLInputElement) {
    activePathInput.checked = true;
  }

  const variant = getFormVariantConfig(pathKey, currentFormValues);
  const fieldGroups = getFieldGroups(pathKey, currentFormValues);
  const validationMap = options.showValidation ? getFieldValidationMap(pathKey, currentFormValues) : new Map();
  const requiredFieldSet = new Set(getRequiredFields(pathKey, currentFormValues));

  formIntroductionElement.innerHTML = `<p>${variant.introduction}</p>`;
  submitButtonElement.textContent = variant.submitLabel;

  formFieldGridElement.innerHTML = fieldGroups
    .map((group) => {
      const fieldsMarkup = group.fields
        .map((fieldKey) =>
          createFieldMarkup(
            fieldKey,
            currentFormValues[fieldKey],
            validationMap.get(fieldKey),
            requiredFieldSet.has(fieldKey),
          ),
        )
        .join("");

      return `
        <p class="form-section-label">${group.label}</p>
        ${fieldsMarkup}
      `;
    })
    .join("");

  for (const textareaElement of formFieldGridElement.querySelectorAll("textarea")) {
    autoResizeTextarea(textareaElement);
  }
}

function readStoredSubmissions() {
  try {
    return JSON.parse(window.localStorage.getItem(prototypeStorageKey) ?? "[]");
  } catch {
    return [];
  }
}

function storeSubmission(submissionPayload) {
  const storedSubmissions = readStoredSubmissions();
  const nextSubmission = {
    ...submissionPayload,
    storedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(
    prototypeStorageKey,
    JSON.stringify([...storedSubmissions, nextSubmission]),
  );
}

function resetForCurrentPath(pathKey) {
  currentFormValues = {
    interestPath: pathKey,
    self_or_referral: WORK_SELF_OPTION,
    role_interest: STUDIO_DEVELOPMENT_MANAGER_LABEL,
  };

  renderVariant(pathKey, currentFormValues);
}

function parseIntentStateFromUrl() {
  const currentUrl = new URL(window.location.href);
  const interestPath = currentUrl.searchParams.get("interestPath");
  const selfOrReferral = currentUrl.searchParams.get("selfOrReferral");
  const nextValues = {};

  if (["work_with_us", "partner_with_us", "stay_connected"].includes(interestPath)) {
    nextValues.interestPath = interestPath;
  }

  if (selfOrReferral === "referral") {
    nextValues.self_or_referral = WORK_REFERRAL_OPTION;
  }

  return nextValues;
}

function syncIntentStateToUrl(pathKey, currentValues = {}) {
  const currentUrl = new URL(window.location.href);

  currentUrl.searchParams.set("interestPath", pathKey);

  if (pathKey === "work_with_us" && currentValues.self_or_referral === WORK_REFERRAL_OPTION) {
    currentUrl.searchParams.set("selfOrReferral", "referral");
  } else {
    currentUrl.searchParams.delete("selfOrReferral");
  }

  if (!currentUrl.hash) {
    currentUrl.hash = "#contact";
  }

  window.history.replaceState({}, "", currentUrl);
}

function updateActiveNavigation(activeSectionId) {
  for (const navigationLink of navigationLinks) {
    navigationLink.classList.toggle(
      "site-navigation__link--active",
      navigationLink.dataset.navLink === activeSectionId,
    );
  }
}

function observeSectionsForNavigation() {
  const observer = new IntersectionObserver(
    (entries) => {
      const visibleEntries = entries
        .filter((entry) => entry.isIntersecting)
        .sort((leftEntry, rightEntry) => rightEntry.intersectionRatio - leftEntry.intersectionRatio);

      if (visibleEntries.length > 0) {
        updateActiveNavigation(visibleEntries[0].target.id);
      }
    },
    {
      rootMargin: "-20% 0px -55% 0px",
      threshold: [0.2, 0.45, 0.7],
    },
  );

  for (const observedSection of observedSections) {
    observer.observe(observedSection);
  }
}

function insertChipText(textareaElement, chipText) {
  const selectionStart = textareaElement.selectionStart ?? textareaElement.value.length;
  const selectionEnd = textareaElement.selectionEnd ?? textareaElement.value.length;
  const prefix = textareaElement.value && selectionStart > 0 ? "\n" : "";

  textareaElement.setRangeText(
    `${prefix}${chipText}`,
    selectionStart,
    selectionEnd,
    "end",
  );
  textareaElement.focus();
  autoResizeTextarea(textareaElement);
}

function handleFormChange(event) {
  const selectedPath = contactFormElement.elements.interestPath.value;

  if (event.target.name === "interestPath") {
    trackEvent("form_path_selection", { interestPath: event.target.value });
    resetForCurrentPath(event.target.value);
    syncIntentStateToUrl(event.target.value, currentFormValues);
    setStatusMessage("", "idle");
    return;
  }

  if (event.target.name) {
    currentFormValues[event.target.name] =
      event.target.type === "checkbox" ? event.target.checked : event.target.value;
  }

  if (event.target instanceof HTMLTextAreaElement) {
    autoResizeTextarea(event.target);
  }

  if (selectedPath === "work_with_us" && (event.target.name === "self_or_referral" || event.target.name?.startsWith("referred_"))) {
    renderVariant(selectedPath, currentFormValues);
    syncIntentStateToUrl(selectedPath, currentFormValues);
  }

  setStatusMessage("", "idle");
}

function handleComposerChipClick(event) {
  const chipButton = event.target.closest("[data-composer-chip]");

  if (!chipButton || !contactFormElement) {
    return;
  }

  const fieldKey = chipButton.dataset.composerChip;
  const chipText = chipButton.dataset.chipText ?? "";
  const targetTextarea = contactFormElement.querySelector(`#${CSS.escape(fieldKey)}`);

  if (!(targetTextarea instanceof HTMLTextAreaElement)) {
    return;
  }

  insertChipText(targetTextarea, chipText);
  currentFormValues[fieldKey] = targetTextarea.value;
}

function handleFormSubmit(event) {
  event.preventDefault();

  const selectedPath = contactFormElement.elements.interestPath.value;
  const formValues = {
    ...currentFormValues,
    ...readCurrentFormValues(),
  };
  const submissionPayload = buildSubmissionPayload(selectedPath, formValues);

  if (submissionPayload.validationErrors.length > 0) {
    currentFormValues = {
      ...currentFormValues,
      ...submissionPayload.normalizedValues,
    };
    renderVariant(selectedPath, currentFormValues, { showValidation: true });
    setStatusMessage(submissionPayload.validationErrors[0], "error");
    return;
  }

  storeSubmission(submissionPayload);
  trackEvent("form_submission_success", { interestPath: selectedPath });
  setStatusMessage(getFormVariantConfig(selectedPath, currentFormValues).successMessage, "success");
  contactFormElement.reset();
  resetForCurrentPath(selectedPath);
  contactFormElement.querySelector(`input[name="interestPath"][value="${selectedPath}"]`).checked = true;
  syncIntentStateToUrl(selectedPath, currentFormValues);
}

function handleNavClick(event) {
  const menuTrigger = event.target.closest(".site-navigation__menu-button");
  const navigationLink = event.target.closest("[data-nav-link]");
  const clickedScrim = event.target.closest(".site-navigation__scrim");

  if (menuTrigger) {
    toggleMobileMenu();
    return;
  }

  if (clickedScrim) {
    closeMobileMenu();
    return;
  }

  if (!navigationLink) {
    return;
  }

  trackEvent("nav_click", { target: navigationLink.dataset.navLink });
  closeMobileMenu();
}

function handleHeroCtaTracking(event) {
  const trackedLink = event.target.closest("[data-analytics-id]");

  if (!trackedLink) {
    return;
  }

  trackEvent("hero_cta_click", { target: trackedLink.dataset.analyticsId });
}

function handleEscapeForMobileMenu(event) {
  if (event.key === "Escape") {
    closeMobileMenu();
  }
}

function handleHashNavigation() {
  closeMobileMenu();

  const nextIntentState = parseIntentStateFromUrl();
  if (window.location.hash === "#contact" && nextIntentState.interestPath) {
    currentFormValues = {
      ...currentFormValues,
      ...nextIntentState,
      role_interest: STUDIO_DEVELOPMENT_MANAGER_LABEL,
    };
    renderVariant(nextIntentState.interestPath, currentFormValues);
  }
}

function handleSectionActionClick(event) {
  const actionLink = event.target.closest("[data-interest-path-link]");

  if (!actionLink || !contactFormElement) {
    return;
  }

  const targetPath = actionLink.dataset.interestPathLink;
  const referralMode = actionLink.dataset.selfOrReferralLink;
  const targetInput = contactFormElement.querySelector(`input[name="interestPath"][value="${targetPath}"]`);

  if (!targetInput) {
    return;
  }

  event.preventDefault();
  targetInput.checked = true;
  currentFormValues = {
    interestPath: targetPath,
    self_or_referral: referralMode === "referral" ? WORK_REFERRAL_OPTION : WORK_SELF_OPTION,
    role_interest: STUDIO_DEVELOPMENT_MANAGER_LABEL,
  };
  trackEvent("form_path_selection", { interestPath: targetPath });
  renderVariant(targetPath, currentFormValues);
  syncIntentStateToUrl(targetPath, currentFormValues);
  document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
  setStatusMessage("", "idle");
}

contactFormElement.addEventListener("change", handleFormChange);
contactFormElement.addEventListener("input", handleFormChange);
contactFormElement.addEventListener("click", handleComposerChipClick);
contactFormElement.addEventListener("submit", handleFormSubmit);
document.addEventListener("click", handleHeroCtaTracking);
document.addEventListener("click", handleSectionActionClick);
siteNavigationElement?.addEventListener("click", handleNavClick);
document.addEventListener("keydown", handleEscapeForMobileMenu);
window.addEventListener("hashchange", handleHashNavigation);

trackEvent("page_load", { page: window.location.pathname });
currentFormValues = {
  ...currentFormValues,
  ...parseIntentStateFromUrl(),
};
renderVariant(currentFormValues.interestPath, currentFormValues);
observeSectionsForNavigation();
