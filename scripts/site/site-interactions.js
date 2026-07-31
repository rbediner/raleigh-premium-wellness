/**
 * Purpose: Wire up all browser-side behavior for the single-page site: the
 * unified contact form (path selection, field rendering, validation, submit),
 * sticky-nav highlighting, the mobile menu, deep-link/hash handling, and
 * analytics events.
 * Role: This is the page's only entry-point module. It reads its field/copy
 * configuration from form-configuration.js and delegates the actual network
 * submit to submission-gateway.js, so this file stays focused on DOM and UX.
 * Dependencies: Browser DOM APIs only (no bundler, no framework). Loaded as an
 * ES module via <script type="module"> in index.html.
 * Risk: Low. Contains no environment/SEO logic and no hardcoded form endpoint;
 * the endpoint is injected at build time and read inside submission-gateway.js.
 */

import {
  FIND_OUT_WHATS_COMING_PATH,
  FIELD_DEFINITIONS,
  buildSubmissionPayload,
  getFieldGroups,
  getFieldPresentation,
  getRequiredFields,
  getFormVariantConfig,
  normalizeInterestPath,
} from "./form-configuration.js";
import { consumeQrAttribution } from "./qr-attribution.js";
import { getIsTestSubmissionFlag, submitUnifiedFormSubmission } from "./submission-gateway.js";

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
let currentFormValues = {
  interestPath: "work_with_us",
};

function setMobileMenuState(isOpen) {
  if (!mobileMenuButtonElement || !mobileMenuLinksElement || !mobileMenuScrimElement) {
    return;
  }

  // Keep the trigger label in sync so screen readers get the same state change as sighted users.
  mobileMenuButtonElement.setAttribute("aria-expanded", String(isOpen));
  mobileMenuButtonElement.setAttribute(
    "aria-label",
    isOpen ? "Close navigation menu" : "Open navigation menu",
  );
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
  if (typeof gtag === "function") {
    gtag("event", eventName, eventData);
  }
}

function trackAndCleanQrAttribution() {
  const { cleanedUrl, qrSource } = consumeQrAttribution(window.location.href);

  if (qrSource) {
    // Record the printed source before hiding it, so shares copy a clean URL.
    trackEvent("qr_scan", { qr_source: qrSource });
  }

  if (cleanedUrl !== window.location.href) {
    window.history.replaceState({}, "", cleanedUrl);
  }
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
          <!-- Bind the checkbox and its disclosure copy into one shared layout so every path aligns the same way. -->
          <div class="form-checkbox__row">
            <input id="${fieldKey}" name="${fieldKey}" type="checkbox" ${isChecked} />
            <div class="form-checkbox__content">
              <label for="${fieldKey}" class="form-checkbox__label">
                <span class="form-checkbox__copy">
                  <span class="form-checkbox__label-text">${escapeHtml(field.label)}</span>${requiredLabel}
                </span>
              </label>
              ${helperMarkup}
              ${errorMarkup}
            </div>
          </div>
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
          class="form-textarea${fieldKey === "short_message" ? " form-textarea--conversation" : ""}"
          rows="${field.rows ?? 5}"
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

function setSubmittingState(isSubmitting) {
  submitButtonElement.disabled = isSubmitting;
  contactFormElement.classList.toggle("contact-form--submitting", isSubmitting);
}

function resetForCurrentPath(pathKey) {
  currentFormValues = {
    interestPath: pathKey,
  };

  renderVariant(pathKey, currentFormValues);
}

function parseIntentStateFromUrl() {
  const currentUrl = new URL(window.location.href);
  const interestPath = normalizeInterestPath(currentUrl.searchParams.get("interestPath"));
  const nextValues = {};

  if (["work_with_us", "partner_with_us", FIND_OUT_WHATS_COMING_PATH].includes(interestPath)) {
    nextValues.interestPath = interestPath;
  }

  return nextValues;
}

function syncIntentStateToUrl(pathKey, currentValues = {}) {
  const currentUrl = new URL(window.location.href);

  currentUrl.searchParams.set("interestPath", pathKey);
  currentUrl.searchParams.delete("selfOrReferral");

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

async function handleFormSubmit(event) {
  event.preventDefault();

  const selectedPath = contactFormElement.elements.interestPath.value;
  trackEvent("form_submission_attempt", { interestPath: selectedPath });
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

  setSubmittingState(true);
  setStatusMessage("", "idle");

  try {
    await submitUnifiedFormSubmission(submissionPayload, {
      sourceUrl: window.location.href,
      isTestSubmission: getIsTestSubmissionFlag(window.location.href, document.body?.dataset),
    });
    trackEvent("form_submission_success", { interestPath: selectedPath });
    setStatusMessage(getFormVariantConfig(selectedPath, currentFormValues).successMessage, "success");
    contactFormElement.reset();
    resetForCurrentPath(selectedPath);
    contactFormElement.querySelector(`input[name="interestPath"][value="${selectedPath}"]`).checked = true;
    syncIntentStateToUrl(selectedPath, currentFormValues);
  } catch (error) {
    trackEvent("form_submission_error", {
      interestPath: selectedPath,
      message: error instanceof Error ? error.message : "Unknown submission error",
    });
    setStatusMessage(
      error instanceof Error
        ? error.message
        : "We’re sorry, your note could not be submitted right now. Please try again in a moment.",
      "error",
    );
  } finally {
    setSubmittingState(false);
  }
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
    };
    renderVariant(nextIntentState.interestPath, currentFormValues);
  }

  const hashTargetId = window.location.hash.replace("#", "");
  const hashTargetElement = hashTargetId ? document.getElementById(hashTargetId) : null;

  if (hashTargetElement) {
    // Re-assert direct-entry anchor alignment after the browser finishes laying out sticky chrome.
    window.requestAnimationFrame(() => {
      hashTargetElement.scrollIntoView({ block: "start" });
    });
  }
}

function handleSectionActionClick(event) {
  const actionLink = event.target.closest("[data-interest-path-link]");

  if (!actionLink || !contactFormElement) {
    return;
  }

  const targetPath = actionLink.dataset.interestPathLink;
  const targetInput = contactFormElement.querySelector(`input[name="interestPath"][value="${targetPath}"]`);

  if (!targetInput) {
    return;
  }

  event.preventDefault();
  targetInput.checked = true;
  currentFormValues = {
    interestPath: targetPath,
  };
  trackEvent("form_path_selection", { interestPath: targetPath });
  renderVariant(targetPath, currentFormValues);
  syncIntentStateToUrl(targetPath, currentFormValues);
  document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
  setStatusMessage("", "idle");
}

// Bootstrap: bind every listener once, then paint the initial form variant.
// Form events use both change and input so radio path switches and live typing
// both refresh state; the document-level click listeners cover elements that
// are rendered dynamically (composer chips, section CTAs) and so cannot be
// bound directly at load time.
contactFormElement.addEventListener("change", handleFormChange);
contactFormElement.addEventListener("input", handleFormChange);
contactFormElement.addEventListener("click", handleComposerChipClick);
contactFormElement.addEventListener("submit", handleFormSubmit);
document.addEventListener("click", handleHeroCtaTracking);
document.addEventListener("click", handleSectionActionClick);
siteNavigationElement?.addEventListener("click", handleNavClick);
document.addEventListener("keydown", handleEscapeForMobileMenu);
window.addEventListener("hashchange", handleHashNavigation);

// Seed the form from any ?interestPath deep link before the first paint so a
// visitor arriving on a specific path sees the matching variant immediately.
trackAndCleanQrAttribution();
trackEvent("page_load", { page: window.location.pathname });
currentFormValues = {
  ...currentFormValues,
  ...parseIntentStateFromUrl(),
};
renderVariant(currentFormValues.interestPath, currentFormValues);
observeSectionsForNavigation();
