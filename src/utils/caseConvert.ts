const is_plain_object = (value: unknown): value is Record<string, unknown> => {
  if (value === null || typeof value !== "object") {
    return false;
  }
  if (Array.isArray(value)) {
    return false;
  }
  if (value instanceof Date || value instanceof Blob || value instanceof FormData) {
    return false;
  }
  return Object.prototype.toString.call(value) === "[object Object]";
};

export const camel_to_snake_key = (key: string): string => {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1_$2")
    .toLowerCase();
};

export const deep_keys_to_snake_case = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => deep_keys_to_snake_case(item));
  }
  if (!is_plain_object(value)) {
    return value;
  }
  return Object.entries(value).reduce<Record<string, unknown>>((acc, [key, item]) => {
    acc[camel_to_snake_key(key)] = deep_keys_to_snake_case(item);
    return acc;
  }, {});
};
