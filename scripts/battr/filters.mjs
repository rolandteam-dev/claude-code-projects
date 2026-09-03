/**
 * The Filter DSL — the rule language the audit lists are written in.
 *
 * A FilterSet is an OR of groups, AND within a group:
 *   { groups: [[A, B], [C]] }  =>  (A AND B) OR (C)
 *   { groups: [] } and { groups: [[]] }  =>  no constraint, always true
 *
 * A Condition is { object, field, operator, value, value_data_type, transform? }.
 *
 * This is an in-memory evaluator only. The live system compiles the same JSON to
 * SQL because it queries a mirrored Postgres copy of the CRM; we hold the fetched
 * contacts in memory and evaluate directly, so there is one implementation and
 * nothing to keep in sync.
 */

const DAY_MS = 86_400_000;

/**
 * Whole days between a timestamp and now, in tenant-local time.
 *
 * A null source is treated as INFINITELY OLD: it matches `>` comparisons and
 * fails `<` ones. A lead that has never been contacted is maximally overdue, not
 * exempt — getting this backwards would silently spare exactly the worst leads.
 */
export function daysSince(value, now = Date.now()) {
  if (value === null || value === undefined || value === "") return Number.POSITIVE_INFINITY;
  const at = new Date(value).getTime();
  if (!Number.isFinite(at)) return Number.POSITIVE_INFINITY;
  return Math.floor((now - at) / DAY_MS);
}

/** Resolve a field name, following dotted paths into nested objects. */
export function resolveField(contact, field) {
  if (!field) return undefined;
  if (!field.includes(".")) return contact?.[field];

  let cursor = contact;
  for (const part of field.split(".")) {
    if (cursor === null || cursor === undefined) return undefined;
    cursor = cursor[part];
  }
  return cursor;
}

/**
 * Coerce a stored rule value to the declared type. Values arrive as both "16"
 * and 16 for int fields, so this must not throw on either.
 */
function coerce(value, type) {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.map((v) => coerce(v, type));

  switch (type) {
    case "int":
    case "integer": {
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    }
    case "boolean":
      if (typeof value === "boolean") return value;
      return String(value).toLowerCase() === "true";
    case "date":
      return value;
    default:
      return String(value);
  }
}

/** Compare two scalars after coercing both to the condition's declared type. */
function sameValue(a, b, type) {
  const left = coerce(a, type);
  const right = coerce(b, type);
  if (left === null || right === null) return left === right;
  if (type === "int" || type === "integer") return Number(left) === Number(right);
  return String(left).toLowerCase() === String(right).toLowerCase();
}

const asArray = (v) => (Array.isArray(v) ? v : v === null || v === undefined || v === "" ? [] : [v]);

/**
 * Evaluate one condition against one contact.
 *
 * `now` is injected so tests are deterministic and a run can be replayed for a
 * past date.
 */
export function evaluateCondition(condition, contact, now = Date.now()) {
  const { field, operator, value, value_data_type: type = "text", transform } = condition;

  let actual = resolveField(contact, field);
  const isDaysSince = transform?.type === "days_since";
  if (isDaysSince) actual = daysSince(actual, now);

  const missing = actual === null || actual === undefined || actual === "";

  switch (operator) {
    case "IS NULL":
      return missing;
    case "IS NOT NULL":
      return !missing;

    case "=":
      // `value: null` with `=` means IS NULL — real rules depend on this, e.g.
      // { field: 'crm_pond_id', operator: '=', value: null } = "not in a pond".
      if (value === null) return missing;
      return sameValue(actual, value, type);

    case "!=":
      if (value === null) return !missing;
      return !sameValue(actual, value, type);

    case ">":
    case "<":
    case ">=":
    case "<=": {
      // days_since already yields a number (Infinity when never). Anything else
      // that isn't comparable fails closed rather than matching by accident.
      const left = isDaysSince ? actual : Number(coerce(actual, "int"));
      const right = Number(coerce(value, "int"));
      if (!Number.isFinite(right)) return false;
      if (Number.isNaN(left)) return false;
      if (operator === ">") return left > right;
      if (operator === "<") return left < right;
      if (operator === ">=") return left >= right;
      return left <= right;
    }

    case "IS ANY OF":
      if (missing) return false;
      return asArray(value).some((v) => sameValue(actual, v, type));

    case "IS NONE OF":
      if (missing) return true;
      return !asArray(value).some((v) => sameValue(actual, v, type));

    // Substring operators, for scalar text. `CONTAINS ANY` below is an ARRAY
    // membership test — it compares whole values — so it cannot be used to match
    // "Ylopo" against a source named "Ylopo Seller". Reaching for it there
    // returns false for every contact and the list silently reports zero, which
    // is the exact failure this project keeps hitting. These are the operators
    // for that job.
    case "MATCHES ANY": {
      if (missing) return false;
      const haystack = String(actual).toLowerCase();
      return asArray(value).some((v) => haystack.includes(String(v).toLowerCase()));
    }

    case "DOES NOT MATCH ANY": {
      if (missing) return true;
      const haystack = String(actual).toLowerCase();
      return !asArray(value).some((v) => haystack.includes(String(v).toLowerCase()));
    }

    // Array-column operators: tags_array, owner_group_ids. These compare WHOLE
    // values, not substrings — see MATCHES ANY above.
    case "CONTAINS ANY":
      return asArray(value).some((v) => asArray(actual).some((a) => sameValue(a, v, type)));

    case "DOES NOT CONTAIN ANY":
      return !asArray(value).some((v) => asArray(actual).some((a) => sameValue(a, v, type)));

    case "CONTAINS ALL":
      return asArray(value).every((v) => asArray(actual).some((a) => sameValue(a, v, type)));

    default:
      throw new Error(`Unsupported filter operator: ${operator}`);
  }
}

/**
 * Evaluate a FilterSet: OR of groups, AND within each group.
 *
 * An empty set — `{groups: []}` or `{groups: [[]]}` — means "no constraint".
 * For list membership that means everyone; for the At Risk / Neglected tiers it
 * means the list never flags anything at that tier, which is how the combined
 * roll-up lists are configured.
 */
export function evaluateSet(filterSet, contact, now = Date.now()) {
  const groups = filterSet?.groups;
  if (!Array.isArray(groups) || groups.length === 0) return true;
  return groups.some((group) => {
    if (!Array.isArray(group) || group.length === 0) return true;
    return group.every((condition) => evaluateCondition(condition, contact, now));
  });
}

/** True when a FilterSet imposes no constraint at all. */
export function isEmptySet(filterSet) {
  const groups = filterSet?.groups;
  if (!Array.isArray(groups) || groups.length === 0) return true;
  return groups.every((g) => !Array.isArray(g) || g.length === 0);
}
