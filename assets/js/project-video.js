const videos = [...document.querySelectorAll('[data-project-media] video')];
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const manuallyPaused = new WeakSet();
const visible = new WeakSet();

function play(video) {
  video.play().catch(() => { video.controls = true; });
}
for (const video of videos) {
  const toggle = () => {
    if (video.controls) return;
    if (video.paused) { manuallyPaused.delete(video); play(video); }
    else { manuallyPaused.add(video); video.pause(); }
  };
  video.addEventListener('click', toggle);
  video.addEventListener('keydown', event => {
    if (video.controls || ![' ', 'Enter'].includes(event.key)) return;
    event.preventDefault(); toggle();
  });
}
motion.addEventListener('change', () => {
  for (const video of videos) {
    video.controls = motion.matches;
    if (motion.matches) video.pause();
    else if (visible.has(video) && !manuallyPaused.has(video)) play(video);
  }
});
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const video = entry.target;
      if (entry.isIntersecting && entry.intersectionRatio >= .2) {
        visible.add(video);
        if (motion.matches) continue;
        video.controls = false; video.tabIndex = 0;
        video.title = 'Click or press Space to play or pause';
        if (!manuallyPaused.has(video)) play(video);
      } else { visible.delete(video); video.pause(); }
    }
  }, {threshold:[0,.2]});
  for (const video of videos) observer.observe(video);
}
