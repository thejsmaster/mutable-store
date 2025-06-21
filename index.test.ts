import createMutableStore from "./index";
import { expect, test, describe, jest } from "@jest/globals";

describe("createMutableStore", () => {
  test("should create a store with subscribe method", () => {
    const initialState = {
      count: 0,
      set_increment() {
        this.count += 1;
      },
    };

    const store = createMutableStore(initialState);

    expect(store.count).toBe(0);
    expect(typeof store.set_increment).toBe("function");
    expect(typeof store.subscribe).toBe("function");
  });

  test("should notify subscribers when methods are called", () => {
    jest.useFakeTimers();

    const initialState = {
      count: 0,
      set_increment() {
        this.count += 1;
      },
      set_add(n: number) {
        this.count += n;
      },
    };

    const store = createMutableStore(initialState);
    const mockSubscriber = jest.fn();

    store.subscribe(mockSubscriber);
    store.set_increment();

    // Check that subscriber hasn't been called yet (due to setTimeout)
    expect(mockSubscriber).not.toHaveBeenCalled();

    // Fast-forward timers
    jest.runAllTimers();

    // Now the subscriber should have been called
    expect(mockSubscriber).toHaveBeenCalledWith({
      setterName: "increment",
      args: [],
    });

    // Reset mock and test another method
    mockSubscriber.mockReset();
    store.set_add(5);
    jest.runAllTimers();

    expect(mockSubscriber).toHaveBeenCalledWith({
      setterName: "add",
      args: [5],
    });

    // Verify the state was actually updated
    expect(store.count).toBe(6);

    jest.useRealTimers();
  });

  test("should not notify subscribers for methods starting with _ or action_", () => {
    jest.useFakeTimers();

    const initialState = {
      count: 0,
      increment() {
        this.count += 1;
      },
      _privateMethod() {
        return this.count;
      },
    };

    const store = createMutableStore(initialState);
    const mockSubscriber = jest.fn();

    store.subscribe(mockSubscriber);

    store._privateMethod();
    jest.runAllTimers();

    // Subscriber should not be called for _privateMethod or action_specialChange
    expect(mockSubscriber).not.toHaveBeenCalled();

    // But state should still be updated
    expect(store.count).toBe(0);

    jest.useRealTimers();
  });

  test("should allow unsubscribing", () => {
    jest.useFakeTimers();

    const initialState = {
      count: 0,
      increment() {
        this.count += 1;
      },
    };

    const store = createMutableStore(initialState);
    const mockSubscriber1 = jest.fn();
    const mockSubscriber2 = jest.fn();

    const unsubscribe = store.subscribe(mockSubscriber1);
    store.subscribe(mockSubscriber2);

    // Unsubscribe the first subscriber
    unsubscribe();

    store.increment();
    jest.runAllTimers();

    // First subscriber should not be called
    expect(mockSubscriber1).not.toHaveBeenCalled();

    // Second subscriber should be called
    expect(mockSubscriber2).toHaveBeenCalledWith({
      setterName: "increment",
      args: [],
    });

    jest.useRealTimers();
  });

  test("should preserve original method functionality", () => {
    const initialState = {
      values: [] as number[],
      addValue(value: number): number[] {
        this.values.push(value);
        return this.values;
      },
    };

    const store = createMutableStore(initialState);

    // Method should return the same value as the original
    const result = store.addValue(42);

    expect(result).toEqual([42]);
    expect(store.values).toEqual([42]);
  });

  test("should handle nested objects", () => {
    const initialState = {
      nested: {
        count: 0,
      },
      increment() {
        this.nested.count += 1;
      },
    };

    const store = createMutableStore(initialState);

    store.increment();

    expect(store.nested.count).toBe(1);
  });
});

describe("reset", () => {
  test("should reset the store to the new state", () => {
    jest.useFakeTimers();

    class Store {
      count = 0;
      set_increment() {
        this.count += 1;
      }
    }

    const store = createMutableStore(new Store());
    const mockReaction = jest.fn();

    store.set_increment();
    expect(store.count).toBe(1);
    const s = new Store();
    jest.runAllTimers();
    const unsubscribe = store.subscribe(mockReaction);

    store.reset(s);
    expect(store.count).toBe(0);
    // subs should be called with "reset" and the new state object.

    expect(mockReaction).toHaveBeenCalledWith({
      setterName: "reset",
      args: [s],
    });
    unsubscribe();
    jest.useRealTimers();
  });
});
