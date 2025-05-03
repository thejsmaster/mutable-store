# Mutable Store

A lightweight, type-safe state management library for JavaScript/TypeScript applications that embraces mutability with a subscription pattern.

Instead of detecting state changes with proxies, it uses a subscription pattern to detect state changes. it subscribes to the set function calls and trigger subscriptions unlike other libraries. as a result, there is no performance overhead like other libraries.

Subscriptions are triggered asynchronously. they are called with setter name and arguments passed to it so the listener is aware of what setter is called and what arguments are passed to it. it helps to track the state changes correctly.

Immutable state management libraries are hard to work with for large sets of nested data. This library is an alternative to them.

## Features

- 📦 Tiny footprint with zero dependencies
- 🔄 Subscribe to state changes
- 🧩 Works with plain JavaScript objects or class instances
- 📐 Fully typed with TypeScript
- 🛠️ Simple, intuitive API

## Installation

```bash
npm install mutable-store
```

## Usage

Here is an exmaple of store with data and set functions.

```ts
import { createMutableStore } from "mutable-store";

const store = createMutableStore({
  count: 0,
  increment() {
    this.count++;
  },
});

store.subscribe((sub) => {
  console.log(sub);
});

store.increment();
```

Here is an example of a store with data, set and get functions.

```typescript
const store = createMutableStore({
  count: 0,
  increment() {
    this.count++;
  },
  _getDoubledCount() {
    return this.count * 2;
  },
});
```

notice that we are using `this` to access the state to access any of it's members or data. so always use a member function so that 'this' can be bound to the state object.

You might have noticed that the get function has an underscore (\_) prefix.

if a method's name start with "\_" then, that means it's a get function and will not trigger any subscriptions.

here is an exmple of store with data, set functions, get functions and actions.

```typescript
const store = createMutableStore({
  count: 0,
  increment() {
    this.count++;
  },
  _getDoubledCount() {
    return this.count * 2;
  },
  async action_increment() {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    this.increment();
  },
});
```

action function's name start with "action\_" and they can async and sync.

they can't mutate state directly, they have to always use setter functions.

these rules are very important to trigger subscriptions correctly because we are not using any proxies or getters or setters to detect state changes.

## Resetting the store

There is no built in way to reset the store but you can create an object from the class and then later, when you want to reset, create a new object from the class and pass it to the `reset` method of the store.

```typescript
const store = createMutableStore({
  count: 0,
  increment() {
    this.count++;
  },
});
```

## API

### createMutableStore(state: any)

Creates a mutable store from a plain JavaScript object or class instance.

#### Parameters

- `state`: The state object or class instance to make mutable.

#### Returns

The mutable state object with a `subscribe` method for subscribing to changes.

### subscribe(fn: (sub: subType) => void)

Subscribes to state changes.

```typescript
const store = createMutableStore({
  count: 0,
  increment() {
    this.count++;
  },
});
const unsubscribe = store.subscribe((sub) => {
  console.log(sub);
});

store.increment(); // { setterName: 'increment', args: [] }
unsubscribe(); // unsubscribe from the state changes
```

#### Parameters

- `fn`: The function to call when the state changes.

#### Returns

A function to unsubscribe from the state changes.
