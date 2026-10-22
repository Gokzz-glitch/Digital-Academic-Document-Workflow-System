const validateFormData = (documentType, formData) => {
  if (!formData || typeof formData !== 'object' || Array.isArray(formData)) {
    return 'Request details must be provided as an object';
  }
  for (const field of documentType.customFields || []) {
    const value = formData[field.fieldName];
    const hasValue = value !== undefined && value !== null && String(value).trim() !== '';
    const label = field.label || field.fieldName;
    if (field.required && !hasValue) return `${label} is required`;
    if (!hasValue) continue;
    if (field.fieldType === 'number' && !Number.isFinite(Number(value))) return `${label} must be a number`;
    if (field.fieldType === 'date' && Number.isNaN(Date.parse(value))) return `${label} must be a valid date`;
    if (field.fieldType === 'select' && field.options?.length && !field.options.includes(String(value))) {
      return `${label} must be one of the listed options`;
    }
  }
  return null;
};

module.exports = { validateFormData };
