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

function createInputMarkup(fieldKey, isRequired) {
  const field = FIELD_DEFINITIONS[fieldKey];
  const fieldClassName = field.type === "textarea" ? "form-field form-field--full" : "form-field";
  const requiredLabel = isRequired ? '<span class="field-required-note"> *</span>' : "";

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
      </div>
    `;
  }

  if (field.type === "checkbox") {
    return `
      <div class="form-field form-field--full">
        <label for="${fieldKey}">
          <input id="${fieldKey}" name="${fieldKey}" type="checkbox" ${isRequired ? "required" : ""} />
          ${field.label}${requiredLabel}
        </label>
      </div>
    `;
  }

  if (field.type === "textarea") {
    return `
      <div class="${fieldClassName}">
        <label for="${fieldKey}">${field.label}${requiredLabel}</label>
        <textarea id="${fieldKey}" name="${fieldKey}" ${isRequired ? "required" : ""}></textarea>
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

function handleFormSubmit(event) {
  event.preventDefault();

  const selectedPath = contactFormElement.elements.interestPath.value;
  const submissionPayload = buildSubmissionPayload(selectedPath, readCurrentFormValues());

  if (submissionPayload.validationErrors.length > 0) {
    setStatusMessage(submissionPayload.validationErrors[0], "error");
    return;
  }

  // The Google Sheets integration is not wired yet, so this scaffold confirms
  // the front-end logic and logs the eventual payload shape for development.
  console.info("Unified contact form payload", submissionPayload);

  setStatusMessage(
    "Front-end form logic is working. Google Sheets submission wiring is the next implementation step.",
    "success",
  );

  contactFormElement.reset();
  renderVariant(selectedPath);
}

contactFormElement.addEventListener("change", handlePathChange);
contactFormElement.addEventListener("submit", handleFormSubmit);

renderVariant("work_with_us");
