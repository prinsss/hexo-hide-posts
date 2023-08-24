'use strict';

/**
 * Determine if a generator is allowed to access hidden posts based on the allowlist and blocklist.
 * Allowlist has higher priority than blocklist. Exact matches have higher priority than wildcards.
 *
 * @param {object} config Plugin config.
 * @param {string} name The name of the generator.
 * @returns Should the generator be allowed to access hidden posts.
 */
function isGeneratorAllowed(config, name) {
  if (typeof config.allowlist_function === 'function') {
    return config.allowlist_function(name);
  }

  const isWildcardAllowed = config.allowlist_generators.includes('*');
  const isWildcardBlocked = config.blocklist_generators.includes('*');

  const isExactAllowed = config.allowlist_generators.includes(name);
  const isExactBlocked = config.blocklist_generators.includes(name);

  return (
    isExactAllowed
    || (isWildcardAllowed && !isExactBlocked)
    || (isWildcardAllowed && isWildcardBlocked)
  );
}

module.exports = isGeneratorAllowed;
