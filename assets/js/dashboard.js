window.Dashboard = {
  async load() {
    const ids = [
      'dash-bookings-total',
      'dash-total-revenue',
      'dash-receivables',
      'dash-net-profit'
    ];

    ids.forEach(id => {
      document.getElementById(id).textContent = '...';
    });

    const stats = await Api.call('getDashboardStats');
    this.render(stats || {});
  },

  render(stats) {
    document.getElementById('dash-bookings-total').textContent = Utils.formatCurrency(stats.totalBookings || 0);
    document.getElementById('dash-total-revenue').textContent = Utils.formatCurrency(stats.totalRevenue || 0);
    document.getElementById('dash-receivables').textContent = Utils.formatCurrency(stats.totalReceivables || 0);
    document.getElementById('dash-net-profit').textContent = Utils.formatCurrency(stats.netProfit || 0);
  }
};
