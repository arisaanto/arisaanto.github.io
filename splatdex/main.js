import * as pc from './vendor/playcanvas.mjs';
import { viewpointsFor } from './viewpoints.js';
import { thumbnailImage } from './thumbnails.js';
import { askBrowser } from './browser-guide.js';
import { wireExploreSearch } from './explore-search.js?v=20261110-nav1';
import { enableCatalogScroll, enableBookPaging, enableRosterDrag } from './shelf-interactions.js';
import { assignCatalog, createCatalog, customCatalogs, personalCategory, collectionOrder, edited, isSaved, moveEntry, saveEdits, setSaved, wasRemoved } from './collection-state.js';
const $=id=>document.getElementById(id);
const splats=[
 {name:'Clove',latin:'Syzygium aromaticum',file:'clove',creator:'Dany Bittel',scene:'39b8e009',description:'The familiar clove is a dried flower bud. This splat lets you examine its stalk and rounded, unopened head.',part:'Botanical identity is supplied by the splat title, not inferred from its 3D shape.'},
 {name:'Cardamom',latin:'Elettaria cardamomum',file:'cardamom',creator:'Dany Bittel',scene:'cb9d5969',description:'Cardamom is a spice obtained from seed capsules. Turn the splat to examine the capsule’s ridges and surface.',part:'Exact species has not been independently confirmed for this capture.'},
 {name:'Pepper',latin:'Piper nigrum',file:'pepper',creator:'Dany Bittel',scene:'02bddbe2',description:'Three peppercorns captured together. Explore the rounded forms and the folds of their dried surfaces.',part:'This is a shared splat, captured by Dany Bittel using macro photography and focus stacking.'},
 {name:'Cluster fly',latin:'Pollenia',file:'cluster-fly-s',creator:'Dany Bittel',url:'models/cluster-fly-detail.sog',category:'insects',profile:'https://danybittel.ch/',source:'https://github.com/danybittel/splats/releases/tag/splat',description:'A cluster fly captured by Dany Bittel. Rotate the capture to inspect the body, wings and legs.',part:'Creator-supplied identification: Pollenia. Found indoors in southern Switzerland in September 2025. This uses the creator’s medium-resolution model, compressed for the web.'},
 {name:'Roses',latin:'Rosa',file:'roses',category:'flowers',scene:'b3d0863d',creator:'Vladislav (@vla_tik)',profile:'https://superspl.at/user/vla_tik',description:'A cluster of red roses captured by Vladislav. Inspect the folds of the petals and the arrangement of the flowers.',part:'The original model is labelled rose by its creator. Species and cultivar have not been verified.'}

 ,{name:'Cumin',latin:'Cuminum cyminum',file:'cumin',creator:'Dany Bittel',scene:'78b0a5e6',description:'Four cumin seeds captured together. Rotate to compare their long, ridged surfaces.',part:'In botanical terms, the parts sold as cumin seeds are dried fruits.'}
 ,{name:'Coriander',latin:'Coriandrum sativum',file:'coriander',creator:'Dany Bittel',scene:'692603b8',description:'A macro capture of coriander. Turn it to see the ridges curving over the surface.',part:'Coriander seed is the dried fruit of the same plant whose fresh leaves are called cilantro.'}
 ,{name:'Poppy seed',latin:'Papaver',file:'poppy-seed',creator:'Dany Bittel',scene:'e45fd856',description:'A single seed roughly one millimeter across, according to the creator. Zoom in to see its patterned surface.',part:'Bittel captured it from 84 perspectives and used focus stacking.'}
 ,{name:'Chamomile',file:'chamomile',category:'flowers',scene:'e70870ad',creator:'Vladislav (@vla_tik)',profile:'https://superspl.at/user/vla_tik',description:'A close-up flower capture by Vladislav. Rotate to compare the center with the surrounding petals.',part:'Chamomile is the creator’s label. The species is unverified.'}
 ,{name:'Strawberry',latin:'Fragaria',file:'strawberry',optimized:true,category:'fruits',scene:'84df8849',creator:'Dany Bittel',description:'A macro capture of a strawberry. The small, seed-like fruits dot its red surface.',part:'Bittel captured the source images and Michael Moroz (@misha_m) trained the original splat with slang-splat.'}
 ,{name:'Blueberry',latin:'Vaccinium',file:'blueberry',optimized:true,category:'fruits',scene:'fd8b85a7',creator:'Dany Bittel',description:'A blueberry captured up close. Rotate it to compare the crown with the smooth blue skin.',part:'Bittel aligned the photographs in COLMAP and trained the original splat in Postshot.'}
 ,{name:'The Fruit Bowl',file:'fruit-bowl',optimized:true,category:'fruits',scene:'d8ba72a6',creator:'SuperDelphi',profile:'https://superspl.at/user/superdelphi',description:'Oranges, apples, lemons and other produce piled into a round ceramic bowl.',part:'SuperDelphi aligned 33 photographs in RealityScan and trained the original splat in LichtFeld Studio.'}
 ,{name:'Chia seeds',latin:'Salvia hispanica',file:'chia-seeds',scene:'c786e218',creator:'Dany Bittel',description:'Chia seeds seen up close. Their mottled surfaces vary from seed to seed.',part:'Bittel combined focus-stacked photographs from 106 perspectives.'}
 ,{name:'Heart Cookie',file:'heart-cookie',category:'food',scene:'bd964899',creator:'Dany Bittel',description:'A heart-shaped cookie with raspberry filling.',part:'Bittel captured the original from 145 perspectives and trained it in Brush.'}
 ,{"name": "Portuguese Rock I", "file": "banded-rock", "ext": "ply", "personal": true, "creator": "You", "category": "rocks", "description": "I picked up this reddish stone during a hike on the Rota Vicentina.", "part": "Banded rock is a descriptive name. The geological type has not been identified.", "cameraFrame": {"center": [0.41864774465560917, 0.7062936878204346, 0.9622209003567695], "front": [-0.42332350179492073, 0.19521849138186034, 0.8846959666748099], "up": [0.6496312110162784, -0.615241581241535, 0.44660618713239897], "right": [-0.6314875315488101, -0.7637850072723386, -0.13362619565184194], "radius": 1.6577885283288882, "splats": 21735}, "sourceCaptureIds": ["af2f91a8-6b70-4f91-a320-9e06d84c171e", "daac8d74-4b46-4a53-a630-505c6eb54c93", "a02a2989-7d69-4500-ba08-9cec71fb4438"]}
 ,{name:'Vanadinite',file:'vanadinite',optimized:true,category:'rocks',scene:'663d6a97',creator:'doudoid',profile:'https://superspl.at/user/doudoid',description:'A close-up mineral scan labelled vanadinite by its creator.',part:'The identification comes from the creator. The original was captured with two macro cameras and cross-polarised lighting.'},
 {"name": "Tasmanian Shell I", "file": "tasmanian-shell", "ext": "ply", "category": "shells", "personal": true, "creator": "You", "description": "A shell collected at Wineglass Bay in Tasmania, during Christmas with my family.", "part": "Its cap-like form resembles a limpet shell. Exact species has not been established.", "cameraFrame": {"center": [0.09005692601203918, 0.16138887405395508, 0.30130696296691895], "front": [0.8283204099167789, 0.25997212586759116, -0.4962859984798935], "right": [-0.5335945132447228, 0.09606658230560265, -0.840266688140883], "up": [-0.17076941749161872, 0.9608255333493205, 0.2182936107941939], "radius": 1.3126219511032104, "splats": 24302}, "sourceCaptureIds": ["9a5423b6-f87f-418c-ba5b-090ce3ed05dd"]},
 {"name": "Switzerland Rock I", "file": "switzerland-rock", "ext": "ply", "personal": true, "category": "rocks", "creator": "You", "description": "Collected beside a small stream near Berg\u00fcn, at the end of the Kesch Trek with a friend.", "part": "The green-blue colour is visible; the geological type has not been confirmed.", "cameraFrame": {"center": [0.002645905828103423, -0.16667592525482178, 0.30734896659851074], "front": [-0.6933823400871252, 0.3281093228194297, 0.6415334774852187], "right": [0.17293240826237222, -0.7885208911471276, 0.5901941938015961], "up": [0.6995107666275614, 0.5201721604464382, 0.4900057253426806], "radius": 0.7893533110618591, "splats": 16782}, "sourceCaptureIds": ["3184b229-9b33-43ad-8b34-e68334a5d835", "dac71997-855a-4d1e-a2c3-2c21cf50bf2d"]}
];
let app,camera,entity,current=0,loadToken=0,dark=false,yaw=.3,pitch=.15,distance=3,radius=1,target=new pc.Vec3(),assets=new Map(),thumbs=new Map(splats.map(item=>[item.file,`thumbs/${item.file}.png`])),selected=0,inCollection=true,screen="explore",ready=false,activeCategory="spices";
const canvas = $('scene');
const categoryOf = item => item.category ?? 'spices';
let viewerShared = false;
const activeItem = () => viewerShared ? splats[current] : edited(splats[current]);
function status(t){$('status').textContent=t;$('collectionNotice').textContent=t;}
let viewAnimation = 0;
let loadedFile = null;
let displayedAsset = null;
let activeView = -1;
let pinButtons = [];
let pinsQueued = false;
let noteSide = 0;
let guideViews = [];
let frameAspect = Math.min(1, innerWidth / innerHeight);
const lookTarget = new pc.Vec3();
const projection = new pc.Vec3();

function updateCamera() {
  if (!camera || !loadedFile) return;
  const frame = splats[current].cameraFrame;
  const x = Math.sin(yaw) * Math.cos(pitch);
  const y = Math.sin(pitch);
  const z = Math.cos(yaw) * Math.cos(pitch);
  const orbit = frame
    ? new pc.Vec3(...frame.right).mulScalar(x)
      .add(new pc.Vec3(...frame.up).mulScalar(y))
      .add(new pc.Vec3(...frame.front).mulScalar(z))
    : new pc.Vec3(x, y, z);
  camera.camera.nearClip = Math.min(radius * .005, distance * .12);
  camera.setPosition(lookTarget.clone().add(orbit.mulScalar(distance)));
  camera.lookAt(lookTarget, frame ? new pc.Vec3(...frame.up) : pc.Vec3.UP);
  if (innerWidth <= 600 && activeView >= 0 && !$('viewpoints').hidden) {
    const offset = $('askForm').hidden ? .12 : .19;
    const shift = distance * 2 * Math.tan(Math.PI / 8) * offset;
    camera.translate(camera.up.clone().mulScalar(-shift));
  }
  updateZoomControls();
  queuePins();
}

function fitDistance() {
  return radius * (splats[current].cameraFrame ? 3.8 : 3.3) / frameAspect;
}

function queuePins() {
  if (pinsQueued || $('viewpoints').hidden) return;
  pinsQueued = true;
  app.once('postrender', () => {
    pinsQueued = false;
    if (loadedFile) placePins();
  });
}

function placePins() {
  if ($('viewpoints').hidden) return;
  const position = camera.getPosition();
  const fromCenter = position.clone().sub(target).normalize();
  const forward = camera.forward;
  const narrow = innerWidth <= 600;
  const viewerTop = narrow ? $('splatInfo').getBoundingClientRect().top : innerHeight;
  const navigation = $('annotationNav');
  navigation.style.bottom = narrow ? `${innerHeight - viewerTop + 8}px` : '';
  const noteBottom = narrow ? Math.min(viewerTop, navigation.getBoundingClientRect().top) - 12 : innerHeight - 75;
  const gutter = narrow ? 28 : Math.min(140, innerWidth * .12);
  const gap = narrow ? 42 : 36;
  const closest = distance / fitDistance() < .54;
  const columns = [[], []];
  const caption = $('viewCaption');
  let panel;
  for (const pin of pinButtons) {
    camera.camera.worldToScreen(pin.anchor, projection);
    const toAnchor = pin.anchor.clone().sub(position);
    const back = pin.anchor.clone().sub(target).dot(fromCenter) < -radius * .12;
    const inFrame = projection.x > 10 && projection.x < innerWidth - 10
      && projection.y > 70 && projection.y < innerHeight - 85;
    const visible = !closest && inFrame && toAnchor.dot(forward) > 0 && !back;
    pin.button.hidden = !visible || pin.index === activeView;
    pin.line.style.display = visible ? '' : 'none';
    if (pin.index === activeView) {
      if (projection.x < innerWidth * .44) noteSide = 0;
      if (projection.x > innerWidth * .56) noteSide = 1;
      const width = caption.offsetWidth;
      const height = caption.offsetHeight;
      const margin = narrow ? 14 : 28;
      const x = noteSide ? innerWidth - width - margin : margin;
      const bottom = noteBottom;
      const y = Math.max(83, narrow ? bottom - height : Math.min(projection.y - 24, bottom - height));
      caption.style.left = `${x}px`;
      caption.style.top = `${y}px`;
      panel = { x, y, width, height };
      drawLeader(pin.line, noteSide ? x : x + width, y + 24, projection.x, projection.y);
    } else if (visible) {
      const side = narrow || projection.x < innerWidth / 2 ? 0 : 1;
      columns[side].push({ pin, x: projection.x, y: projection.y });
    }
  }
  for (const [side, column] of columns.entries()) {
    const x = side ? innerWidth - gutter : gutter;
    column.sort((a, b) => a.y - b.y);
    const top = 100;
    const bottom = Math.max(top, narrow ? noteBottom - 15 : innerHeight - 155);
    let previous = top - gap;
    for (const [i, point] of column.entries()) {
      const y = Math.max(previous + gap, Math.min(point.y, bottom - (column.length - 1 - i) * gap));
      if (panel && x > panel.x - 18 && x < panel.x + panel.width + 18
          && y > panel.y - 18 && y < panel.y + panel.height + 18) {
        point.pin.button.hidden = true;
        point.pin.line.style.display = 'none';
        continue;
      }
      point.pin.button.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`;
      drawLeader(point.pin.line, x, y, point.x, point.y);
      previous = y;
    }
  }
}

function drawLeader(line, x1, y1, x2, y2) {
  line.setAttribute('x1', x1);
  line.setAttribute('y1', y1);
  line.setAttribute('x2', x2);
  line.setAttribute('y2', y2);
}

function markView(index) {
  const previous = activeView;
  activeView = index;
  const view = guideViews[index];
  if (index !== previous) {
    closeChat();
    renderConversation();
  }
  const activeButton = $('viewButtons').children[index];
  if (activeButton) activeButton.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  $('viewCaption').hidden = !view;
  $('viewNumber').textContent = index + 1;
  $('viewLabel').textContent = view?.label ?? '';
  $('viewNote').textContent = view?.note ?? '';
  const source = $('viewSource');
  source.hidden = !view?.source;
  if (view?.source) source.href = view.source;
  for (const [i, button] of [...$('viewButtons').children].entries()) {
    button.setAttribute('aria-pressed', String(i === index));
  }
}

function cancelView() {
  cancelAnimationFrame(viewAnimation);
  viewAnimation = 0;
}

function moveToView(index, animate = true) {
  cancelView();
  const item = splats[current];
  const view = guideViews[index];
  const toYaw = view?.yaw ?? (item.cameraFrame ? 0 : .3);
  const toPitch = view?.pitch ?? (item.cameraFrame ? 0 : .15);
  const toDistance = fitDistance() * clampZoom(view?.scale ?? 1);
  const toTarget = view ? target.clone().lerp(target, pinButtons[index].anchor, view.focus ?? .3) : target;
  markView(index);
  if (!animate || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    yaw = toYaw;
    pitch = toPitch;
    distance = toDistance;
    lookTarget.copy(toTarget);
    updateCamera();
    return;
  }
  const fromYaw = yaw, fromPitch = pitch, fromDistance = distance, fromTarget = lookTarget.clone();
  const yawChange = Math.atan2(Math.sin(toYaw - fromYaw), Math.cos(toYaw - fromYaw));
  const start = performance.now();
  function frame(now) {
    const progress = Math.min(1, (now - start) / 420);
    const eased = 1 - (1 - progress) ** 3;
    yaw = fromYaw + yawChange * eased;
    pitch = fromPitch + (toPitch - fromPitch) * eased;
    distance = fromDistance + (toDistance - fromDistance) * eased;
    lookTarget.lerp(fromTarget, toTarget, eased);
    updateCamera();
    viewAnimation = progress < 1 ? requestAnimationFrame(frame) : 0;
  }
  viewAnimation = requestAnimationFrame(frame);
}

function reset() {
  if (loadedFile === splats[current].file) moveToView(-1, false);
}

function setLearn(open) {
  $('viewpoints').hidden = !open;
  $('infoBtn').setAttribute('aria-expanded', String(open));
  if (open) updateCamera();
  else closeChat();
}

function renderViewpoints(item) {
  guideViews = item.notes ?? viewpointsFor(item);
  const buttons = guideViews.map((view, index) => {
    const button = document.createElement('button');
    button.textContent = String(index + 1);
    button.title = view.label;
    button.setAttribute('aria-label', `View ${index + 1}, ${view.label}`);
    button.onclick = () => moveToView(index);
    return button;
  });
  pinButtons = guideViews.map((view, index) => {
    const button = document.createElement('button');
    button.className = 'annotation-pin';
    button.setAttribute('aria-label', `Pin ${index + 1}, ${view.label}`);
    button.hidden = true;
    button.onclick = () => moveToView(index);
    button.textContent = String(index + 1);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    return { button, line, anchor: new pc.Vec3(...view.anchor), index };
  });
  $('viewButtons').replaceChildren(...buttons);
  $('viewPins').replaceChildren(...pinButtons.map(pin => pin.button));
  $('pinLeaders').replaceChildren(...pinButtons.map(pin => pin.line));
  $('annotationNav').hidden = !guideViews.length;
}
function loadAsset(item) {
  if (assets.has(item.file)) return assets.get(item.file);
  const promise = new Promise((resolve, reject) => {
    const asset = new pc.Asset(item.file, 'gsplat', { url: item.url ?? `models/${item.file}.${item.ext ?? 'sog'}`, filename: `${item.file}.${item.ext ?? 'sog'}` });
    asset.once('load', () => resolve(asset));
    asset.once('error', error => {
      assets.delete(item.file);
      app.assets.remove(asset);
      reject(error);
    });
    app.assets.add(asset);
    app.assets.load(asset);
  });
  assets.set(item.file, promise);
  return promise;
}

function releaseAsset(asset) {
  if (app.assets.get(asset.id) !== asset) return;
  assets.delete(asset.name);
  app.assets.remove(asset);
  asset.unload();
}
async function showSplat(i) {
  if ($('editDialog').open) $('editDialog').close();
  cancelView();
  entity?.destroy();
  entity = null;
  loadedFile = null;
  cancelAnchor();
  setLearn(false);
  conversations.clear();
  const token = ++loadToken;
  current = i;
  const item = splats[current];
  if (displayedAsset && displayedAsset.name !== item.file) {
    releaseAsset(displayedAsset);
    displayedAsset = null;
  }
  renderDetails();
  $('sharedCredit').hidden = !!item.personal;
  $('personalCredit').hidden = !item.personal;
  $('description').textContent = item.description;
  $('part').textContent = item.part;
  $('modelChanges').hidden = !item.optimized;
  $('source').href = item.source ?? `https://superspl.at/scene/${item.scene}`;
  $('creatorCredit').textContent = item.creator;
  $('creatorCredit').href = item.profile ?? 'https://superspl.at/user/danylyon';
  $('infoBtn').disabled = true;
  status('Loading splat…');
  try {
    const asset = await loadAsset(item);
    if (token !== loadToken) {
      if (splats[current].file !== item.file) releaseAsset(asset);
      return;
    }
    displayedAsset = asset;
    entity = new pc.Entity(item.name, app);
    entity.setEulerAngles(0, 0, item.personal ? 0 : 180);
    entity.addComponent('gsplat', { asset });
    app.root.addChild(entity);
    const bounds = new pc.BoundingBox();
    bounds.setFromTransformedAabb(asset.resource.aabb, entity.getWorldTransform());
    target.copy(item.cameraFrame ? new pc.Vec3(...item.cameraFrame.center) : bounds.center);
    radius = item.cameraFrame?.radius ?? Math.max(bounds.halfExtents.length(), .01);
    camera.camera.farClip = radius * 100;
    loadedFile = item.file;
    renderViewpoints(activeItem());
    reset();
    $('infoBtn').disabled = false;
    status('');
  } catch (error) {
    if (token !== loadToken) return;
    if (displayedAsset?.name === item.file) {
      entity?.destroy();
      entity = null;
      releaseAsset(displayedAsset);
      displayedAsset = null;
    }
    console.error(error);
    status('The splat could not load. Please reload and try again.');
  }
}
let lastRemoved;
const categories = [
  { id: 'spices', name: 'Spices & Seeds' },
  { id: 'insects', name: 'Insects' },
  { id: 'flowers', name: 'Flowers' },
  { id: 'fruits', name: 'Fruits' },
  { id: 'rocks', name: 'Rocks' },
  { id: 'shells', name: 'Shells' },
  { id: 'food', name: 'Baked goods' }
];
const entriesFor = category => splats.filter(item => categoryOf(item) === category);
const sharedFor = category => entriesFor(category).filter(item => !item.personal);
const personalEntries = category => splats.filter(item => personalCategory(item) === category);
const unsorted = { id: 'unsorted', name: 'Unsorted' };
let draftCatalogs = new Set();
const personalCatalogs = () => {
  const explicit = customCatalogs();
  const implicit = [...categories, unsorted].filter(category =>
    !explicit.some(item => item.id === category.id)
    && (draftCatalogs.has(category.id) || personalEntries(category.id).some(isSaved)));
  return [...implicit, ...explicit];
};
const catalogsFor = browse => browse ? categories.filter(category => sharedFor(category.id).length) : personalCatalogs();
const defaultCatalog = browse => catalogsFor(browse)[0]?.id ?? unsorted.id;
let lastPersonalCatalog = null;
const visibleEntries = () => screen === 'discover' ? sharedFor(activeCategory) : collectionOrder(activeCategory, personalEntries(activeCategory));

function selectRoster(index) {
  selected = index;
  const entry = splats[index];
  $('selectedPortrait').hidden = !entry;
  $('emptyShelf').hidden = !!entry;
  if (!entry) return;
  const item = screen === 'discover' ? entry : edited(entry);
  $('selectedPortrait').dataset.file = item.file;
  $('selectedName').textContent = item.name;
  $('selectedSubtitle').textContent = item.latin ?? '';
  $('selectedSubtitle').hidden = !item.latin;
  $('selectedCreator').textContent = item.personal ? 'Your capture' : `By ${item.creator}`;
  $('selectedPortrait').setAttribute('aria-label', `Open ${item.name}`);
  const image = new Image();
  image.alt = '';
  thumbnailImage(image, thumbs.get(item.file));
  image.dataset.thumbnailFile = item.file;
  $('selectedPortrait').querySelector('.portrait').replaceChildren(image);
  for (const button of $('grid').querySelectorAll('.roster-slot')) {
    const matches = Number(button.dataset.splatIndex) === index;
    button.classList.toggle('selected', matches);
    button.setAttribute('aria-pressed', String(matches));
  }
}

function renderBooks() {
  const shelf = $('bookShelf');
  const browseCatalogs = enableCatalogScroll(shelf);
  for (const category of categories) {
    const entries = sharedFor(category.id);
    if (!entries.length) continue;
    const book = document.createElement('article');
    book.className = 'catalog-book';
    book.setAttribute('aria-label', `${category.name} booklet`);
    book.innerHTML = `
      <div class="book-paper">
        <button type="button" class="catalog-title"></button>
        <button type="button" class="catalog-page">
          <span class="catalog-viewport"></span>
        </button>
        <span class="catalog-count" aria-live="polite"></span>
        <button type="button" class="page-corner previous-page" aria-label="Previous page"></button>
        <button type="button" class="page-corner next-page" aria-label="Next page"></button>
      </div>`;
    const title = book.querySelector('.catalog-title');
    title.textContent = category.name;
    title.setAttribute('aria-label', `Open ${category.name} catalog`);
    title.onclick = () => collectionView(category.id, true, true);
    const paper = book.querySelector('.book-paper');
    const page = book.querySelector('.catalog-page');
    const pictures = new Map();
    const viewport = page.querySelector('.catalog-viewport');
    const count = book.querySelector('.catalog-count');
    function pageContent(index) {
      const item = entries[index];
      if (!item) return null;
      if (!pictures.has(index)) {
        const picture = new Image();
        picture.alt = '';
        picture.draggable = false;
        thumbnailImage(picture, thumbs.get(item.file));
        picture.dataset.thumbnailFile = item.file;
        const content = document.createElement('span');
        content.className = 'catalog-slide';
        const caption = document.createElement('span');
        caption.className = 'catalog-item';
        caption.textContent = item.name;
        content.append(picture, caption);
        pictures.set(index, content);
      }
      return pictures.get(index);
    }
    enableBookPaging(book, entries.length, (index, direction) => {
      if (direction && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        turnCatalogSheet(book, paper, direction);
      }
      const item = entries[index];
      const content = pageContent(index);
      content.removeAttribute('aria-hidden');
      content.style.transform = '';
      viewport.replaceChildren(content);
      pageContent(index - 1);
      pageContent(index + 1);
      page.setAttribute('aria-label', `Open ${item.name} splat`);
      page.onclick = () => splatView(splats.indexOf(item));
      count.textContent = `${index + 1} / ${entries.length}`;
    }, browseCatalogs, pageContent);
    shelf.append(book);
  }
}

function turnCatalogSheet(book, paper, direction) {
  book.querySelector('.turn-viewport')?.remove();
  const viewport = document.createElement('div');
  viewport.className = 'turn-viewport';
  viewport.setAttribute('aria-hidden', 'true');
  viewport.inert = true;
  const width = paper.getBoundingClientRect().width;
  const stripCount = 14;
  const stripWidth = width / stripCount;
  const strips = [];
  // Narrow strips share a cylindrical bend so the free edge curls ahead of the spine.
  for (let index = 0; index < stripCount; index++) {
    const strip = document.createElement('div');
    strip.className = 'turn-strip';
    const u = index / stripCount;
    const left = direction > 0 ? u * width : width - (index + 1) * stripWidth;
    strip.style.width = `${stripWidth + .35}px`;
    strip.style.left = `${left}px`;
    strip.style.transformOrigin = direction > 0 ? 'left center' : 'right center';
    const front = document.createElement('div');
    front.className = 'turn-front';
    const content = paper.cloneNode(true);
    content.querySelector(direction > 0 ? '.next-page' : '.previous-page').disabled = false;
    content.style.width = `${width}px`;
    content.style.left = `${-left}px`;
    front.append(content);
    const back = document.createElement('div');
    back.className = 'turn-back';
    strip.append(front, back);
    viewport.append(strip);
    strips.push({ strip, u });
  }
  book.append(viewport);
  const animations = strips.map(({ strip, u }) => {
    const frames = Array.from({ length: 13 }, (_, index) => {
      const t = index / 12;
      const base = t * Math.PI;
      const curve = .96 * Math.sin(Math.PI * t);
      const angle = base + curve * u;
      // Integrate the angle from the binding to this strip for a continuous surface.
      const x = curve ? (Math.sin(angle) - Math.sin(base)) / curve : u * Math.cos(base);
      const z = curve ? (Math.cos(base) - Math.cos(angle)) / curve : u * Math.sin(base);
      return { transform: `translate3d(${direction * width * (x - u)}px,0,${width * z}px) rotateY(${-direction * angle}rad)` };
    });
    return strip.animate(frames, { duration: 650, easing: 'ease-in-out' });
  });
  Promise.allSettled(animations.map(animation => animation.finished)).then(() => viewport.remove());
}

function renderCatalogTabs(browse) {
  const nav = $('categoryNav');
  const catalogs = catalogsFor(browse);
  const snapshot = JSON.stringify([browse, activeCategory, catalogs]);
  if (nav.dataset.snapshot === snapshot) return;
  const links = catalogs.map(category => {
    const link = document.createElement('a');
    link.textContent = category.name;
    link.href = `#${browse ? 'discover' : 'collection'}/${category.id}`;
    if (!browse) link.dataset.catalog = category.id;
    if (category.id === activeCategory) link.setAttribute('aria-current', 'page');
    link.onclick = event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      collectionView(category.id, true, browse);
    };
    return link;
  });
  nav.replaceChildren(...links);
  nav.dataset.snapshot = snapshot;
}

function renderGrid(preferred = splats[current]) {
  const browse = screen === 'discover';
  $('collectionTitle').textContent = browse ? 'Catalogs' : 'Your collection';
  $('rosterHelp').hidden = browse;
  $('undoRemoval').hidden = browse || !lastRemoved;
  $('restoreHidden').hidden = browse || !splats.some(item => wasRemoved(item.file));
  $('newCatalog').hidden = browse;
  renderCatalogTabs(browse);
  const entries = visibleEntries();
  const grid = $('grid');
  grid.replaceChildren();
  for (const [slot, entry] of entries.entries()) {
    const index = splats.indexOf(entry);
    const item = browse ? entry : edited(entry);
    const tile = document.createElement('div');
    tile.className = 'roster-tile';
    tile.dataset.file = item.file;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'roster-slot';
    button.dataset.splatIndex = index;
    button.setAttribute('aria-label', item.name);
    button.innerHTML = `<span class="slot-portrait"><img alt="" loading="lazy" draggable="false"></span><span class="slot-number">${String(slot + 1).padStart(3, '0')}</span><span class="slot-name"></span>`;
    const portrait = button.querySelector('img');
    portrait.dataset.thumbnailFile = item.file;
    thumbnailImage(portrait, thumbs.get(item.file));
    button.querySelector('.slot-name').textContent = item.name;
    button.onpointerenter = event => {
      if (event.pointerType === 'mouse' && !event.buttons) selectRoster(index);
    };
    button.onfocus = () => selectRoster(index);
    button.onclick = () => splatView(index);

    const membership = document.createElement('button');
    membership.type = 'button';
    membership.className = 'slot-membership';
    const saved = isSaved(entry);
    const label = saved ? `Remove ${item.name} from your collection` : `Add ${item.name} to your collection`;
    membership.setAttribute('aria-label', label);
    membership.title = label;
    membership.textContent = saved ? '−' : '+';
    membership.onclick = () => {
      if (!changeSaved(item.file, !saved)) return;
      const replacement = $('grid').querySelector(`[data-file="${item.file}"] .slot-membership`);
      const sameTile = $('grid').querySelector(`[data-file="${item.file}"] .roster-slot`);
      (replacement ?? sameTile ?? $('grid').querySelector('.roster-slot') ?? $('newCatalog')).focus({ preventScroll: true });
    };
    tile.append(button);
    if (!browse || !saved) tile.append(membership);

    if (!browse) {
      button.setAttribute('aria-describedby', 'rosterHelp');
      button.onkeydown = event => {
        const directions = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 };
        const offset = directions[event.key];
        if (!event.altKey || !offset) return;
        if (event.shiftKey && !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        if (event.shiftKey) {
          const catalogs = personalCatalogs();
          const index = catalogs.findIndex(category => category.id === activeCategory);
          const destination = catalogs[index + offset];
          if (destination) moveToCatalog(item.file, destination.id, true);
        } else {
          reorder(item.file, slot + offset, true);
        }
      };
    }
    grid.append(tile);
  }
  selectRoster(splats.indexOf(entries.includes(preferred) ? preferred : entries[0]));
}

function collectionView(category = lastPersonalCatalog, push = true, browse = false) {
  cancelView();
  cancelAnchor();
  setLearn(false);
  const known = browse ? categories : [...categories, unsorted, ...customCatalogs()];
  category = known.some(item => item.id === category) ? category : defaultCatalog(browse);
  activeCategory = category;
  if (!browse) lastPersonalCatalog = category;
  screen = browse ? 'discover' : 'collection';
  $('explore').hidden = true;
  updateNavigation();
  inCollection = true;
  document.body.classList.add('at-home');
  window.scrollTo(0, 0);
  $('collection').hidden = false;
  renderGrid();
  if (app && ready) app.autoRender = false;
  const hash = `#${browse ? 'discover' : 'collection'}/${category}`;
  if (push && location.hash !== hash) history.pushState({}, '', hash);
}

$('newCatalog').onclick = () => {
  $('catalogError').textContent = '';
  $('catalogForm').reset();
  $('catalogDialog').showModal();
  $('catalogName').focus();
};
$('catalogForm').onsubmit = event => {
  event.preventDefault();
  const name = $('catalogName').value.trim();
  if (!name) {
    $('catalogError').textContent = 'Enter a catalog name.';
    return;
  }
  const sameName = item => item.name.toLowerCase() === name.toLowerCase();
  if (personalCatalogs().some(sameName)) {
    $('catalogError').textContent = 'A catalog already uses that name.';
    return;
  }
  try {
    const builtIn = [...categories, unsorted].find(sameName);
    const catalog = createCatalog(builtIn?.name ?? name, builtIn?.id);
    $('catalogDialog').close();
    collectionView(catalog.id);
  } catch {
    $('catalogError').textContent = 'This browser could not save the catalog.';
  }
};

function moveToCatalog(file, destination, focus = false) {
  const item = splats.find(entry => entry.file === file);
  if (!item || !isSaved(item) || personalCategory(item) === destination
      || !personalCatalogs().some(catalog => catalog.id === destination)) return;
  try {
    const order = collectionOrder(destination, personalEntries(destination)).map(entry => entry.file);
    assignCatalog(file, destination, order);
    collectionView(destination);
    selectRoster(splats.indexOf(item));
    if (focus) $('grid').querySelector(`[data-file="${file}"] .roster-slot`)?.focus();
  } catch {
    status('This browser could not save the move.');
  }
}

function changeSaved(file, saved) {
  try {
    setSaved(file, saved);
    if (saved && lastRemoved === file) lastRemoved = null;
    if (!saved) lastRemoved = file;
    if (screen === 'collection' && !personalCatalogs().some(category => category.id === activeCategory)) {
      collectionView(saved ? personalCategory(splats.find(item => item.file === file)) : defaultCatalog(false));
    } else if (screen === 'collection' || screen === 'discover') {
      renderGrid(splats[selected]);
    }
    if (screen === 'viewer') {
      closeChat();
      cancelAnchor();
      if ($('editDialog').open) $('editDialog').close();
      renderDetails();
      renderViewpoints(activeItem());
      markView(-1);
      conversations.clear();
      queuePins();
    }
    return true;
  } catch {
    status('This browser could not save the change.');
    return false;
  }
}

function reorder(file, next, focus = false) {
  const entry = splats.find(item => item.file === file);
  if (!entry || next < 0 || next >= visibleEntries().length) return;
  try {
    moveEntry(activeCategory, personalEntries(activeCategory), file, next);
    renderGrid(entry);
    if (focus) $('grid').querySelector(`[data-file="${file}"] .roster-slot`).focus({ preventScroll: true });
  } catch {
    status('This browser could not save the order.');
  }
}
enableRosterDrag($('collection'), $('grid'), () => screen === 'collection', reorder, moveToCatalog);
$('undoRemoval').onclick = () => changeSaved(lastRemoved, true);
function renderRemoved() {
  const buttons = splats.filter(item => wasRemoved(item.file)).map(item => {
    const button = document.createElement('button');
    button.className = 'removed-splat';
    button.setAttribute('aria-label', `Restore ${edited(item).name}`);
    const image = document.createElement('img');
    image.alt = ''; thumbnailImage(image, thumbs.get(item.file));
    image.dataset.thumbnailFile = item.file;
    const name = document.createElement('span'); name.textContent = edited(item).name;
    const plus = document.createElement('span'); plus.className = 'restore-plus'; plus.textContent = '＋'; plus.setAttribute('aria-hidden', 'true');
    button.append(image, name, plus);
    button.onclick = () => {
      if (changeSaved(item.file, true) && !renderRemoved()) $('restoreDialog').hidePopover();
    };
    return button;
  });
  $('removedList').replaceChildren(...buttons);
  return buttons.length;
}
$('restoreHidden').onclick = () => {
  const panel = $('restoreDialog');
  if (panel.matches(':popover-open')) { panel.hidePopover(); return; }
  if (!renderRemoved()) return;
  panel.showPopover();
  const anchor = $('restoreHidden').getBoundingClientRect(), bounds = panel.getBoundingClientRect();
  panel.style.left = `${Math.max(12, Math.min(innerWidth - bounds.width - 12, anchor.right - bounds.width))}px`;
  panel.style.top = `${Math.max(12, anchor.top - bounds.height - 8)}px`;
};
$('restoreHidden').setAttribute('aria-haspopup', 'dialog');
$('restoreHidden').setAttribute('aria-controls', 'restoreDialog');
$('restoreDialog').addEventListener('toggle', event => $('restoreHidden').setAttribute('aria-expanded', String(event.newState === 'open')));
window.addEventListener('resize', () => { if ($('restoreDialog').matches(':popover-open')) $('restoreDialog').hidePopover(); });

function splatView(i, push = true, shared = ['explore', 'discover', 'search'].includes(screen)) {
  viewerShared = shared && !splats[i].personal;
  screen = 'viewer';
  $('explore').hidden = true;
  updateNavigation();
  inCollection = false;
  document.body.classList.remove('at-home');
  window.scrollTo(0, 0);
  $('collection').hidden = true;
  if (!app) init();
  if (ready) {
    app.autoRender = true;
    showSplat(i);
  }
  if (push) history.pushState({ shared: viewerShared }, '', `#splat/${splats[i].file}`);
  canvas.focus({ preventScroll: true });
}

$('selectedPortrait').onclick = () => splatView(selected);
function updateNavigation() {
  $('exploreBtn').setAttribute('aria-current', ['explore', 'discover', 'search'].includes(screen) ? 'page' : 'false');
  $('collectionBtn').setAttribute('aria-current', screen === 'collection' ? 'page' : 'false');
  $('searchToggle').hidden = !['explore', 'discover', 'search'].includes(screen);
  if ($('searchToggle').hidden) exploreSearch.close();
}
function exploreView(push = true, query = '') {
  cancelView();
  cancelAnchor();
  setLearn(false);
  screen = query ? 'search' : 'explore';
  exploreSearch.show(query);
  inCollection = true;
  document.body.classList.add('at-home');
  $('collection').hidden = true;
  $('explore').hidden = false;
  window.scrollTo(0, 0);
  updateNavigation();
  if (app && ready) app.autoRender = false;
  const hash = query ? `#search/${encodeURIComponent(query)}` : '#explore';
  if (push && location.hash !== hash) history.pushState({}, '', hash);
}
$('exploreBtn').onclick = () => exploreView();
$('backToCatalogs').onclick = event => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  exploreView();
};
function openRoute() {
  const [route, id] = location.hash.slice(1).split('/');
  if (route === 'splat') {
    const index = splats.findIndex(item => item.file === id);
    if (index >= 0) return splatView(index, false, history.state?.shared ?? !isSaved(splats[index]));
  }
  if (route === 'search') {
    try { return exploreView(false, decodeURIComponent(id ?? '').slice(0, 120)); }
    catch { return exploreView(false); }
  }
  if (route === 'collection' || route === 'discover') {
    return collectionView(id, false, route === 'discover');
  }
  exploreView(false);
}
window.addEventListener('popstate', openRoute);
history.scrollRestoration='manual';


function viewerPixelRatio() {
  return Math.min(devicePixelRatio, 3, Math.sqrt(5_500_000 / (innerWidth * innerHeight)));
}

async function init(){try{app=new pc.Application(canvas,{graphicsDeviceOptions:{antialias:false,alpha:true,preserveDrawingBuffer:true}});app.graphicsDevice.maxPixelRatio=viewerPixelRatio();app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);app.setCanvasResolution(pc.RESOLUTION_AUTO);camera=new pc.Entity('Camera');camera.addComponent('camera',{clearColor:new pc.Color(0,0,0,0),fov:45});app.root.addChild(camera);app.start();window.addEventListener('resize',()=>{app.graphicsDevice.maxPixelRatio=viewerPixelRatio();app.resizeCanvas();
  cancelView();
  const aspect = Math.min(1, innerWidth / innerHeight);
  distance *= frameAspect / aspect;
  frameAspect = aspect;
  updateCamera();});ready=true;if(inCollection)app.autoRender=false;}catch(e){console.error(e);status('3D rendering is unavailable in this browser. Try a browser with WebGL enabled.');}}
$('reset').onclick = reset;
$('home').onclick = () => exploreView();
$('collectionBtn').onclick = () => {
  const category = personalCatalogs().some(item => item.id === lastPersonalCatalog)
    ? lastPersonalCatalog : defaultCatalog(false);
  collectionView(category);
};
$('infoBtn').onclick = () => setLearn($('viewpoints').hidden);
let learningRequest;
const conversations = new Map();
const noteConversation = () => conversations.get(activeView) ?? [];
function renderDetails() {
  const item = activeItem();
  $('title').textContent = item.name;
  $('latin').textContent = item.latin ?? '';
  $('latin').hidden = !item.latin;
  $('detailTitle').textContent = item.name;
  $('description').textContent = item.description;
  $('saveSplat').textContent = isSaved(item) ? 'Remove from collection' : 'Save to collection';
  for (const id of ['editInfo', 'editNotesFromAbout', 'notesBtn']) $(id).hidden = !isSaved(item);
}
$('aboutBtn').onclick = () => {
  renderDetails();
  $('details').showModal();
};
$('saveSplat').onclick = () => changeSaved(activeItem().file, !isSaved(activeItem()));

function closeChat() {
  learningRequest?.abort();
  learningRequest = null;
  $('askForm').hidden = true;
  $('askForm').reset();
  $('askBtn').setAttribute('aria-expanded', 'false');
  $('askForm').querySelector('button').disabled = false;
  $('askStatus').textContent = '';
  if (loadedFile) updateCamera();
}

function renderConversation() {
  $('conversation').replaceChildren();
  for (const turn of noteConversation()) appendMessage(turn.role === 'user' ? 'question' : 'answer', turn.content);
}

$('askBtn').onclick = () => {
  if (!$('askForm').hidden) return closeChat();
  renderConversation();
  $('askForm').hidden = false;
  updateCamera();
  $('askBtn').setAttribute('aria-expanded', 'true');
  $('askQuestion').focus({ preventScroll: true });
};
function appendMessage(role, content) {
  const message = document.createElement('p');
  message.className = role;
  message.textContent = content;
  $('conversation').append(message);
  $('conversation').scrollTop = $('conversation').scrollHeight;
}
$('askForm').onsubmit = async event => {
  event.preventDefault();
  const question = $('askQuestion').value.trim();
  if (!question || learningRequest || !guideViews[activeView]) return;
  const request = new AbortController();
  learningRequest = request;
  const button = $('askForm').querySelector('button');
  const item = activeItem();
  const note = guideViews[activeView];
  const conversation = noteConversation();
  button.disabled = true;
  $('askQuestion').value = '';
  appendMessage('question', question);
  queuePins();
  try {
    const answer = await askBrowser({
      item, note, question, conversation: conversation.slice(-4)
    }, request.signal, message => {
      $('askStatus').textContent = message;
      queuePins();
    });
    if (learningRequest !== request) return;
    appendMessage('answer', answer);
    conversations.set(activeView, [...conversation, { role: 'user', content: question }, { role: 'assistant', content: answer }]);
    queuePins();
    $('askStatus').textContent = '';
  } catch (error) {
    if (learningRequest === request) {
      $('askStatus').textContent = error.message;
      $('askQuestion').value = question;
    }
  } finally {
    if (learningRequest === request) {
      learningRequest = null;
      button.disabled = false;
    }
  }
};

let noteDrafts = [];
let noteIndex = -1;
let picking = false;
function cancelAnchor() {
  picking = false;
  $('anchorHelp').hidden = true;
  canvas.classList.remove('picking');
}
function keepNoteFields() {
  if (!noteDrafts[noteIndex]) return;
  noteDrafts[noteIndex].label = $('noteName').value.trim();
  noteDrafts[noteIndex].note = $('noteBody').value.trim();
}
function showNoteEditor() {
  const note = noteDrafts[noteIndex];
  const list = $('noteList');
  list.replaceChildren(...noteDrafts.map((entry, index) => new Option(`${index + 1} / ${entry.label || 'Untitled'}`, index)));
  list.value = String(noteIndex);
  $('noteFields').hidden = !note;
  for (const id of ['pickAnchor', 'deleteNote']) $(id).disabled = !note;
  $('noteName').value = note?.label ?? '';
  $('noteBody').value = note?.note ?? '';
  $('noteAnchorState').textContent = note?.anchor ? 'Point set on object' : 'Choose a point on the object';
}
function openEditor(notes) {
  if (!isSaved(splats[current])) return;
  closeChat();
  if (viewerShared) {
    viewerShared = false;
    history.replaceState({ shared: false }, '', location.href);
    renderDetails();
    renderViewpoints(activeItem());
    markView(-1);
  }
  const item = activeItem();
  $('editHeading').textContent = notes ? 'Edit learning notes' : 'Edit info';
  $('editMetadata').hidden = notes;
  $('editNotes').hidden = !notes;
  $('noteStatus').textContent = '';
  $('editName').value = item.name;
  $('editSubtitle').value = item.latin ?? '';
  $('editDescription').value = item.description;
  if (notes) {
    noteDrafts = guideViews.map(note => ({ ...note }));
    noteIndex = activeView >= 0 ? activeView : noteDrafts.length ? 0 : -1;
    showNoteEditor();
  }
  if ($('details').open) $('details').close();
  $('editDialog').showModal();
}
$('editInfo').onclick = () => openEditor(false);
$('editNotesFromAbout').onclick = () => openEditor(true);
$('notesBtn').onclick = () => openEditor(true);
$('noteList').onchange = () => {
  keepNoteFields();
  noteIndex = Number($('noteList').value);
  showNoteEditor();
};
$('addNote').onclick = () => {
  keepNoteFields();
  noteIndex = noteDrafts.push({ label: '', note: '' }) - 1;
  showNoteEditor();
  $('noteName').focus();
};
$('deleteNote').onclick = () => {
  noteDrafts.splice(noteIndex, 1);
  noteIndex = Math.min(noteIndex, noteDrafts.length - 1);
  showNoteEditor();
};
$('pickAnchor').onclick = () => {
  keepNoteFields();
  picking = true;
  $('editDialog').close();
  $('anchorHelp').hidden = false;
  canvas.classList.add('picking');
};
$('cancelAnchor').onclick = () => {
  cancelAnchor();
  $('editDialog').showModal();
};
function pickModelPoint(x, y) {
  const centers = displayedAsset?.resource.centers;
  if (!centers) return null;
  const point = new pc.Vec3();
  const world = new pc.Vec3();
  const screenPoint = new pc.Vec3();
  const transform = entity.getWorldTransform();
  const origin = camera.getPosition();
  const forward = camera.forward;
  let best = Infinity;
  let anchor;
  for (let i = 0; i < centers.length; i += 3) {
    point.set(centers[i], centers[i + 1], centers[i + 2]);
    transform.transformPoint(point, world);
    camera.camera.worldToScreen(world, screenPoint);
    const pixel = Math.hypot(screenPoint.x - x, screenPoint.y - y);
    if (pixel > 12) continue;
    const depth = (world.x - origin.x) * forward.x + (world.y - origin.y) * forward.y + (world.z - origin.z) * forward.z;
    const score = pixel + depth / radius * 5;
    if (depth > 0 && score < best) {
      best = score;
      anchor = [world.x, world.y, world.z];
    }
  }
  return anchor;
}
canvas.addEventListener('click', event => {
  if (!picking) return;
  const anchor = pickModelPoint(event.clientX, event.clientY);
  if (!anchor) {
    $('anchorHelp').querySelector('span').textContent = 'No surface here. Try another point.';
    return;
  }
  Object.assign(noteDrafts[noteIndex], {
    anchor, yaw, pitch, scale: Math.max(.42, distance / fitDistance())
  });
  cancelAnchor();
  showNoteEditor();
  $('editDialog').showModal();
});
$('editDialog').addEventListener('close', () => {
  $('anchorHelp').querySelector('span').textContent = 'Tap a point on the object';
});
$('editForm').onsubmit = event => {
  event.preventDefault();
  if (!isSaved(splats[current])) {
    $('editDialog').close();
    return;
  }
  const item = activeItem();
  try {
    if ($('editNotes').hidden) {
      const name = $('editName').value.trim();
      if (!name) {
        $('editName').setCustomValidity('Enter a name');
        return $('editName').reportValidity();
      }
      saveEdits(item.file, {
        name, latin: $('editSubtitle').value.trim(), description: $('editDescription').value.trim()
      });
      renderDetails();
      markView(activeView);
    } else {
      keepNoteFields();
      if (noteDrafts.some(note => !note.label || !note.note || !note.anchor)) {
        $('noteStatus').textContent = 'Each note needs a title, an explanation and a point on the object';
        return;
      }
      saveEdits(item.file, { notes: noteDrafts });
      conversations.clear();
      renderViewpoints(activeItem());
      markView(-1);
      queuePins();
    }
    $('editDialog').close();
  } catch {
    const error = 'This browser could not save the edits.';
    if ($('editNotes').hidden) {
      $('editName').setCustomValidity(error);
      $('editName').reportValidity();
    }
    else $('noteStatus').textContent = error;
  }
};
$('editName').oninput = () => $('editName').setCustomValidity('');
function applyTheme(value){dark=value;document.body.classList.toggle('dark',dark);$('theme').setAttribute('aria-pressed',String(dark));document.querySelector('meta[name="theme-color"]').content=dark?'#000000':'#ffffff';if(camera)camera.camera.clearColor=new pc.Color(0,0,0,0);try{localStorage.setItem('splatdex-theme',dark?'dark':'light');}catch{}}
$('theme').onclick=()=>applyTheme(!dark);
try{applyTheme(localStorage.getItem('splatdex-theme')==='dark');}catch{applyTheme(false);}
for(const dialog of document.querySelectorAll('dialog')){dialog.querySelector('.close').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});}
const zoomMin = .0125;
const sliderZoomMin = .18;
const zoomMax = 1.7;
const clampZoom = value => Math.min(zoomMax, Math.max(zoomMin, value));
function updateZoomControls() {
  const scale = clampZoom(distance / fitDistance());
  $('zoomRange').value = 100 * Math.log(zoomMax / Math.max(sliderZoomMin, scale)) / Math.log(zoomMax / sliderZoomMin);
  $('zoomRange').setAttribute('aria-valuetext', `${Math.round(100 / scale)} percent`);
  $('zoomIn').disabled = scale <= zoomMin + .00001;
  $('zoomOut').disabled = scale >= zoomMax - .001;
}
function zoomTo(scale, point) {
  if (!loadedFile) return;
  cancelView();
  const nextDistance = fitDistance() * clampZoom(scale);
  if (point) {
    // Keep the point on the orbit plane under the cursor as the camera moves.
    const rect = canvas.getBoundingClientRect();
    const worldPerPixel = 2 * Math.tan(camera.camera.fov * Math.PI / 360)
      * (distance - nextDistance) / rect.height;
    lookTarget.add(camera.right.clone().mulScalar((point.x - rect.left - rect.width / 2) * worldPerPixel));
    lookTarget.add(camera.up.clone().mulScalar((rect.top + rect.height / 2 - point.y) * worldPerPixel));
    const offset = lookTarget.clone().sub(target);
    if (offset.length() > radius * 1.25) lookTarget.copy(target).add(offset.normalize().mulScalar(radius * 1.25));
  }
  distance = nextDistance;
  updateCamera();
}
function zoomBy(factor, point) { zoomTo(distance / fitDistance() * factor, point); }
$('zoomRange').oninput = () => zoomTo(zoomMax * (sliderZoomMin / zoomMax) ** (Number($('zoomRange').value) / 100));
$('zoomOut').onclick = () => zoomBy(1.23);
$('zoomIn').onclick = () => zoomBy(1 / 1.23);

const pointers = new Map();
let lastPinch = 0;
canvas.addEventListener('pointerdown', event => {
  if (picking) return;
  cancelView();
  canvas.setPointerCapture(event.pointerId);
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  lastPinch = 0;
});
canvas.addEventListener('pointermove', event => {
  if (!pointers.has(event.pointerId)) return;
  const old = pointers.get(event.pointerId);
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (pointers.size === 1) {
    yaw -= (event.clientX - old.x) * .007;
    pitch = Math.max(-1.45, Math.min(1.45, pitch + (event.clientY - old.y) * .007));
    updateCamera();
  } else {
    const [first, second] = pointers.values();
    const gap = Math.hypot(first.x - second.x, first.y - second.y);
    if (lastPinch && gap > 0) zoomBy(lastPinch / gap, { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 });
    lastPinch = gap;
  }
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  canvas.addEventListener(type, event => { pointers.delete(event.pointerId); lastPinch = 0; });
}
canvas.addEventListener('wheel', event => {
  event.preventDefault();
  const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
  zoomBy(Math.exp(delta * .001), { x: event.clientX, y: event.clientY });
}, { passive: false });
canvas.addEventListener('keydown', event => {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', 'r'].includes(event.key)) return;
  event.preventDefault();
  cancelView();
  if (event.key === 'r') return reset();
  if (event.key === '+' || event.key === '=') return zoomBy(.9);
  if (event.key === '-') return zoomBy(1.12);
  if (event.key === 'ArrowLeft') yaw -= .1;
  if (event.key === 'ArrowRight') yaw += .1;
  if (event.key === 'ArrowUp') pitch = Math.min(1.45, pitch + .1);
  if (event.key === 'ArrowDown') pitch = Math.max(-1.45, pitch - .1);
  updateCamera();
});
const exploreSearch = wireExploreSearch({
  splats: splats.filter(item => !item.personal),
  categoryName: item => categories.find(category => category.id === categoryOf(item))?.name ?? '',
  thumbnail: item => thumbs.get(item.file),
  openSplat: item => splatView(splats.indexOf(item)),
  submit: query => exploreView(true, query)
});
renderBooks();
openRoute();
