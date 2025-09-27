(function () {
  const button = document.querySelector('#orderButton');
  if (!button) return;

  button.addEventListener('click', () => {
    const message = [
      'Thanks for choosing Marxia Café y Bocaditos!',
      'We will message you on WhatsApp to confirm your order.',
    ].join('\n');

    alert(message);
  });
})();
