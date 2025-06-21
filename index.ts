export function getAllProps(instance: any): any[] {
  const props: string[] = Object.keys(instance);
  let currentPrototype = Object.getPrototypeOf(instance);
  while (currentPrototype !== null && currentPrototype !== Object.prototype) {
    props.push(...Object.getOwnPropertyNames(currentPrototype));
    currentPrototype = Object.getPrototypeOf(currentPrototype);
  }
  const unique = [...(new Set(props)?.values?.() || [])].filter(
    (item) => item !== "constructor"
  );
  return unique;
}

type subType = {
  setterName: string | number | symbol;
  args: any[];
};

export default function createMutableStore<T>(mutableState: T): T & {
  subscribe: (fn: (sub: subType) => void) => () => void;
  reset: (newMutableState: T) => void;
} {
  const props: (keyof T)[] = getAllProps(mutableState);
  const subscriptions = new Set<(sub: subType) => void>();
  const reset = (newMutableState: T) => {
    const props = getAllProps(newMutableState);
    props.forEach((prop) => {
      //@ts-ignore
      if (typeof newMutableState[prop] !== "function") {
        //@ts-ignore
        mutableState[prop] = newMutableState[prop];
      }
    });
    // Call subscribers once with "reset" and the new state object
    subscriptions.forEach((fn) =>
      fn({ setterName: "reset", args: [newMutableState] })
    );
  };
  const subscribe = (fn: (sub: subType) => void) => {
    subscriptions.add(fn);
    return () => {
      subscriptions.delete(fn);
    };
  };
  props.forEach((prop) => {
    if (
      typeof mutableState[prop] === "function" &&
      prop.toString().startsWith("set_")
    ) {
      const _originalMethod = mutableState[prop];
      if (typeof _originalMethod === "function") {
        //@ts-ignore
        mutableState[prop] = function setter(...args: any[]) {
          const result = _originalMethod.apply(mutableState, args);
          setTimeout(
            () => subscriptions.forEach((fn) => fn({ setterName: prop, args })),
            0
          );
          return result;
        }.bind(mutableState);
      }
    }
  });
  //@ts-ignore
  mutableState.subscribe = subscribe;
  //@ts-ignore
  mutableState.reset = reset;
  return mutableState as T & {
    subscribe: (fn: (sub: subType) => void) => () => void;
    reset: (newMutableState: T) => void;
  };
}
