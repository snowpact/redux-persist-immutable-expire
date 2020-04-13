const assert = require("assert");
const expireImmutableReducer = require("../index");
const { fromJS } = require("immutable");

describe("redux-persist-immutable-expire", function () {
  it("does not change state when no configuration given", function (done) {
    const state = fromJS({ username: "redux", id: 1 });
    const reducerKey = "someReducer";

    const transform = expireImmutableReducer(reducerKey);

    const inboundOutputState = transform.in(state, reducerKey);
    assert.equal(
      inboundOutputState,
      state,
      "Input state should not be affected"
    );

    const outboundOutputState = transform.out(state, reducerKey);
    assert.equal(
      outboundOutputState,
      state,
      "Output state should not be affected"
    );

    done();
  });

  it("can set the persisted date on the default key if autoExpire", function (done) {
    const state = fromJS({ username: "redux", id: 1 });
    const reducerKey = "someReducer";

    const transform = expireImmutableReducer(reducerKey, { autoExpire: true });
    const inboundDate = new Date().getTime();
    const inboundOutputState = transform.in(state, reducerKey);
    const persistedDate = inboundOutputState.get("__persisted_at");

    const [...keys] = inboundOutputState.keys();

    // Check if it has the same keys and the __persisted_at key
    // Check if the __persisted_at has the correct current value
    assert.deepEqual(keys, ["username", "id", "__persisted_at"]);
    assert.equal(inboundOutputState.get("username"), "redux");
    assert.equal(inboundOutputState.get("id"), 1);
    assert.equal(true, persistedDate <= inboundDate + 10);
    done();
  });

  it("can set the persisted date on the given key if autoExpire", function (done) {
    const state = fromJS({ username: "redux", id: 1 });
    const reducerKey = "someReducer";

    const transform = expireImmutableReducer(reducerKey, {
      autoExpire: true,
      persistedAtKey: "updatedAt",
    });
    const inboundDate = new Date().getTime();
    const inboundOutputState = transform.in(state, reducerKey);
    const persistedDate = inboundOutputState.get("updatedAt");

    const [...keys] = inboundOutputState.keys();

    // Check if it has the same keys and the updatedAt key
    // Check if the updatedAt has the correct current value
    assert.deepEqual(keys, ["username", "id", "updatedAt"]);
    assert.equal(inboundOutputState.get("username"), "redux");
    assert.equal(inboundOutputState.get("id"), 1);
    assert.equal(true, persistedDate <= inboundDate + 10);

    done();
  });

  it("autoExpire – does not override the persisted date if date already present", function (done) {
    const reducerKey = "someReducer";

    const transform = expireImmutableReducer(reducerKey, {
      autoExpire: true,
      persistedAtKey: "updatedAt",
    });
    const inboundDate = new Date().getTime();
    const inboundOutputState = transform.in(
      fromJS({ username: "redux3", id: 13 }),
      reducerKey
    );
    const persistedDate = inboundOutputState.get("updatedAt");

    const [...keys] = inboundOutputState.keys();

    // Check if it has the same keys and the updatedAt key
    // Check if the updatedAt has the correct current value
    assert.deepEqual(keys, ["username", "id", "updatedAt"]);
    assert.equal(inboundOutputState.get("username"), "redux3");
    assert.equal(inboundOutputState.get("id"), 13);
    assert.equal(true, persistedDate <= inboundDate + 10);

    // Update the state and date value should still be same
    const inboundOutputState2 = transform.in(
      fromJS({ username: "redux35", id: 133 }),
      reducerKey
    );
    const [...keys2] = inboundOutputState2.keys();

    assert.deepEqual(keys2, ["username", "id", "updatedAt"]);
    assert.equal(inboundOutputState2.get("username"), "redux35");
    assert.equal(inboundOutputState2.get("id"), 133);

    done();
  });

  it("can expire the state after expireSeconds have passed", function (done) {
    // Use the old date (-1 seconds) so that it gets reset
    const state = fromJS({
      username: "redux",
      id: 1,
      updatedAt: new Date(Date.now() - 1000),
    });
    const reducerKey = "someReducer";

    const transform = expireImmutableReducer(reducerKey, {
      persistedAtKey: "updatedAt",
      expireSeconds: 5,
    });

    const inboundOutputState = transform.in(state, reducerKey);
    assert.deepEqual(
      inboundOutputState,
      state,
      "`in/persisting` does not affect the state"
    );

    const outboundOutputState1 = transform.out(state, reducerKey);
    assert.deepEqual(
      outboundOutputState1,
      state,
      "`out` does not reset the state before time has passed"
    );

    // Set the date to be 10 seconds older
    const newState = state.set("updatedAt", new Date(Date.now() - 10 * 1000));

    const outboundOutputState2 = transform.out(newState, reducerKey);

    assert.deepEqual(
      outboundOutputState2,
      fromJS({}),
      "`out` resets the state after time has passed"
    );

    done();
  });

  it("can expire the state to given state after expireSeconds have passed", function (done) {
    // Use the old date (-1 second) so that it gets reset
    const state = fromJS({
      username: "redux",
      id: 1,
      updatedAt: new Date(Date.now() - 1000),
    });

    const reducerKey = "someReducer";
    const transform = expireImmutableReducer(reducerKey, {
      persistedAtKey: "updatedAt",
      expireSeconds: 50,
      expiredState: fromJS({
        username: "initial",
      }),
    });

    const inboundOutputState = transform.in(state, reducerKey);
    assert.deepEqual(
      inboundOutputState,
      state,
      "`in/persisting` does not affect the state"
    );

    const outboundOutputState1 = transform.out(state, reducerKey);
    assert.deepEqual(
      outboundOutputState1,
      state,
      "`out` does not reset the state before time has passed"
    );

    const updatedState = state.set(
      "updatedAt",
      new Date(Date.now() - 60 * 1000)
    );

    const outboundOutputState2 = transform.out(updatedState, reducerKey);
    assert.deepEqual(
      outboundOutputState2,
      fromJS({ username: "initial" }),
      "`out` resets the state after time has passed"
    );

    done();
  });
});
