(function () {
  window.addEventListener("DOMContentLoaded", function () {
    const photos = Array.from(document.querySelectorAll(".photo img"));
    if (!photos.length || typeof HTMLDialogElement === "undefined") return;

    const dialog = document.createElement("dialog");
    dialog.className = "lightbox";
    dialog.setAttribute("aria-label", "Photograph viewer");

    const frame = document.createElement("figure");
    frame.className = "lightbox__frame";

    const image = document.createElement("img");
    image.className = "lightbox__image";

    const count = document.createElement("figcaption");
    count.className = "lightbox__count";

    frame.append(image, count);
    dialog.append(frame);
    document.body.append(dialog);

    let current = 0;
    let opener = null;

    function show(index) {
      current = (index + photos.length) % photos.length;
      image.src = photos[current].currentSrc || photos[current].src;
      image.alt = photos[current].alt;
      count.textContent = `${current + 1} / ${photos.length}`;
    }

    function open(index, source) {
      opener = source;
      show(index);
      dialog.showModal();
      document.body.classList.add("lightbox-open");
    }

    function dismiss() {
      dialog.close();
    }

    photos.forEach(function (photo, index) {
      photo.classList.add("photo__trigger");
      photo.tabIndex = 0;
      photo.setAttribute("role", "button");
      photo.setAttribute("aria-label", `View photograph ${index + 1} of ${photos.length}`);
      photo.addEventListener("click", function () {
        open(index, photo);
      });
      photo.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open(index, photo);
        }
      });
    });

    dialog.addEventListener("click", function (event) {
      if (event.target !== image) dismiss();
    });

    dialog.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        show(current - 1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        show(current + 1);
      }
    });

    dialog.addEventListener("close", function () {
      document.body.classList.remove("lightbox-open");
      if (opener) opener.focus();
    });
  });
})();
