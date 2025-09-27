(function () {
  const button = document.querySelector('#orderButton');
  if (button) {
    button.addEventListener('click', () => {
      const message = [
        'Thanks for choosing Marxia Café y Bocaditos!',
        'We will message you on WhatsApp to confirm your order.',
      ].join('\n');

      alert(message);
    });
  }

  const copyright = document.querySelector('#copyrightYear');
  if (copyright) {
    const currentYear = new Date().getFullYear();
    copyright.textContent = String(currentYear);
  }
})();
