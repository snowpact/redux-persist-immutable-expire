# redux-persist-immutable-expire

Create expiring storage for your Redux stores that uses Immutable

[![npm](https://badge.fury.io/js/redux-persist-transform-immutable.svg)](https://www.npmjs.com/package/redux-persist-transform-immutable)

> Expiring transformer for [redux-persist](https://github.com/rt2zz/redux-persist) – Create expiring storage for your Redux Immutable stores.

So you tried [Redux Persist expire](https://github.com/kamranahmedse/redux-persist-expire) and it didn't work for your project because you're using Immutable ? You uses [React Boiler Plate](https://github.com/react-boilerplate/react-boilerplate) and you want to include an easy way to expire your reducers ?

Thanks @kamranahmedse for his really easy to use [Redux Persist expire](https://github.com/kamranahmedse/redux-persist-expire) transformer. I tweaked his code to adapt his plugin for Immutable.

## Installation

```javascript
yarn add redux-persist-immutable-expire
```

## Usage

Create a transform using `expireReducer(reducerKey, config)` where `reducerKey` is the reducer to which expiry is to be applied and configuration can be used to configure expire behavior.

```javascript
const { persistReducer, persistStore } = require("redux-persist");
import immutableTransform from "redux-persist-transform-immutable";

// Import the transformer creator
const expireImmutableReducer = require("redux-persist-immutable-expire");

// Create persisted reducers using redux-persist
const persistedReducers = persistReducer(
  {
    transforms: [
      // Create a transformer by passing the reducer key and configuration. Values
      // shown below are the available configurations with default values
      expireImmutableReducer("preference", {
        // (Optional) Key to be used for the time relative to which store is to be expired
        persistedAtKey: "__persisted_at",
        // (Required) Seconds after which store will be expired
        expireSeconds: null,
        // (Optional) State to be used for resetting e.g. provide initial reducer state
        expiredState: {},
        // (Optional) Use it if you don't want to manually set the time in the reducer i.e. at `persistedAtKey`
        // and want the store to  be automatically expired if the record is not updated in the `expireSeconds` time
        autoExpire: false,
      }),
      // You can add more `expireReducer` calls here for different reducers
      immutableTransform(), // immutable transform needs to be after expireImmutableReducers
    ],
  },
  rootReducer
);

export const store = createStore(persistedReducers);
export const persist = persistStore(store);
```

## Examples

Here is the configuration for the common usecases

> Expire the item in store if it has not been updated for the past `n` seconds

```javascript
// Reset `preference` key to empty object if it has not been updated for the past hour
expireImmutableReducer("preference", {
  expireSeconds: 3600,
});
```

> Reset an item to empty array after it has not been updated for the past 30 minutes

```javascript
// Reset `preference` key to given defaults if it has not been updated for the past hour
expireImmutableReducer("preference", {
  expireSeconds: 1800,
  expiredState: {
    viewType: "list",
    token: "",
  },
});
```

> Expire the item in store after 30 minutes of loading it

```javascript
// Reset `users` key to empty array if it had been loaded 30 minutes ago
expireImmutableReducer('users', {
    persistedAtKey: 'loadedAt',
    expireSeconds: 1800,
    expiredState: []        // Reset to empty array after expiry
})

// Note that in this case, you have to manually set the `loadedAt` in
// this case e.g. your reducer might look like this
...
case USERS_LOADED:
    return {
      loadedAt: moment(),  // or use (new Date()).toJSON()
      users: payload
    };
...
```

Feel free to open an issue if you need help with some specific usecase.

## Contributions

- Report issues with problems and suggestions
- Open pull request with improvements

## License

MIT &copy; [SnowPact](https://www.snowpact.com)
