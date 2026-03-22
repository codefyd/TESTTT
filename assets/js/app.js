window.App = {
  async initializeAfterLogin() {
    await Promise.all([
      Dashboard.load(),
      Bookings.loadCalendar()
    ]);
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('loginForm').addEventListener('submit', Auth.handleLogin);
  document.getElementById('logoutBtn').addEventListener('click', Auth.logout);

  if (Auth.restoreSession()) {
    await App.initializeAfterLogin();
  }
});
