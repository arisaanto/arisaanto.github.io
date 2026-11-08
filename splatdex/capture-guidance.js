// With a stationary, centred object, the camera's optical direction estimates
// the viewing angle. This measures angular coverage, not reconstructed geometry.
const SECTORS = 12;
const STEP = 360 / SECTORS;
const wrap = angle => (angle % 360 + 360) % 360;
const separation = (a, b) => Math.abs((a - b + 540) % 360 - 180);
function largestGap(angles) {
  if (angles.length < 2) return 360;
  const sorted = [...angles].sort((a, b) => a - b);
  return Math.max(...sorted.map((angle, index) => index + 1 < sorted.length
    ? sorted[index + 1] - angle : sorted[0] + 360 - angle));
}

export function cameraDirection(alpha, beta, gamma, facing = 'environment') {
  if (![alpha, beta, gamma].every(Number.isFinite)) return null;
  const a = alpha * Math.PI / 180, b = beta * Math.PI / 180, g = gamma * Math.PI / 180;
  // W3C intrinsic Z-X'-Y'' rotation. Back cameras look along device -Z.
  const sign = facing === 'user' ? 1 : -1;
  const x = sign * (Math.cos(a) * Math.sin(g) + Math.sin(a) * Math.sin(b) * Math.cos(g));
  const y = sign * (Math.sin(a) * Math.sin(g) - Math.cos(a) * Math.sin(b) * Math.cos(g));
  const z = sign * Math.cos(b) * Math.cos(g);
  return {
    heading: Math.hypot(x, y) < .05 ? null : wrap(Math.atan2(x, y) * 180 / Math.PI),
    elevation: Math.asin(Math.max(-1, Math.min(1, -z))) * 180 / Math.PI
  };
}

export class CameraOrientation {
  constructor() {
    this.facing = 'environment';
    this.latest = null;
    this.listening = false;
    this.generation = 0;
    this.onEvent = event => {
      const direction = cameraDirection(event.alpha, event.beta, event.gamma, this.facing);
      if (!direction) return;
      this.latest = { ...direction, time: performance.now() };
      this.firstReading?.();
    };
  }
  async start() {
    if (this.listening && this.reading()) return true;
    const sensor = globalThis.DeviceOrientationEvent;
    if (!sensor) return false;
    const generation = ++this.generation;
    try {
      // iOS requires this request to begin inside the shutter's click handler.
      if (typeof sensor.requestPermission === 'function' && await sensor.requestPermission() !== 'granted') return false;
      if (generation !== this.generation) return false;
      this.latest = null;
      this.listening = true;
      window.addEventListener('deviceorientation', this.onEvent);
      const received = await new Promise(resolve => {
        const finish = value => {
          clearTimeout(timer); this.firstReading = null; this.cancelWait = null; resolve(value);
        };
        const timer = setTimeout(() => finish(false), 2200);
        this.firstReading = () => finish(true);
        this.cancelWait = () => finish(false);
      });
      if (!received) this.stop();
      return received;
    } catch {
      this.stop();
      return false;
    }
  }
  reading() {
    return this.latest && performance.now() - this.latest.time < 1000 ? { ...this.latest } : null;
  }
  stop() {
    this.generation++;
    this.cancelWait?.();
    window.removeEventListener('deviceorientation', this.onEvent);
    this.listening = false;
    this.latest = null;
  }
}

export class CaptureCoverage {
  constructor() {
    this.slots = Array.from({ length: 2 }, () =>
      Array.from({ length: 2 }, () => Array.from({ length: SECTORS }, () => ({ angle: null, complete: false }))));
    this.angles = Array.from({ length: 2 }, () => [[], []]);
    this.heights = Array.from({ length: 2 }, () => [[], []]);
    this.referenceHeight = [null, null];
    this.finished = [[false, false], [false, false]];
    this.side = 0;
    this.band = null;
    this.origin = null;
    this.lastPose = null;
    this.message = 'Move slowly around the object';
  }
  bandComplete(band) {
    return this.finished[this.side][band];
  }
  sideComplete() {
    return this.bandComplete(0) && this.bandComplete(1);
  }
  complete() {
    return this.finished.every(side => side.every(Boolean));
  }
  heightValid(pose) {
    if (!pose || !Number.isFinite(pose.heading)) return false;
    const band = this.band ?? 0;
    if (pose.elevation < -10 || pose.elevation > 80) return false;
    if (band === 1) {
      const reference = this.referenceHeight[this.side];
      if (Math.abs(pose.elevation - reference) < 15) return false;
      // A high starting orbit must be followed by views of the side edges.
      if (reference >= 40 && pose.elevation > 30) return false;
    }
    return true;
  }
  accepts(pose) {
    return this.heightValid(pose) && this.angles[this.side][this.band ?? 0].every(angle => separation(angle, pose.heading) >= 10);
  }
  record(pose, usable) {
    if (!usable || this.sideComplete()) return this.report();
    if (!pose || !Number.isFinite(pose.heading)) {
      this.message = pose?.elevation > 75 ? 'Lower the camera slightly' : 'Hold steady for motion tracking';
      return this.report();
    }
    if (this.lastPose && pose.time - this.lastPose.time < 3000
        && separation(pose.heading, this.lastPose.heading) > 45) {
      this.lastPose = pose;
      this.message = 'Move more slowly around the object';
      return this.report();
    }
    if (this.band === null) this.band = 0;
    const inBand = this.band === 0
      ? pose.elevation >= -10 && pose.elevation <= 80
      : pose.elevation >= -10 && pose.elevation <= 80
        && Math.abs(pose.elevation - this.referenceHeight[this.side]) >= 15
        && (this.referenceHeight[this.side] < 40 || pose.elevation <= 30);
    if (!inBand) {
      this.message = this.referenceHeight[this.side] >= 40 ? 'Lower the phone, then circle again' : 'Raise the phone, then circle again';
      if (pose.elevation > 80) this.message = 'Lower the phone slightly';
      if (pose.elevation < -10) this.message = 'Raise the phone slightly';
      return this.report();
    }
    if (this.origin === null) this.origin = pose.heading;
    const sector = Math.floor(wrap(pose.heading - this.origin) / STEP);
    const slot = this.slots[this.side][this.band][sector];
    if (slot.angle === null) slot.angle = pose.heading;
    // Two usable views at separated directions support each sector.
    // Repeated shots from one direction cannot complete it.
    else if (separation(pose.heading, slot.angle) >= 6) slot.complete = true;
    const angles = this.angles[this.side][this.band];
    if (angles.every(angle => separation(angle, pose.heading) >= 6)) {
      angles.push(wrap(pose.heading));
      this.heights[this.side][this.band].push(pose.elevation);
    }
    // A nearly closed orbit with well-separated usable views is sufficient for
    // this capture hint. Do not require two hits in every arbitrary UI sector.
    // Actual matching and geometry are validated by the background processor.
    if (angles.length >= 18 && largestGap(angles) <= 35) this.finished[this.side][this.band] = true;
    this.lastPose = pose;
    this.message = 'Move slowly around the object';
    if (this.bandComplete(this.band) && !this.sideComplete()) {
      if (this.band === 0) {
        const heights = [...this.heights[this.side][0]].sort((a, b) => a - b);
        this.referenceHeight[this.side] = heights[Math.floor(heights.length / 2)];
      }
      this.band = 1 - this.band;
      this.message = this.referenceHeight[this.side] >= 40 ? 'Lower the phone, then circle again' : 'Raise the phone, then circle again';
    } else if (this.band === 1 && this.angles[this.side][1].length === 0) {
      this.message = this.referenceHeight[this.side] >= 40 ? 'Lower the phone, then circle again' : 'Raise the phone, then circle again';
    }
    return this.report();
  }
  flip() {
    this.side = 1 - this.side;
    this.band = this.bandComplete(0) && !this.bandComplete(1) ? 1 : 0;
    this.origin = null;
    this.lastPose = null;
    this.message = 'Start low to overlap the side edges';
  }
  restartPass() {
    if (this.sideComplete() || this.band === null) return;
    // A sensor reference can change when a camera session is interrupted.
    // Preserve finished passes and conservatively repeat the interrupted pass.
    this.slots[this.side][this.band] = Array.from({ length: SECTORS }, () => ({ angle: null, complete: false }));
    this.angles[this.side][this.band] = [];
    this.heights[this.side][this.band] = [];
    this.origin = null;
    this.lastPose = null;
  }
  report() {
    const complete = this.complete();
    const flip = !complete && this.sideComplete() && this.side === 0;
    const fractions = this.angles.map((side, s) => side.map((angles, b) => this.finished[s][b] ? 1
      : Math.min(.98, angles.length / 18, (360 - largestGap(angles)) / 325)));
    const total = fractions.flat().reduce((sum, value) => sum + value, 0);
    const band = this.band ?? 0;
    return {
      targetElevation: band === 1 ? (this.referenceHeight[this.side] >= 40 ? 25 : Math.min(75, this.referenceHeight[this.side] + 20)) : null,
      progress: total / 4, orientationProgress: (fractions[this.side][0] + fractions[this.side][1]) / 2,
      complete, flip, pause: this.sideComplete(),
      segments: this.slots[this.side][band].map(slot => this.bandComplete(band) || slot.complete ? 1 : slot.angle === null ? 0 : .5),
      label: complete ? '' : this.sideComplete() ? 'Turn over' : `${this.side === 0 ? 'First side' : 'Other side'} / ${band === 0 ? 'circle' : 'change height'}`,
      message: complete ? '' : flip ? 'Turn the object over, then start low'
        : this.sideComplete() ? 'Turn back to finish the first side' : this.message
    };
  }
}
