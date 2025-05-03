"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = __importDefault(require("./index"));
const globals_1 = require("@jest/globals");
(0, globals_1.describe)("createMutableStore", () => {
    (0, globals_1.test)("should create a store with subscribe method", () => {
        const initialState = {
            count: 0,
            increment() {
                this.count += 1;
            },
        };
        const store = (0, index_1.default)(initialState);
        (0, globals_1.expect)(store.count).toBe(0);
        (0, globals_1.expect)(typeof store.increment).toBe("function");
        (0, globals_1.expect)(typeof store.subscribe).toBe("function");
    });
    (0, globals_1.test)("should notify subscribers when methods are called", () => {
        globals_1.jest.useFakeTimers();
        const initialState = {
            count: 0,
            increment() {
                this.count += 1;
            },
            add(n) {
                this.count += n;
            },
        };
        const store = (0, index_1.default)(initialState);
        const mockSubscriber = globals_1.jest.fn();
        store.subscribe(mockSubscriber);
        store.increment();
        // Check that subscriber hasn't been called yet (due to setTimeout)
        (0, globals_1.expect)(mockSubscriber).not.toHaveBeenCalled();
        // Fast-forward timers
        globals_1.jest.runAllTimers();
        // Now the subscriber should have been called
        (0, globals_1.expect)(mockSubscriber).toHaveBeenCalledWith({
            setterName: "increment",
            args: [],
        });
        // Reset mock and test another method
        mockSubscriber.mockReset();
        store.add(5);
        globals_1.jest.runAllTimers();
        (0, globals_1.expect)(mockSubscriber).toHaveBeenCalledWith({
            setterName: "add",
            args: [5],
        });
        // Verify the state was actually updated
        (0, globals_1.expect)(store.count).toBe(6);
        globals_1.jest.useRealTimers();
    });
    (0, globals_1.test)("should not notify subscribers for methods starting with _ or action_", () => {
        globals_1.jest.useFakeTimers();
        const initialState = {
            count: 0,
            increment() {
                this.count += 1;
            },
            _privateMethod() {
                return this.count;
            },
        };
        const store = (0, index_1.default)(initialState);
        const mockSubscriber = globals_1.jest.fn();
        store.subscribe(mockSubscriber);
        store._privateMethod();
        globals_1.jest.runAllTimers();
        // Subscriber should not be called for _privateMethod or action_specialChange
        (0, globals_1.expect)(mockSubscriber).not.toHaveBeenCalled();
        // But state should still be updated
        (0, globals_1.expect)(store.count).toBe(0);
        globals_1.jest.useRealTimers();
    });
    (0, globals_1.test)("should allow unsubscribing", () => {
        globals_1.jest.useFakeTimers();
        const initialState = {
            count: 0,
            increment() {
                this.count += 1;
            },
        };
        const store = (0, index_1.default)(initialState);
        const mockSubscriber1 = globals_1.jest.fn();
        const mockSubscriber2 = globals_1.jest.fn();
        const unsubscribe = store.subscribe(mockSubscriber1);
        store.subscribe(mockSubscriber2);
        // Unsubscribe the first subscriber
        unsubscribe();
        store.increment();
        globals_1.jest.runAllTimers();
        // First subscriber should not be called
        (0, globals_1.expect)(mockSubscriber1).not.toHaveBeenCalled();
        // Second subscriber should be called
        (0, globals_1.expect)(mockSubscriber2).toHaveBeenCalledWith({
            setterName: "increment",
            args: [],
        });
        globals_1.jest.useRealTimers();
    });
    (0, globals_1.test)("should preserve original method functionality", () => {
        const initialState = {
            values: [],
            addValue(value) {
                this.values.push(value);
                return this.values;
            },
        };
        const store = (0, index_1.default)(initialState);
        // Method should return the same value as the original
        const result = store.addValue(42);
        (0, globals_1.expect)(result).toEqual([42]);
        (0, globals_1.expect)(store.values).toEqual([42]);
    });
    (0, globals_1.test)("should handle nested objects", () => {
        const initialState = {
            nested: {
                count: 0,
            },
            increment() {
                this.nested.count += 1;
            },
        };
        const store = (0, index_1.default)(initialState);
        store.increment();
        (0, globals_1.expect)(store.nested.count).toBe(1);
    });
});
(0, globals_1.describe)("reset", () => {
    (0, globals_1.test)("should reset the store to the new state", () => {
        globals_1.jest.useFakeTimers();
        class Store {
            constructor() {
                this.count = 0;
            }
            increment() {
                this.count += 1;
            }
        }
        const store = (0, index_1.default)(new Store());
        const mockReaction = globals_1.jest.fn();
        store.increment();
        (0, globals_1.expect)(store.count).toBe(1);
        const s = new Store();
        globals_1.jest.runAllTimers();
        const unsubscribe = store.subscribe(mockReaction);
        store.reset(s);
        (0, globals_1.expect)(store.count).toBe(0);
        // subs should be called with "reset" and the new state object.
        (0, globals_1.expect)(mockReaction).toHaveBeenCalledWith({
            setterName: "reset",
            args: [s],
        });
        unsubscribe();
        globals_1.jest.useRealTimers();
    });
});
