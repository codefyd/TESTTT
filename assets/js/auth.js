window.Auth = {
  async handleLogin(event) {
    event.preventDefault();
    Utils.clearError();

    const code = document.getElementById('code').value.trim();
    const btn = document.getElementById('loginBtn');
    const txt = document.getElementById('loginBtnText');
    const statusText = document.getElementById('statusText');

    if (!code) {
      Utils.showError('الرجاء إدخال رمز الدخول');
      return;
    }

    try {
      btn.disabled = true;
      txt.textContent = 'جاري التحقق...';
      statusText.textContent = 'جاري التحقق...';

      const result = await Api.call('verifyLogin', { code });
      const payload = result?.success !== undefined ? result : { success: true, ...result };

      if (!payload.success) {
        throw new Error(payload.message || 'رمز الدخول غير صحيح');
      }

      localStorage.setItem('userName', payload.userName || 'مستخدم');
      localStorage.setItem('userPermissions', JSON.stringify(payload.permissions || {}));
      localStorage.setItem('userCode', payload.userCode || '');
      localStorage.setItem('userCalendarId', payload.calendarId || '');

      document.getElementById('currentUserNameValue').textContent = payload.userName || 'مستخدم';
      document.getElementById('loginPage').classList.add('d-none');
      document.getElementById('mainApp').classList.remove('d-none');
      statusText.textContent = 'تم الدخول';

      await window.App.initializeAfterLogin();
    } catch (error) {
      Utils.showError(error.message || 'تعذر تسجيل الدخول');
      statusText.textContent = 'خطأ';
    } finally {
      btn.disabled = false;
      txt.textContent = 'دخول';
    }
  },

  logout() {
    localStorage.removeItem('userName');
    localStorage.removeItem('userPermissions');
    localStorage.removeItem('userCode');
    localStorage.removeItem('userCalendarId');
    location.reload();
  },

  restoreSession() {
    const userName = localStorage.getItem('userName');
    if (!userName) return false;

    document.getElementById('currentUserNameValue').textContent = userName;
    document.getElementById('loginPage').classList.add('d-none');
    document.getElementById('mainApp').classList.remove('d-none');
    return true;
  }
};
