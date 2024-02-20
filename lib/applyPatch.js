'use strict';

const chalk = require('chalk');

/**
 * Revert some changes introduced in Hexo 7.0 since it causes compatibility issues.
 *
 * @see https://github.com/prinsss/hexo-hide-posts/issues/34
 * @see https://github.com/hexojs/hexo/pull/5119/files
 */
function applyPatch() {
  if (!this.config.hide_posts.hexo_7_compatibility_patch) {
    return;
  }

  // Retrieve internal database models
  const Category = this.database.model('Category');
  const Tag = this.database.model('Tag');

  // Revert changes to lib/hexo/index.js
  this.locals.set('categories', () => {
    // Ignore categories with zero posts
    return Category.filter(category => category.length);
  });

  this.locals.set('tags', () => {
    // Ignore tags with zero posts
    return Tag.filter(tag => tag.length);
  });

  // Revert changes to lib/models/category.js
  Category.schema.virtual('length').get(function() {
    return this.posts.length;
  });

  // Revert changes to lib/models/tag.js
  Tag.schema.virtual('length').get(function() {
    return this.posts.length;
  });

  this.log.debug(
    'hexo-hide-posts:',
    'compatibility patch applied for Hexo',
    chalk.green(this.version)
  );
}

module.exports = applyPatch;
