(function () {
  const storageKey = "aris-theme";
  const root = document.documentElement;
  const media = window.matchMedia("(prefers-color-scheme: dark)");

  function storedTheme() {
    try {
      const value = window.localStorage.getItem(storageKey);
      return value === "light" || value === "dark" ? value : null;
    } catch (_error) {
      return null;
    }
  }

  function activeTheme() {
    return root.dataset.theme || (media.matches ? "dark" : "light");
  }

  function updateButton(button) {
    const theme = activeTheme();
    const next = theme === "dark" ? "light" : "dark";
    button.dataset.themeState = theme;
    button.setAttribute("aria-label", `Switch to ${next} mode`);
    button.setAttribute("title", `Switch to ${next} mode`);
  }

  const initial = storedTheme();
  if (initial) root.dataset.theme = initial;

  window.addEventListener("DOMContentLoaded", function () {
    const buttons = document.querySelectorAll("[data-theme-toggle]");

    buttons.forEach(function (button) {
      updateButton(button);
      button.addEventListener("click", function () {
        const next = activeTheme() === "dark" ? "light" : "dark";
        root.dataset.theme = next;
        try {
          window.localStorage.setItem(storageKey, next);
        } catch (_error) {
          // The selected theme still applies for this page view.
        }
        buttons.forEach(updateButton);
      });
    });

    media.addEventListener("change", function () {
      if (!storedTheme()) buttons.forEach(updateButton);
    });
  });
})();
