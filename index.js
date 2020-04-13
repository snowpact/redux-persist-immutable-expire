const { Map, fromJS } = require("immutable");
const { createTransform } = require("redux-persist");

/**
 * Transforms state on its way to being serialized and persisted
 * @param inboundState
 * @param config
 * @return {*}
 */
const transformPersistence = (currentInboundState, config) => {
  const inboundState = currentInboundState || Map;

  // If autoExpire is required i.e. user won't be setting the time
  // then on each update change the `persistedAt` to be current time
  // so that the rehydrater will pick it up based on this time if
  // the record is not updated for some time

  if (config.autoExpire && !inboundState.get(config.persistedAtKey)) {
    return inboundState.set(config.persistedAtKey, new Date().getTime());
  }

  return inboundState;
};

/**
 * Transform state being rehydrated
 * @param outboundState
 * @param config
 * @return {*}
 */
const transformRehydrate = (outboundState, config) => {
  // Check for the possible expiry if state has the persisted date

  if (config.expireSeconds && outboundState.get(config.persistedAtKey)) {
    const startTime = new Date(
      outboundState.get(config.persistedAtKey)
    ).getTime();
    const endTime = new Date().getTime();

    const duration = endTime - startTime;
    const seconds = duration / 1000;

    // If the state is older than the set expiry time,
    // reset it to initial state
    if (seconds > config.expireSeconds) {
      return config.expiredState;
    }
  }

  return outboundState;
};

/**
 * Creates transform object with the given expiry configuration
 * @param reducerKey
 * @param config
 * @return {Transform<{}, any>}
 */
function expireReducer(reducerKey, reducerConfig = {}) {
  const defaults = {
    // Key to be used for the time relative to which store is to be expired
    persistedAtKey: "__persisted_at",
    // Seconds after which store will be expired
    expireSeconds: null,
    // State to be used for resetting e.g. provide initial reducer state
    expiredState: fromJS({}),
    // Use it if you don't want to manually set the time and want the store to
    // be automatically expired if the record is not updated in the `expireSeconds` time
    autoExpire: false,
  };

  const config = { ...defaults, ...reducerConfig };

  return createTransform(
    // transform state on its way to being serialized and persisted.
    (inboundState) => transformPersistence(inboundState, config),
    // transform state being rehydrated
    (outboundState) => transformRehydrate(outboundState, config),
    // define which reducers this transform gets called for.
    {
      whitelist: [reducerKey],
    }
  );
}

module.exports = expireReducer;
