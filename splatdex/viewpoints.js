// Anchors are points on the displayed models, in world coordinates after orientation.
const views = {
  'chia-seeds': [
    { label: 'Why chia gels', source: 'https://doi.org/10.1002/jsfa.6327', anchor: [.08647239, .5399996, .04287529], yaw: .3, pitch: .15, scale: .84,
      note: 'The speckled surface is the fruit wall of a tiny nutlet that encloses one seed. When it gets wet, the outer layer releases mucilage, a water-holding gel. That is why soaked chia develops a clear coating.' }
  ],
  'heart-cookie': [
    { label: 'Why the filling stays put', source: 'https://extension.umn.edu/food/preparing/cooking-at-home/food-preservation/fruit-spreads', anchor: [.02653909, .8096753, .3819088], yaw: .3, pitch: .15, scale: .86,
      note: 'The heart is cut through the top cookie. Fruit preserves can hold their shape because pectin forms a gel under the right conditions. The scan shows the filling held in the opening, but the recipe is unknown.' }
  ],
  clove: [
    { label: 'A flower picked before opening', source: 'https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A601421-1/general-information', anchor: [.04842, .29299, .19689], yaw: 1.23, pitch: .12, scale: .76,
      note: 'This is a dried clove flower bud. The rounded head contains petals that never opened. The four pointed lobes below are sepals, which protect the bud as it develops.' },
    { label: 'The flower cup', source: 'https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A601421-1/general-information', anchor: [.33814, -.53816, -.26327], yaw: 3.44, pitch: .25, scale: .86,
      note: 'The long base is the hypanthium, a tube that supports the sepals, petals, and stamens above it. It gives the dried bud its nail-like shape.' }
  ],
  cardamom: [
    { label: 'A fruit with three chambers', source: 'https://www.nparks.gov.sg/florafaunaweb/flora/8/6/8648', anchor: [-.05003, .71308, .23117], yaw: .3, pitch: .15, scale: .84,
      note: 'The ridged shell is the wall of a fruit called a capsule. In green cardamom, that wall encloses three chambers, each holding several seeds. You’re seeing the outer wall from this angle.' },
    { label: 'Where cardamom’s aroma comes from', source: 'https://www.nparks.gov.sg/florafaunaweb/flora/8/6/8648', anchor: [.03777, .37086, -.16378], yaw: 3.44, pitch: .25, scale: .82,
      note: 'The seeds sit inside the capsule and are the fragrant part cooks often crush. Cracking a pod releases the seeds so their aroma can spread through the dish.' }
  ],
  pepper: [
    { label: 'Why the skin wrinkles', source: 'https://documents1.worldbank.org/curated/en/503231468180566456/pdf/FAU19.pdf', anchor: [-.01030, 1.39806, .10303], yaw: .73, pitch: .55, scale: .82,
      note: 'Black pepper is made by drying the whole fruit. As it loses water, its outer layer shrinks and puckers, forming the wrinkles you see here.' },
    { label: 'How pepper darkens', source: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6017850/', anchor: [.03620, .88769, .87872], yaw: .73, pitch: .55, scale: .88,
      note: 'Fresh green pepper berries darken during processing. The green pigment breaks down and compounds in the fruit oxidize. Color alone can’t tell us how this particular peppercorn was dried.' },
    { label: 'What’s under the dark skin?', source: 'https://doi.usp.org/USPFCC/FCC_F105978_02_01.html', anchor: [.37565, .62914, -.33732], yaw: .73, pitch: .55, scale: .88,
      note: 'Beneath the dark fruit wall is a lighter seed. White pepper comes from the same plant and is made by removing the outer fruit wall. If the outer layer broke away here, the patch could be exposed inner tissue. The scan alone cannot confirm what caused it.' }
  ],
  'cluster-fly-s': [
    { label: 'A wing that can bend', source: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6361194/', anchor: [-.09468, .11933, -.04159], yaw: .35, pitch: .94, scale: .8,
      note: 'The dark lines reinforce a thin membrane. Studies of fly wings show that stiffness varies across the wing. That lets some areas bend and twist under load while others keep their shape.' },
    { label: 'An eye built from many lenses', source: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12488493/', anchor: [.05801, .08055, .04695], yaw: .3, pitch: .15, scale: .8,
      note: 'A compound eye is made of many light-sensing units called ommatidia, each sampling a small part of the scene. Comparing signals across them helps a fly detect motion. Individual facets are hard to resolve in this scan.' }
  ],
  roses: [
    { label: 'How roses get extra petals', source: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2823793/', anchor: [.34780, .33953, .16241], yaw: .7, pitch: .65, scale: .8,
      note: 'In many cultivated double roses, some organs that would have become pollen-producing stamens develop as petals. That is one way roses get densely layered blooms. The scan can’t establish the cultivar.' },
    { label: 'One leaf, several leaflets', source: 'https://content.ces.ncsu.edu/extension-gardener-handbook/3-botany', anchor: [-.18929, -.43627, .32578], yaw: .7, pitch: .65, scale: .88,
      note: 'Most roses have compound leaves. Follow the stem of a leaf and look for smaller blades branching from it. Those leaflets work together as one leaf, using light to make sugars.' }
  ],
  cumin: [
    { label: 'The “seed” is a dry fruit', source: 'https://plantuse.plantnet.org/en/Cuminum_cyminum_%28Jansen%2C_1981%29', anchor: [.23680, .93808, .06645], yaw: .6, pitch: .6, scale: .78,
      note: 'The ridges belong to the outer fruit wall. Cumin fruits can split into two one-seeded halves called mericarps, which is why some pieces in a jar look flatter on one side.' }
  ],
  coriander: [
    { label: 'A fruit that can split in two', source: 'https://harvest.usask.ca/items/1dce8d75-65ba-416a-8e09-11bebb55b63d', anchor: [.04501, .90477, -.02938], yaw: .7, pitch: .42, scale: .77,
      note: 'A whole coriander fruit is nearly round and is made of two one-seeded halves. When it splits, each half exposes a flatter inner face. The curved ridges belong to the outside of the fruit wall.' },
    { label: 'Where coriander stores its aroma', source: 'https://harvest.usask.ca/items/1dce8d75-65ba-416a-8e09-11bebb55b63d', anchor: [.42190, .29847, -.20101], yaw: .3, pitch: .15, scale: .86,
      note: 'Microscopy shows essential oil collects in ducts along the inner edge of each fruit half. Crushing the spice breaks those tissues open and releases the aroma. The ducts are too small to see in this scan.' }
  ],
  'poppy-seed': [
    { label: 'A seed coat under magnification', source: 'https://www.gbm.bio.uaic.ro/old_pdfs/2004/2004_GMB_41_Cvorniceanu.pdf', anchor: [.08625, .16230, .18906], yaw: .38, pitch: .22, scale: .71,
      note: 'The pits form a netlike pattern in the outer coat. Botanists compare patterns like this under a microscope to help tell poppies apart. The creator reports that this seed is roughly one millimetre across.' }
  ],
  chamomile: [
    { label: 'Many flowers in one head', source: 'https://cals.cornell.edu/weed-science/weed-profiles/chamomiles', anchor: [.28569, .83924, -.25871], yaw: .65, pitch: .54, scale: .8,
      note: 'The yellow center is a cluster of tiny disk florets. Each white petal-like strip belongs to an outer ray floret. Together they look like one flower, but each head contains many.' },
    { label: 'A clue for telling chamomiles apart', source: 'https://cals.cornell.edu/weed-science/weed-profiles/chamomiles', anchor: [-.01017, .21828, .63492], yaw: .3, pitch: .15, scale: .89,
      note: 'Look closely at the fine green leaves. Their blades are divided into narrow lobes. Botanists use leaf shape, the flower head, and other traits together to separate similar chamomiles.' }
  ],
  strawberry: [
    { label: 'Dots on the surface', source: 'https://content.ces.ncsu.edu/extension-gardener-handbook/3-botany', anchor: [.48535, .98566, .41380], yaw: .9, pitch: .67, scale: .80,
      note: 'Each dot is an achene: a small dry fruit that encloses and protects one seed. It develops from an ovary of the flower. The red flesh is the enlarged base of the flower, called the receptacle.' },
    { label: 'Green calyx', source: 'https://content.ces.ncsu.edu/extension-gardener-handbook/3-botany', anchor: [-.99413, .44476, .79579], yaw: -.9, pitch: .4, scale: .83,
      note: 'The leafy crown consists of sepals. They protected the developing flower bud and stayed attached as the strawberry grew. The dots on the fruit come from a different flower part, the ovaries.' }
  ],
  blueberry: [
    { label: 'The blossom end', source: 'https://extension.oregonstate.edu/catalog/how-blueberry-plants-develop-grow', anchor: [-.13257, .33442, -.02251], yaw: .9, pitch: .67, scale: .80,
      note: 'The star at the tip is the calyx left over from the blueberry flower. Its lobes mark the blossom end of the berry. They are sepals that remain after the petals fall.' },
    { label: 'Why blueberries look blue', source: 'https://www.bristol.ac.uk/cabot/news/2024/blueberries.html', anchor: [.54015, .24281, .17649], yaw: .9, pitch: .67, scale: .83,
      note: 'The dusty coating is a layer of wax. Tiny structures in that wax scatter light, giving blueberries their blue appearance even though the pigments underneath are dark red.' }
  ],
  'fruit-bowl': [
    { label: 'Where the citrus smell is stored', source: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6042112/', anchor: [-.08044, .09236, .06014], yaw: .9, pitch: .67, scale: .85,
      note: 'The colored outer peel contains pockets of fragrant oil. Bending or squeezing a piece of peel can burst the pockets and spray tiny droplets. This is why a twist of citrus peel releases such a strong scent.' },
    { label: 'What a glaze does', source: 'https://psap.library.illinois.edu/collection-id-guide/objectmaterials', anchor: [.03193, .00343, .09756], yaw: .9, pitch: .67, scale: .88,
      note: 'A ceramic glaze melts during firing and forms a thin glassy layer as it cools. On a bowl, a well-fired glaze can seal pores and make the surface easier to clean. A scan shows the surface but can’t tell you how it was fired.' }
  ],
  vanadinite: [
    { label: 'How a crystal cluster forms', source: 'https://pubs.usgs.gov/pp/0162/report.pdf', anchor: [-15.81178, 6.13934, .63426], yaw: -.9, pitch: .4, scale: .87,
      note: 'Vanadinite often grows as groups of short crystals on another rock. Each crystal has its own faces and can point in a different direction. The cluster is a group of crystals, not one irregular crystal.' },
    { label: 'The geometry of vanadinite', source: 'https://pubs.usgs.gov/pp/0162/report.pdf', anchor: [-3.26348, 1.08667, 5.13285], yaw: .9, pitch: .67, scale: .84,
      note: 'Vanadinite commonly forms six-sided prisms. Trace the straight edges where two faces meet. Crystal shape is a clue, but similar minerals can share it, so geologists use other tests to confirm the identification.' }
  ],
  'banded-rock': [
    { label: 'How banding can form', source: 'https://www.usgs.gov/faqs/what-are-metamorphic-rocks', anchor: [.06125, 1.17839, 1.27425], yaw: 0, pitch: 0, scale: .76,
      note: 'Bands can come from layers deposited at different times or from minerals reorganizing under heat and pressure. The pattern on this stone is a clue. It takes a closer look at the grains and their alignment to narrow down its origin.' },
    { label: 'Does the band continue through the stone?', anchor: [.48714, .54689, .57686], yaw: Math.PI, pitch: .05, scale: .94,
      note: 'Turn the stone and follow one pale stripe across an edge. A line that continues onto a second face is evidence that the feature extends into the rock. A mark that stops at the edge might be surface staining, or the band might simply turn out of view.' }
  ]
};

export function viewpointsFor(item) {
  return views[item.file] ?? [];
}
