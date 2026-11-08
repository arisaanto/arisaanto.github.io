const DRAG_THRESHOLD = 6;
const scrollBehavior = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';

export function enableCatalogScroll(shelf) {
  let gesture;
  let ignoreClick = false;
  const edge = () => shelf.scrollWidth - shelf.clientWidth;

  function step(direction) {
    const [first, second] = shelf.children;
    if (!second) return;
    shelf.scrollBy({ left: direction * (second.offsetLeft - first.offsetLeft), behavior: scrollBehavior() });
  }

  shelf.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    step(event.key === 'ArrowLeft' ? -1 : 1);
  });

  shelf.addEventListener('pointerdown', event => {
    ignoreClick = false;
    if (event.pointerType !== 'mouse' || event.button !== 0 || edge() <= 1) return;
    gesture = { id: event.pointerId, x: event.clientX, left: shelf.scrollLeft, moving: false };
  });
  shelf.addEventListener('pointermove', event => {
    if (event.pointerId !== gesture?.id || !event.buttons) return;
    const dx = event.clientX - gesture.x;
    if (!gesture.moving && Math.abs(dx) < DRAG_THRESHOLD) return;
    if (!gesture.moving) {
      gesture.moving = true;
      shelf.classList.add('dragging-covers');
      shelf.setPointerCapture(event.pointerId);
    }
    shelf.scrollLeft = gesture.left - dx;
  });
  function finish(event) {
    if (event.pointerId !== gesture?.id) return;
    ignoreClick = gesture.moving;
    shelf.classList.remove('dragging-covers');
    gesture = null;
  }
  shelf.addEventListener('pointerup', finish);
  shelf.addEventListener('pointercancel', finish);
  shelf.addEventListener('lostpointercapture', finish);
  shelf.addEventListener('dragstart', event => event.preventDefault());
  shelf.addEventListener('click', event => {
    if (ignoreClick && event.detail) {
      event.preventDefault();
      event.stopPropagation();
      ignoreClick = false;
    }
  }, true);
  return step;
}

export function enableBookPaging(book, length, render, browseCatalogs, preview) {
  let page = 0;
  let gesture;
  let suppressClick = false;
  let settling = false;
  const previous = book.querySelector('.previous-page');
  const next = book.querySelector('.next-page');
  const cover = book.querySelector('.catalog-page');
  const viewport = cover.querySelector('.catalog-viewport');

  function show(direction = 0) {
    previous.disabled = page === 0;
    next.disabled = page === length - 1;
    render(page, direction);
  }
  function turn(direction, allowCatalogSwitch = false) {
    if (settling || gesture?.dragging) return;
    const target = page + direction;
    if (target < 0 || target >= length) {
      if (allowCatalogSwitch) browseCatalogs(direction);
      return;
    }
    page = target;
    show(direction);
    // When the active corner disappears at an edge, keep keyboard focus in the book.
    if (document.activeElement?.disabled) book.querySelector('.catalog-page').focus({ preventScroll: true });
  }
  previous.onclick = () => turn(-1);
  next.onclick = () => turn(1);
  book.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    turn(event.key === 'ArrowLeft' ? -1 : 1, true);
  });
  function moveSwipe(active, dx) {
    const direction = dx < 0 ? 1 : -1;
    const available = page + direction >= 0 && page + direction < length;
    if (direction !== active.direction) {
      active.incoming?.remove();
      active.incoming = available ? preview(page + direction) : null;
      active.incoming?.setAttribute('aria-hidden', 'true');
      if (active.incoming) viewport.append(active.incoming);
      active.direction = direction;
    }
    active.offset = available ? dx : dx * .18;
    active.current.style.transform = `translateX(${active.offset}px)`;
    if (active.incoming) {
      active.incoming.style.transform = `translateX(${active.offset + direction * active.width}px)`;
    }
    active.dragging = true;
  }
  async function settleSwipe(active, commit) {
    settling = true;
    const target = commit ? -active.direction * active.width : 0;
    const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 160;
    const animations = [active.current.animate([
      { transform: `translateX(${active.offset}px)` },
      { transform: `translateX(${target}px)` }
    ], { duration, easing: 'ease-out' })];
    if (active.incoming) {
      animations.push(active.incoming.animate([
        { transform: `translateX(${active.offset + active.direction * active.width}px)` },
        { transform: `translateX(${target + active.direction * active.width}px)` }
      ], { duration, easing: 'ease-out' }));
    }
    await Promise.allSettled(animations.map(animation => animation.finished));
    active.current.style.transform = '';
    active.incoming?.remove();
    if (commit) {
      page += active.direction;
      show();
    }
    settling = false;
  }
  cover.addEventListener('touchstart', event => {
    suppressClick = false;
    if (settling) return;
    if (event.touches.length !== 1) {
      if (gesture?.dragging) settleSwipe(gesture, false);
      gesture = null;
      return;
    }
    const touch = event.touches[0];
    gesture = {
      id: touch.identifier, x: touch.clientX, y: touch.clientY, started: performance.now(),
      current: viewport.firstElementChild, width: viewport.clientWidth, dragging: false
    };
  }, { passive: true });
  cover.addEventListener('touchmove', event => {
    if (!gesture) return;
    if (event.touches.length !== 1) {
      if (gesture.dragging) settleSwipe(gesture, false);
      gesture = null;
      return;
    }
    const touch = event.touches[0];
    const dx = touch.clientX - gesture.x, dy = touch.clientY - gesture.y;
    if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      event.preventDefault();
      event.stopPropagation();
      moveSwipe(gesture, dx);
    }
  }, { passive: false });
  cover.addEventListener('touchend', event => {
    const touch = [...event.changedTouches].find(touch => touch.identifier === gesture?.id);
    if (!touch) return;
    const dx = touch.clientX - gesture.x;
    const dy = touch.clientY - gesture.y;
    const active = gesture;
    gesture = null;
    if (!active.dragging) return;
    suppressClick = true;
    const speed = Math.abs(dx) / Math.max(1, performance.now() - active.started);
    const commit = !!active.incoming && Math.abs(dx) > Math.abs(dy) * 1.25
      && (Math.abs(dx) > Math.min(60, active.width * .24) || (Math.abs(dx) > 18 && speed > .4));
    settleSwipe(active, commit);
    event.preventDefault();
    event.stopPropagation();
  }, { passive: false });
  cover.addEventListener('touchcancel', () => {
    if (gesture?.dragging) settleSwipe(gesture, false);
    gesture = null;
  });
  book.addEventListener('click', event => {
    if (!suppressClick || !event.detail) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick = false;
  }, true);
  show();
}

export function enableRosterDrag(collection, grid, canReorder, reorder, moveToCatalog) {
  let drag;
  let ignoreClick = false;
  let holdTimer;

  function tileAt(target) {
    const portrait = target.closest('#selectedPortrait');
    return target.closest('.roster-slot')?.parentElement
      ?? [...grid.children].find(entry => portrait && entry.dataset.file === portrait.dataset.file);
  }

  function begin() {
    if (!drag || drag.moving) return;
    drag.moving = true;
    if (!drag.touch) collection.setPointerCapture(drag.id);
    collection.classList.add('reordering');
    drag.tile.classList.add('drag-source');
    drag.ghost = drag.tile.querySelector('img').cloneNode();
    drag.ghost.className = 'roster-drag-preview';
    document.body.append(drag.ghost);
    drag.ghost.style.transform = `translate(${drag.x}px, ${drag.y}px) translate(-50%, -50%)`;
  }

  function catalogAt(event) {
    const tab = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-catalog]');
    return tab && tab.getAttribute('aria-current') !== 'page' ? tab : null;
  }

  collection.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch') return;
    ignoreClick = false;
    if (event.button !== 0 || !canReorder()) return;
    const tile = tileAt(event.target);
    if (!tile) return;
    drag = { id: event.pointerId, tile, x: event.clientX, y: event.clientY, moving: false, target: null, tab: null };
  });
  function move(event) {
    if (!drag.moving && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < DRAG_THRESHOLD) return;
    begin();
    drag.ghost.style.transform = `translate(${event.clientX}px, ${event.clientY}px) translate(-50%, -50%)`;
    drag.target?.tile.classList.remove('drop-before', 'drop-after');
    drag.target = null;
    const tab = catalogAt(event);
    if (tab !== drag.tab) {
      drag.tab?.classList.remove('catalog-drop-target');
      drag.tab = tab;
      tab?.classList.add('catalog-drop-target');
    }
    if (tab) return;
    const tiles = [...grid.children];
    const nearest = tiles.map((tile, index) => {
      const rect = tile.getBoundingClientRect();
      const dx = Math.max(rect.left - event.clientX, event.clientX - rect.right, 0);
      const dy = Math.max(rect.top - event.clientY, event.clientY - rect.bottom, 0);
      return { tile, index, center: rect.left + rect.width / 2, distance: Math.hypot(dx, dy) };
    }).reduce((best, item) => item.distance < best.distance ? item : best);
    const from = tiles.indexOf(drag.tile);
    const after = event.clientX > nearest.center
      || (event.clientX === nearest.center && nearest.index > from);
    const destination = nearest.index + Number(after) - Number(from < nearest.index);
    drag.target = nearest.tile === drag.tile || nearest.distance > 32 || destination === from
      ? null : { tile: nearest.tile, destination };
    drag.target?.tile.classList.add(after ? 'drop-after' : 'drop-before');
  }
  collection.addEventListener('pointermove', event => {
    if (drag?.touch || event.pointerId !== drag?.id || !event.buttons) return;
    move(event);
  });
  function finish(event) {
    if (event.pointerId !== drag?.id) return;
    clearTimeout(holdTimer);
    const { moving, target, tile, tab, ghost } = drag;
    drag = null;
    ignoreClick = moving;
    collection.classList.remove('reordering');
    tile.classList.remove('drag-source');
    target?.tile.classList.remove('drop-before', 'drop-after');
    tab?.classList.remove('catalog-drop-target');
    ghost?.remove();
    if (!moving || event.type !== 'pointerup') return;
    const destination = catalogAt(event);
    if (destination) moveToCatalog(tile.dataset.file, destination.dataset.catalog);
    else if (target) reorder(tile.dataset.file, target.destination);
  }
  for (const type of ['pointerup', 'pointercancel']) collection.addEventListener(type, event => {
    if (!drag?.touch) finish(event);
  });
  collection.addEventListener('lostpointercapture', event => {
    if (!drag?.touch && event.target === collection) finish(event);
  });
  collection.addEventListener('touchstart', event => {
    if (event.touches.length !== 1) {
      if (drag?.touch) finish({ pointerId: drag.id, type: 'pointercancel' });
      return;
    }
    ignoreClick = false;
    if (!canReorder()) return;
    const tile = tileAt(event.target);
    if (!tile) return;
    const touch = event.touches[0];
    drag = { id: touch.identifier, tile, x: touch.clientX, y: touch.clientY,
      touch: true, moving: false, target: null, tab: null };
    holdTimer = setTimeout(begin, 350);
  }, { passive: true });
  collection.addEventListener('touchmove', event => {
    if (!drag?.touch) return;
    const touch = [...event.touches].find(touch => touch.identifier === drag.id);
    if (!touch) return;
    if (!drag.moving) {
      if (Math.hypot(touch.clientX - drag.x, touch.clientY - drag.y) > 10) {
        finish({ pointerId: drag.id, type: 'pointercancel' });
      }
      return; // An ordinary swipe remains native scrolling.
    }
    event.preventDefault();
    move(touch);
  }, { passive: false });
  for (const type of ['touchend', 'touchcancel']) collection.addEventListener(type, event => {
    if (!drag?.touch) return;
    const touch = [...event.changedTouches].find(touch => touch.identifier === drag.id);
    if (!touch) return;
    if (drag.moving) event.preventDefault();
    finish({ pointerId: drag.id, clientX: touch.clientX, clientY: touch.clientY,
      type: type === 'touchend' ? 'pointerup' : 'pointercancel' });
  }, { passive: false });
  collection.addEventListener('contextmenu', event => {
    if (canReorder() && tileAt(event.target)) event.preventDefault();
  });
  collection.addEventListener('dragstart', event => event.preventDefault());
  collection.addEventListener('click', event => {
    if (ignoreClick && event.detail) {
      event.preventDefault();
      event.stopPropagation();
      ignoreClick = false;
    }
  }, true);
}
