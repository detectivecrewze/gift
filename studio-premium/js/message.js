/**
 * message.js — Letter/Message Textarea
 */
const Message = (() => {
  function init(initialValue) {
    const input = document.getElementById('input-message');
    const counter = document.getElementById('char-count');

    if (input && initialValue) {
      input.value = initialValue;
      if (counter) counter.textContent = initialValue.length;
    }

    if (input) {
      input.addEventListener('input', (e) => {
        if (counter) counter.textContent = e.target.value.length;
        Autosave.trigger();
      });
    }
  }

  function getMessage() {
    return document.getElementById('input-message')?.value.trim() || '';
  }

  return { init, getMessage };
})();
