import { thumbnailImage } from './thumbnails.js';

const RESULT_PAGE_SIZE = 24;

function normalize(text) {
  return (text ?? '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

export function wireExploreSearch({ splats, categoryName, thumbnail, openSplat, submit }) {
  const get = id => document.getElementById(id);
  const form = get('exploreSearch');
  const input = get('searchInput');
  const toggle = get('searchToggle');
  const results = get('searchResults');
  const more = get('moreSearch');
  const index = splats.map(item => ({
    item,
    fields: [item.name, item.latin, categoryName(item), item.creator, item.description].map(normalize)
  }));
  let matches = [];
  let shown = 0;

  function search(query) {
    const phrase = normalize(query);
    if (!phrase) return [];
    const terms = phrase.split(' ');
    return index.flatMap(({ item, fields }) => {
      const scores = terms.map(term => {
        const field = fields.findIndex(value => value.includes(term));
        return field < 0 ? 0 : fields.length - field;
      });
      if (scores.includes(0)) return [];
      const name = fields[0];
      const bonus = name === phrase ? 20 : name.startsWith(phrase) ? 10 : 0;
      return [{ item, score: bonus + scores.reduce((sum, score) => sum + score, 0) }];
    }).sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
      .map(result => result.item);
  }

  function close() {
    if (form.hidden) return;
    form.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.onclick = () => {
    if (!form.hidden) return close();
    form.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    input.focus();
    input.select();
  };
  form.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    close();
    toggle.focus();
  });
  document.addEventListener('pointerdown', event => {
    if (!form.contains(event.target) && !toggle.contains(event.target)) close();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const query = input.value.trim();
    close();
    submit(query);
    if (query) get('searchHeading').focus();
  });

  function showMore() {
    const page = matches.slice(shown, shown + RESULT_PAGE_SIZE);
    for (const item of page) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'search-card';
      const image = new Image();
      image.alt = '';
      image.loading = 'lazy';
      thumbnailImage(image, thumbnail(item));
      const name = document.createElement('span');
      name.textContent = item.name;
      const creator = document.createElement('small');
      creator.textContent = item.creator;
      const category = document.createElement('small');
      category.textContent = categoryName(item);
      card.append(image, name, creator, category);
      card.onclick = () => openSplat(item);
      get('searchGrid').append(card);
    }
    shown += page.length;
    more.hidden = shown >= matches.length;
  }
  more.onclick = showMore;

  return {
    close,
    show(query) {
      close();
      input.value = query;
      get('bookShelf').hidden = !!query;
      get('exploreActions').hidden = !!query;
      results.hidden = !query;
      if (!query) return;
      matches = search(query);
      shown = 0;
      get('searchGrid').replaceChildren();
      get('searchSummary').textContent = matches.length
        ? `${matches.length} ${matches.length === 1 ? 'splat' : 'splats'} for “${query}”`
        : `No splats found for “${query}”`;
      showMore();
    }
  };
}
