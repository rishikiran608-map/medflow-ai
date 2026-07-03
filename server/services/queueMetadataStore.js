/**
 * MedFlow AI - In-Memory Queue Metadata Store
 * Keyed by queue entry ID. Caches travel mode, ETA, and arrival timestamps.
 */
const store = new Map();

const setMetadata = (queueId, metadata) => {
  const current = store.get(queueId) || {};
  store.set(queueId, { ...current, ...metadata });
};

const getMetadata = (queueId) => {
  return store.get(queueId) || {
    travel_mode: null,
    eta_minutes: null,
    eta_timestamp: null,
    arrived_at: null,
    no_show_warning_sent: false
  };
};

const clearMetadata = (queueId) => {
  store.delete(queueId);
};

module.exports = {
  setMetadata,
  getMetadata,
  clearMetadata,
};
