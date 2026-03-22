window.Api = {
  async call(action, payload = {}) {
    const response = await fetch(window.APP_CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({ action, payload })
    });

    const json = await response.json();

    if (!json.success) {
      throw new Error(json.message || 'API Error');
    }

    return json.data;
  }
};
