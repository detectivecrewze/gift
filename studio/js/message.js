/**
 * message.js — Letter/Message Textarea
 */
const Message = (() => {
  function init(initialValue) {
    const input = document.getElementById('input-message');
    const counter = document.getElementById('char-count');

    const getWordCount = (str) => str.trim() ? str.trim().split(/\s+/).length : 0;

    if (input && initialValue) {
      input.value = initialValue;
      if (counter) counter.textContent = getWordCount(initialValue);
    }

    if (input) {
      input.addEventListener('input', (e) => {
        if (counter) counter.textContent = getWordCount(e.target.value);
        Autosave.trigger();
      });
    }
  }

  function getMessage() {
    return document.getElementById('input-message')?.value.trim() || '';
  }

  return { init, getMessage };
})();
