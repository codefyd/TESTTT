window.Utils = {
  formatCurrency(value) {
    const num = Number(value || 0);
    return new Intl.NumberFormat('ar-SA').format(num);
  },

  showError(message) {
    const box = document.getElementById('errorMessage');
    if (!box) return;
    box.textContent = message;
    box.classList.remove('d-none');
  },

  clearError() {
    const box = document.getElementById('errorMessage');
    if (!box) return;
    box.textContent = '';
    box.classList.add('d-none');
  },

  escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  },

  toNumber(value) {
    const n = parseFloat(value);
    return isNaN(n) ? 0 : n;
  }
};
