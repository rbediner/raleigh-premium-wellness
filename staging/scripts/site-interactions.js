import {
  FIELD_DEFINITIONS,
  buildSubmissionPayload,
  getFieldSequence,
  getFormVariantConfig,
} from "./form-configuration.js";

const contactFormElement = document.querySelector("#unified-contact-form");
const formFieldGridElement = document.querySelector("#form-field-grid");
const formIntroductionElement = document.querySelector("#form-introduction");
const formStatusMessageElement = document.querySelector("#form-status-message");
const submitButtonElement = document.querySelector("#contact-submit-button");
const prototypeStorageKey = "raleigh-premium-wellness-prototype-submissions";
const observedSections = document.querySelectorAll("main section[id]");
const navigationLinks = document.querySelectorAll("[data-nav-link]");

function createInputMarkup(fieldKey, isRequired) {
  const field = FIELD_DEFINITIONS[fieldKey];
  const fieldClassName = field.type === "textarea" ? "form-field form-field--full" : "form-field";
  const requiredLabel = isRequired ? '<span class="field-required-note"> *</span>' : "";
  const helperMarkup = field.helperText
    ? `<p class="form-field__helper">${field.helperText}</p>`
    : "";

  if (field.type === "select") {
    const optionMarkup = field.options
      .map((optionValue) => `<option value="${optionValue}">${optionValue}</option>`)
      .join("");

    return `
      <div class="${fieldClassName}">
        <label for="${fieldKey}">${field.label}${requiredLabel}</label>
        <select id="${fieldKey}" name="${fieldKey}" ${isRequired ? "required" : ""}>
          <option value="">Select an option</option>
          ${optionMarkup}
        </select>
        ${helperMarkup}
      </div>
    `;
  }

  if (field.type === "checkbox") {
    return `
      <div class="form-field form-field--full">
        <label class="form-checkbox" for="${fieldKey}">
          <input id="${fieldKey}" name="${fieldKey}" type="checkbox" ${isRequired ? "required" : ""} />
          <span>${field.label}${requiredLabel}</span>
        </label>
        ${helperMarkup}
      </div>
    `;
  }

  if (field.type === "textarea") {
    return `
      <div class="${fieldClassName}">
        <label for="${fieldKey}">${field.label}${requiredLabel}</label>
        <textarea id="${fieldKey}" name="${fieldKey}" ${isRequired ? "required" : ""}></textarea>
        ${helperMarkup}
      </div>
    `;
  }

  return `
    <div class="${fieldClassName}">
      <label for="${fieldKey}">${field.label}${requiredLabel}</label>
      <input
        id="${fieldKey}"
        name="${fieldKey}"
        type="${field.type}"
        ${field.autocomplete ? `autocomplete="${field.autocomplete}"` : ""}
        ${isRequired ? "required" : ""}
      />
      ${helperMarkup}
    </div>
  `;
}

function renderVariant(pathKey) {
  const variant = getFormVariantConfig(pathKey);
  const requiredFieldSet = new Set(variant.requiredFields);

  formIntroductionElement.innerHTML = `<p>${variant.introduction}</p>`;
  submitButtonElement.textContent = variant.submitLabel;

  formFieldGridElement.innerHTML = getFieldSequence(pathKey)
    .map((fieldKey) => createInputMarkup(fieldKey, requiredFieldSet.has(fieldKey)))
    .join("");
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

function handlePathChange(event) {
  if (event.target.name !== "interestPath") {
    return;
  }

  renderVariant(event.target.value);
  setStatusMessage("", "idle");
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

function handleFormSubmit(event) {
  event.preventDefault();

  const selectedPath = contactFormElement.elements.interestPath.value;
  const variant = getFormVariantConfig(selectedPath);
  const submissionPayload = buildSubmissionPayload(selectedPath, readCurrentFormValues());

  if (submissionPayload.validationErrors.length > 0) {
    setStatusMessage(submissionPayload.validationErrors[0], "error");
    return;
  }

  storeSubmission(submissionPayload);
  console.info("Unified contact form payload", submissionPayload);
  setStatusMessage(variant.successMessage, "success");

  contactFormElement.reset();
  contactFormElement.querySelector(`input[name="interestPath"][value="${selectedPath}"]`).checked = true;
  renderVariant(selectedPath);
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
      rootMargin: "-18% 0px -55% 0px",
      threshold: [0.2, 0.45, 0.7],
    },
  );

  for (const observedSection of observedSections) {
    observer.observe(observedSection);
  }
}

contactFormElement.addEventListener("change", handlePathChange);
contactFormElement.addEventListener("submit", handleFormSubmit);

renderVariant("work_with_us");
observeSectionsForNavigation();
