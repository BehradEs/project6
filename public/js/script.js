window.addEventListener('DOMContentLoaded', () => {
  let thumBtn = document.getElementById('rated');

  const userId = thumBtn.getAttribute('user-id');
  const locationId = thumBtn.getAttribute('location-id');
  const serverUrl = 'http://localhost:3000/rating';
  const method = 'POST';
  const headers = { 'Content-Type': 'application/json' };
  const thumb = thumBtn.getAttribute('thumb-id');

  let thumbId = 0;
  if (thumb === 'thumb') {
    thumbId = 1;
  }

  thumBtn.addEventListener('click', (e) => {
    fetch(serverUrl, {
      method,
      headers,
      body: JSON.stringify({ userId, locationId, thumbId }),
    }).then(() => {
      thumBtn.classList.toggle('fa-thumbs-up');
      thumBtn.classList.toggle('fa-thumbs-down');
      window.location.reload();
    });
  });
});
