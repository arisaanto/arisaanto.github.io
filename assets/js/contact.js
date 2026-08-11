(function () {
  window.addEventListener("DOMContentLoaded", function () {
    const buttons = document.querySelectorAll("[data-copy-email]");
    if (!buttons.length) return;

    function fallbackCopy(value) {
      const input = document.createElement("textarea");
      input.value = value;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.append(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", async function () {
        const email = button.dataset.copyEmail;
        try {
          await navigator.clipboard.writeText(email);
        } catch (_error) {
          fallbackCopy(email);
        }

        button.dataset.copyState = "copied";
        button.setAttribute("aria-label", "Email address copied");
        button.setAttribute("title", "Email address copied");

        window.setTimeout(function () {
          delete button.dataset.copyState;
          button.setAttribute("aria-label", "Copy email address");
          button.setAttribute("title", "Copy email address");
        }, 1800);
      });
    });
  });
})();
