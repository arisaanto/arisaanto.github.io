const video = document.querySelector('[data-project-media] video');

if (video) {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const play = () => {
    video.play().catch(() => {
      video.controls = true;
    });
  };

  const togglePlayback = () => {
    if (video.controls) return;
    if (video.paused) {
      play();
    } else {
      video.pause();
    }
  };

  video.addEventListener('click', togglePlayback);
  video.addEventListener('keydown', (event) => {
    if (video.controls || ![' ', 'Enter'].includes(event.key)) return;
    event.preventDefault();
    togglePlayback();
  });
  motion.addEventListener('change', () => {
    if (motion.matches) {
      video.pause();
      video.controls = true;
    }
  });

  if (!motion.matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      if (motion.matches) return;
      video.controls = false;
      video.tabIndex = 0;
      video.title = 'Click or press Space to play or pause';
      play();
    }, { threshold: 0.25 });
    observer.observe(video);
  }
}
