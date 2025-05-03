"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMutableStore = void 0;
exports.getAllProps = getAllProps;
function getAllProps(instance) {
    var _a, _b;
    const props = Object.keys(instance);
    let currentPrototype = Object.getPrototypeOf(instance);
    while (currentPrototype !== null && currentPrototype !== Object.prototype) {
        props.push(...Object.getOwnPropertyNames(currentPrototype));
        currentPrototype = Object.getPrototypeOf(currentPrototype);
    }
    const unique = [...(((_b = (_a = new Set(props)) === null || _a === void 0 ? void 0 : _a.values) === null || _b === void 0 ? void 0 : _b.call(_a)) || [])].filter((item) => item !== "constructor");
    return unique;
}
const createMutableStore = (mutableState) => {
    const props = getAllProps(mutableState);
    const subscriptions = new Set();
    const subscribe = (fn) => {
        subscriptions.add(fn);
        return () => {
            subscriptions.delete(fn);
        };
    };
    props.forEach((prop) => {
        if (typeof mutableState[prop] === "function" &&
            !(prop.toString().startsWith("_") || prop.toString().startsWith("action_"))) {
            const originalMethod = mutableState[prop];
            //@ts-ignore
            mutableState[prop] = function (...args) {
                const result = originalMethod.apply(mutableState, args);
                setTimeout(() => subscriptions.forEach((fn) => fn({ setterName: prop, args })), 0);
                return result;
            };
        }
    });
    //@ts-ignore
    mutableState.subscribe = subscribe;
    return mutableState;
};
exports.createMutableStore = createMutableStore;
