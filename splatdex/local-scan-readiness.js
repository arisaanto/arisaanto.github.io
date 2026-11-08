// This validates a local capture, not a solved 3D reconstruction.
export class LocalScanReadiness {
  constructor({ persist, changed }) { Object.assign(this, { persist, changed }); this.state = { status: 'idle', count: 0, message: '' }; this.pending = null; }
  readyFor(count) { return this.state.status === 'ready' && this.state.count === count; }
  update(state) { this.state = state; this.changed(state); }
  invalidate() { this.update({ status: 'idle', count: 0, message: '' }); }
  check(record, active, currentCount) {
    if (this.pending) return this.pending;
    const count = record.photos.length;
    this.update({ status: 'checking', count, message: 'Saving scan' });
    this.pending = this.persist(record).then(saved => {
      if (saved === false) throw Error('This capture changed. Reopen it to continue');
      if (active() && currentCount() === count) this.update({ status: 'ready', count, message: '' });
      else if (active()) this.invalidate();
    }).catch(error => {
      if (active()) this.update({ status: 'failed', count, message: error.name === 'QuotaExceededError' ? 'Not enough space to save this scan' : error.message });
    }).finally(() => { this.pending = null; });
    return this.pending;
  }
}
