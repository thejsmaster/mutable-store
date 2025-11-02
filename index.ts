export function getAllProps(obj: Record<any, any>) {
  const props = new Set();
  const builtins = [
    Object.prototype,
    Array.prototype,
    Function.prototype,
    String.prototype,
    Number.prototype,
    Boolean.prototype,
    Symbol.prototype,
    Date.prototype,
    RegExp.prototype,
    Map.prototype,
    Set.prototype,
    WeakMap.prototype,
    WeakSet.prototype,
    Promise.prototype,
    Error.prototype,
  ];

  while (obj && !builtins.includes(obj)) {
    for (const key of Reflect.ownKeys(obj)) {
      if (key !== "constructor") {
        props.add(key);
      }
    }
    obj = Object.getPrototypeOf(obj);
  }

  return Array.from(props);
}

export default function createMutableStore<T extends Record<any, any>>(
  mutableState: T
): T & {
  ___subscribe___: (fn: () => void) => () => void;
  ___version___: number;
  ___isStore___: boolean;
} {
  let version = 0;
  const props: (keyof T)[] = getAllProps(mutableState);
  const subscriptions = new Set<() => void>();

  const subscribe = (fn: () => void) => {
    subscriptions.add(fn);
    return () => {
      subscriptions.delete(fn);
    };
  };

  const callSubs = () => {
    setTimeout(() => subscriptions.forEach((fn) => fn()), 0);
  };

  props.forEach((prop) => {
    if (
      typeof mutableState[prop] === "function" &&
      prop.toString().startsWith("set_")
    ) {
      const _originalMethod = mutableState[prop];
      if (typeof _originalMethod === "function") {
        //@ts-ignore
        mutableState[prop] = function(...args: any[]) {
          const result = _originalMethod.apply(mutableState, args);
          version++;
          callSubs();
          return result;
        }.bind(mutableState);
      }
    }
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      mutableState,
      prop
    );
    const originalGetter = originalDescriptor?.get;
    const originalSetter = originalDescriptor?.set;

    if (!!originalGetter || !!originalSetter) {
      if (originalGetter) {
        let cachedValue: any;
        let cachedVersion: number | null = null;

        Object.defineProperty(mutableState, prop, {
          get: originalGetter
            ? function () {
                if (cachedVersion === version) {
                  return cachedValue;
                }
                cachedValue = originalGetter.call(mutableState);
                cachedVersion = version;
                return cachedValue;
              }
            : undefined,
          set: originalSetter
            ? function (value: any) {
                if (originalSetter) {
                  originalSetter.call(mutableState, value);
                }
                // Invalidate cache on set
                version++;
                callSubs();
              }
            : undefined,
          configurable: true,
          enumerable: originalDescriptor?.enumerable ?? true,
        });
      }
    }
  });
  //@ts-ignore
  mutableState.___subscribe___ = subscribe;
  //@ts-ignore
  mutableState.___version___ = version;
  //@ts-ignore
  mutableState.___isStore___ = true;
  //@ts-ignore
  return mutableState as T & {
    ___subscribe___: (fn: () => void) => () => void;
    ___version___: number;
    ___isStore___: boolean;
  };
}
