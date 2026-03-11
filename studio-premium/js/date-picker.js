/**
 * date-picker.js — Anniversary Date Input
 */
const DatePicker = (() => {
  function init(initialDate) {
    const input = document.getElementById('input-date');
    if (!input) return;

    if (initialDate) {
      input.value = initialDate;
    }

    input.addEventListener('change', () => {
      validateDate();
      Autosave.trigger();
    });
  }

  function validateDate() {
    const input = document.getElementById('input-date');
    if (!input || !input.value) return true;

    const selectedDate = new Date(input.value);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Allow today

    if (selectedDate > today) {
      Studio.showToast('Tanggal tidak boleh di masa depan.');
      input.value = '';
      return false;
    }

    // Minimum date (e.g. 50 years ago)
    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - 50);
    if (selectedDate < minDate) {
      Studio.showToast('Tahun terlalu lampau.');
      input.value = '';
      return false;
    }

    return true;
  }

  function getDate() {
    return document.getElementById('input-date')?.value || '';
  }

  return { init, validateDate, getDate };
})();
