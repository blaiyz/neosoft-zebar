import schema from "#static/schema.json";

type Property = {
  type?: string | string[];
  enum?: unknown[];
  description?: string;
  minimum?: number;
  properties?: Record<string, Property>;
};

export type Option = { value: unknown; label: string };

export type Control =
  | { type: "toggle" }
  | { type: "choice"; options: Option[] }
  | { type: "number"; minimum: number | undefined }
  | { type: "text"; nullable: boolean };

export type Field = {
  path: string;
  label: string;
  description: string;
  control: Control;
};

type Selection = {
  /** Only these keys, in this order. */
  only?: string[];
  skip?: string[];
};

const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

const ACRONYMS: Record<string, string> = { cpu: "CPU" };

/** `transitionDuration` becomes `Transition duration`. */
export const toLabel = (key: string) =>
  ACRONYMS[key] ??
  capitalize(key.replace(/[A-Z0-9]+/g, (word) => ` ${word.toLowerCase()}`));

function toOption(value: unknown): Option {
  if (value === true) return { value, label: "On" };
  if (value === false) return { value, label: "Off" };
  return { value, label: capitalize(String(value)) };
}

/** `auto` is a middle way between the other two, so that's where it goes. */
const optionRank = (value: unknown) =>
  value === false ? 2 : value === "auto" ? 1 : 0;

/** Lists, and objects with no fixed keys, have no general form and get none here. */
function toControl(property: Property): Control | null {
  if (property.enum) {
    const values = property.enum.toSorted(
      (a, b) => optionRank(a) - optionRank(b)
    );
    return { type: "choice", options: values.map(toOption) };
  }

  const types = [property.type].flat();
  if (types.includes("boolean")) return { type: "toggle" };
  if (types.includes("number")) {
    return { type: "number", minimum: property.minimum };
  }
  if (types.includes("string")) {
    return { type: "text", nullable: types.includes("null") };
  }
  return null;
}

function propertyAt(path: string) {
  let property = schema as Property;
  for (const key of path.split(".").filter(Boolean)) {
    const child = property.properties?.[key];
    if (!child) throw new Error(`No setting at ${path}`);
    property = child;
  }
  return property;
}

/**
 * The fields of a group of settings, read from the JSON schema. The schema already
 * holds each key's values and description, so a new option has a form as soon as
 * it's in a group that a page shows. An empty path is the top level.
 */
export function fieldsOf(path: string, { only, skip = [] }: Selection = {}) {
  const properties = propertyAt(path).properties ?? {};
  const keys = only ?? Object.keys(properties);

  return keys.flatMap((key): Field | [] => {
    const property = properties[key];
    const control = property && toControl(property);
    if (!control || skip.includes(key)) return [];

    return {
      path: path ? `${path}.${key}` : key,
      label: toLabel(key),
      description: property.description ?? "",
      control
    };
  });
}
