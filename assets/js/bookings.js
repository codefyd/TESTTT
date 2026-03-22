window.Bookings = {
  calendar: null,
  bookingModal: null,
  users: [],

  async init() {
    this.bookingModal = new bootstrap.Modal(document.getElementById('bookingModal'));
    await this.loadUsers();
    this.bindEvents();
  },

  bindEvents() {
    document.getElementById('openAddBookingBtn').addEventListener('click', () => {
      const dateStr = document.getElementById('selectedDate').value || '';
      this.openCreateModal(dateStr);
    });

    document.getElementById('bookingForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveBooking();
    });

    document.getElementById('addExpenseRowBtn').addEventListener('click', () => {
      this.addExpenseRow();
    });

    document.getElementById('bookingAmount').addEventListener('input', () => this.updateRemaining());
    document.getElementById('bookingDeposit').addEventListener('input', () => this.updateRemaining());

    document.getElementById('bookingAssignedTo').addEventListener('change', (e) => {
      const code = e.target.value;
      const user = this.users.find(x => String(x.code || '') === String(code || ''));
      document.getElementById('bookingAssignedToName').value = user?.name || '';
    });

    document.getElementById('dayEventsList').addEventListener('click', async (e) => {
      const editBtn = e.target.closest('[data-action="edit-booking"]');
      const deleteBtn = e.target.closest('[data-action="delete-booking"]');

      if (editBtn) {
        const raw = editBtn.getAttribute('data-booking');
        if (!raw) return;
        const booking = JSON.parse(decodeURIComponent(raw));
        this.openEditModal(booking);
      }

      if (deleteBtn) {
        const id = deleteBtn.getAttribute('data-id');
        if (!id) return;
        await this.deleteBooking(id);
      }
    });
  },

  async loadUsers() {
    const result = await Api.call('getAllUsersData');
    this.users = result?.users || [];

    const select = document.getElementById('bookingAssignedTo');
    select.innerHTML = `<option value="">بدون إسناد</option>`;

    this.users.forEach(user => {
      const code = String(user.code || '').trim();
      const name = String(user.name || '').trim();
      if (!code) return;

      const option = document.createElement('option');
      option.value = code;
      option.textContent = `${name} (${code})`;
      select.appendChild(option);
    });
  },

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
        const d = info.dateStr.split('T')[0];
        this.loadDayEvents(d);
      },

      eventClick: (info) => {
        const d = (info.event.extendedProps?.date || info.event.startStr || '').split('T')[0];
        this.loadDayEvents(d);
      }
    });

    this.calendar.render();
  },

  async refresh() {
    if (this.calendar) this.calendar.refetchEvents();
    const selectedDate = document.getElementById('selectedDate').value;
    if (selectedDate) {
      await this.loadDayEvents(selectedDate);
    }
    await Dashboard.load();
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

      list.innerHTML = rows.map(row => {
        const encoded = encodeURIComponent(JSON.stringify(row));
        return `
          <div class="booking-item">
            <div class="booking-title">${Utils.escapeHtml(row.name || '-')} — ${Utils.escapeHtml(row.type || '-')}</div>
            <div class="booking-meta">الهاتف: ${Utils.escapeHtml(row.phone || '-')} | المكان: ${Utils.escapeHtml(row.place || '-')}</div>
            <div class="booking-meta">التاريخ: ${Utils.escapeHtml(row.date || '-')} | الوقت: ${Utils.escapeHtml(row.time || '-')}</div>
            <div class="booking-meta">المبلغ: ${Utils.formatCurrency(row.amount || 0)} | الواصل: ${Utils.formatCurrency(row.deposit || 0)} | المتبقي: ${Utils.formatCurrency(row.remaining || 0)}</div>
            <div class="booking-meta">الصافي: ${Utils.formatCurrency(row.net || 0)}</div>
            <div class="booking-meta">التفاصيل: ${Utils.escapeHtml(row.details || '-')}</div>
            <div class="booking-actions">
              <button class="btn btn-outline-primary btn-sm" data-action="edit-booking" data-booking="${encoded}">
                <i class="fas fa-pen"></i> تعديل
              </button>
              <button class="btn btn-outline-danger btn-sm" data-action="delete-booking" data-id="${Utils.escapeHtml(row.id || '')}">
                <i class="fas fa-trash"></i> حذف
              </button>
            </div>
          </div>
        `;
      }).join('');
    } catch (error) {
      list.innerHTML = `<div class="text-danger">${Utils.escapeHtml(error.message || 'تعذر تحميل الحجوزات')}</div>`;
    }
  },

  openCreateModal(dateStr = '') {
    document.getElementById('bookingModalTitle').textContent = 'إضافة حجز';
    document.getElementById('bookingForm').reset();
    document.getElementById('bookingId').value = '';
    document.getElementById('bookingDate').value = dateStr || '';
    document.getElementById('bookingRemaining').value = '0';
    document.getElementById('expenseRows').innerHTML = '';
    document.getElementById('bookingAssignedToName').value = '';
    this.bookingModal.show();
    this.updateRemaining();
  },

  openEditModal(booking) {
    document.getElementById('bookingModalTitle').textContent = 'تعديل الحجز';
    document.getElementById('bookingId').value = booking.id || '';
    document.getElementById('bookingType').value = booking.type || '';
    document.getElementById('bookingName').value = booking.name || '';
    document.getElementById('bookingPhone').value = booking.phone || '';
    document.getElementById('bookingDate').value = booking.date || '';
    document.getElementById('bookingPlace').value = booking.place || '';
    document.getElementById('bookingTime').value = booking.time || '';
    document.getElementById('bookingDetails').value = booking.details || '';
    document.getElementById('bookingAmount').value = booking.amount || 0;
    document.getElementById('bookingDeposit').value = booking.deposit || 0;
    document.getElementById('bookingRemaining').value = booking.remaining || 0;

    document.getElementById('expenseRows').innerHTML = '';
    const expenses = Array.isArray(booking.expenses) ? booking.expenses : [];
    if (expenses.length) {
      expenses.forEach(exp => {
        this.addExpenseRow(exp.reason || '', exp.type || 'مقطوع', exp.value || 0);
      });
    }

    const assignedToSelect = document.getElementById('bookingAssignedTo');
    const matchedUser = this.users.find(u => (u.name || '') === (booking.assignedToName || '') || (u.code || '') === (booking.assignedToCode || ''));
    assignedToSelect.value = matchedUser?.code || '';
    document.getElementById('bookingAssignedToName').value = matchedUser?.name || '';

    this.updateRemaining();
    this.bookingModal.show();
  },

  addExpenseRow(reason = '', type = 'مقطوع', value = 0) {
    const wrapper = document.createElement('div');
    wrapper.className = 'expense-row';

    wrapper.innerHTML = `
      <div class="row g-2 align-items-end">
        <div class="col-md-5">
          <label class="form-label">السبب</label>
          <input class="form-control expense-reason" value="${Utils.escapeHtml(reason)}" />
        </div>
        <div class="col-md-3">
          <label class="form-label">النوع</label>
          <select class="form-select expense-type">
            <option value="مقطوع" ${type === 'مقطوع' ? 'selected' : ''}>مقطوع</option>
            <option value="نسبة" ${type === 'نسبة' ? 'selected' : ''}>نسبة</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">القيمة</label>
          <input type="number" min="0" step="0.01" class="form-control expense-value" value="${value}" />
        </div>
        <div class="col-md-1">
          <button type="button" class="btn btn-outline-danger w-100 remove-expense-row">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    `;

    wrapper.querySelector('.remove-expense-row').addEventListener('click', () => wrapper.remove());
    document.getElementById('expenseRows').appendChild(wrapper);
  },

  collectExpenses() {
    return Array.from(document.querySelectorAll('#expenseRows .expense-row')).map(row => {
      return {
        reason: row.querySelector('.expense-reason')?.value?.trim() || '',
        type: row.querySelector('.expense-type')?.value || 'مقطوع',
        value: Utils.toNumber(row.querySelector('.expense-value')?.value)
      };
    }).filter(x => x.reason || x.value > 0);
  },

  updateRemaining() {
    const amount = Utils.toNumber(document.getElementById('bookingAmount').value);
    const deposit = Utils.toNumber(document.getElementById('bookingDeposit').value);
    const remaining = Math.max(0, amount - deposit);
    document.getElementById('bookingRemaining').value = remaining;
  },

  buildPayload() {
    const assignedCode = document.getElementById('bookingAssignedTo').value || '';
    const assignedUser = this.users.find(x => String(x.code || '') === String(assignedCode || ''));

    return {
      id: document.getElementById('bookingId').value || '',
      type: document.getElementById('bookingType').value || '',
      name: document.getElementById('bookingName').value.trim(),
      phone: document.getElementById('bookingPhone').value.trim(),
      date: document.getElementById('bookingDate').value,
      place: document.getElementById('bookingPlace').value.trim(),
      time: document.getElementById('bookingTime').value.trim(),
      details: document.getElementById('bookingDetails').value.trim(),
      amount: Utils.toNumber(document.getElementById('bookingAmount').value),
      deposit: Utils.toNumber(document.getElementById('bookingDeposit').value),
      assignedTo: assignedCode,
      assignedToName: assignedUser?.name || '',
      expenses: JSON.stringify(this.collectExpenses())
    };
  },

  validatePayload(payload) {
    if (!payload.type) return 'اختر نوع الحجز';
    if (!payload.name) return 'أدخل اسم العميل';
    if (!payload.date) return 'اختر تاريخ الحجز';
    return '';
  },

  async saveBooking() {
    const payload = this.buildPayload();
    const validationMessage = this.validatePayload(payload);

    if (validationMessage) {
      Swal.fire('تنبيه', validationMessage, 'warning');
      return;
    }

    const isEdit = !!payload.id;
    const saveBtn = document.getElementById('saveBookingBtn');
    const originalHtml = saveBtn.innerHTML;

    try {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> جاري الحفظ';

      const message = isEdit
        ? await Api.call('updateEvent', payload)
        : await Api.call('addEvent', payload);

      this.bookingModal.hide();

      await Swal.fire({
        icon: 'success',
        title: 'تم',
        text: typeof message === 'string' ? message : 'تم حفظ الحجز بنجاح'
      });

      await this.refresh();
    } catch (error) {
      Swal.fire('خطأ', error.message || 'تعذر حفظ الحجز', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalHtml;
    }
  },

  async deleteBooking(id) {
    const result = await Swal.fire({
      title: 'تأكيد الحذف',
      text: 'هل تريد حذف هذا الحجز؟',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم احذف',
      cancelButtonText: 'إلغاء'
    });

    if (!result.isConfirmed) return;

    try {
      const message = await Api.call('deleteEvent', { id });

      await Swal.fire({
        icon: 'success',
        title: 'تم الحذف',
        text: typeof message === 'string' ? message : 'تم حذف الحجز'
      });

      await this.refresh();
    } catch (error) {
      Swal.fire('خطأ', error.message || 'تعذر حذف الحجز', 'error');
    }
  }
};
