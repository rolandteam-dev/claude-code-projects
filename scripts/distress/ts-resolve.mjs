/**
 * Node resolve hook for the self-test: lets src/ files import each other
 * without the ".ts" extension, the way Next.js resolves them.
 * Registered by scripts/distress/register.mjs.
 */
export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (e) {
    const relative = specifier.startsWith("./") || specifier.startsWith("../");
    if (e?.code === "ERR_MODULE_NOT_FOUND" && relative && !/\.[cm]?[jt]s$/.test(specifier)) {
      return next(`${specifier}.ts`, context);
    }
    throw e;
  }
}
