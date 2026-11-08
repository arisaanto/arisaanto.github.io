// Verification cannot start until both object orientations have usable images.
export function hasBothOrientations(groups) {
  return groups.filter(group => group === 'side-1').length >= 12
    && groups.filter(group => group === 'side-2').length >= 12;
}
