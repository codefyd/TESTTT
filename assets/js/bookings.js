window.Bookings = {
  calendar: null,

  async loadCalendar() {
    if (this.calendar) {
      this.calendar.refetchEvents();
      return;
    }

    const calendarEl = document.getElementById('calendar');

    this.calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      height: 'auto',
      locale: 'ar',
      direction: 'rtl',
      firstDay: 0,
      headerToolbar: {
        left: 'dayGridMonth,timeGridWeek today',
        center: 'title',
        right: 'prev,next'
      },
      buttonText: {
        today: 'اليوم',
        month: 'شهر',
        week: 'أسبوع'
      },
      eventDisplay: 'block',
      displayEventTime: false,

      events: async (info, success, failure) => {
        try {
          const events = await Api.call('getEvents');
          success(events || []);
        } catch (error) {
          failure(error);
        }
      },

      dateClick: (info) => {
        this.loadDayEvents(info.dateStr.split('T')[0]);
      },

      eventClick: (info) => {
        const d = (info.event.extendedProps?.date || info.event.startStr || '').split('T')[0];
        this.loadDayEvents(d);
      }
    });

    this.calendar.render();
  },

  async loadDayEvents(dateStr) {
    document.getElementById('selectedDate').value = dateStr;
    document.getElementById('modalDate').textContent = dateStr;

    const list = document.getElementById('dayEventsList');
    list.innerHTML = '<div class="text-muted">جاري التحميل...</div>';

    try {
      const rows = await Api.call('getEventsByDate', { date: dateStr });

      if (!rows?.length) {
        list.innerHTML = '<div class="text-muted">لا توجد حجوزات في هذا اليوم</div>';
        return;
      }

      list.innerHTML = rows.map(row => `
        <div class="booking-item">
          <div class="booking-title">${row.name || '-'} — ${row.type || '-'}</div>
          <div class="booking-meta">الهاتف: ${row.phone || '-'} | المكان: ${row.place || '-'}</div>
          <div class="booking-meta">المبلغ: ${Utils.formatCurrency(row.amount || 0)} | الواصل: ${Utils.formatCurrency(row.deposit || 0)} | المتبقي: ${Utils.formatCurrency(row.remaining || 0)}</div>
        </div>
      `).join('');
    } catch (error) {
      list.innerHTML = `<div class="text-danger">${error.message || 'تعذر تحميل الحجوزات'}</div>`;
    }
  }
};
