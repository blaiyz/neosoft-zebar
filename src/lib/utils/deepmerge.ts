/* eslint-disable @typescript-eslint/no-generated-empty-object-type -- the mapped type is only used on config objects */
export type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};

export default function deepMergeObjects<T>(
  obj1: T,
  obj2: RecursivePartial<T>
): T {
  const result = { ...obj1 };

  for (const key in obj1) {
    if (!Object.hasOwnProperty.call(obj2, key)) {
      continue;
    }

    if (obj2[key] === undefined) {
      continue;
    }

    if (Array.isArray(obj1[key])) {
      result[key] = obj2[key] as T[Extract<keyof T, string>];
    } else if (
      typeof obj1[key] === "object" &&
      obj1[key] !== null &&
      typeof obj2[key] === "object" &&
      obj2[key] !== null
    ) {
      result[key] = deepMergeObjects(obj1[key], obj2[key]);
    } else {
      result[key] = obj2[key] as T[Extract<keyof T, string>];
    }
  }

  return result;
}
