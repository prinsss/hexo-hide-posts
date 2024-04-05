'use strict';

const chalk = require('chalk');
const isGeneratorAllowed = require('./isGeneratorAllowed');

/**
 * Patch generators. Here we pass all posts to `post` generator to ensure that
 * every post will be rendered. And other generators could only get public posts.
 * (Those in `allowlist_generators` can still get a complete list)
 *
 * Should hook on `after_init` filter to make sure all plugins are loaded.
 */
function injectGenerators() {
  const hexo = this;
  const config = hexo.config.hide_posts;
  const log = (...args) => hexo.log.debug('hexo-hide-posts:', ...args);

  log('config.allowlist_generators', chalk.blue(JSON.stringify(config.allowlist_generators)));
  log('config.blocklist_generators', chalk.red(JSON.stringify(config.blocklist_generators)));
  log('config.allowlist_function', chalk.magenta(config.allowlist_function));
  log('config.acl_function_per_post', chalk.magenta(config.acl_function_per_post));

  // Shallow clone the original generators.
  // Don't just grab `hexo.extend.generator.store` directly,
  // that will lead to circular reference in callbacks.
  const original = {};
  for (const name in hexo.extend.generator.list()) {
    original[name] = hexo.extend.generator.get(name);
  }

  // The "post" and "page" generator are always allowed,
  // otherwise the post and page themselves won't be rendered.
  const allGeneratorNames = Object.keys(original).filter(n => n !== 'post' && n !== 'page');
  log('retrieved original generators:', chalk.yellow(JSON.stringify(allGeneratorNames)));

  // Here we choose which generators to pass all posts to
  let allowedNames = allGeneratorNames;
  const isCustomACLFunctionDefined = typeof config.acl_function_per_post === 'function';

  if (isCustomACLFunctionDefined) {
    log('use custom ACL function for generators:', chalk.green(JSON.stringify(allowedNames)));
  } else {
    allowedNames = allowedNames.filter(name => isGeneratorAllowed(config, name));
    log('generator allowed to access all posts:', chalk.green(JSON.stringify(allowedNames)));
  }

  /**
   * Build new Warehouse Query object which includes 'hidden' posts.
   * See: https://hexojs.github.io/warehouse/classes/query.default.html
   */
  const constructNewPostsQuery = generatorName => {
    // In the very first phase of generation, `all_posts` is not ready yet.
    // It will be available in the render phase eventually, so no worry here.
    const allPosts = hexo.locals.get('all_posts') || hexo.locals.get('posts');
    const QueryConstructor = allPosts.constructor;

    let postsData = allPosts.data;

    if (isCustomACLFunctionDefined) {
      postsData = postsData.filter(post => config.acl_function_per_post(post, generatorName));
    }

    return new QueryConstructor(postsData);
  };

  // Wrap and overwrite original generators to inject our codes
  allowedNames.forEach(name => {
    log('monkey-patching generator:', chalk.magenta(name));

    hexo.extend.generator.register(name, function(locals) {
      const fg = original[name].bind(this);
      const posts = constructNewPostsQuery(name);
      log('executing wrapped generator:', chalk.magenta(name), `with ${posts.count()} posts`);

      // NOTE: The `locals` here are plain object which derived from `hexo.locals.toObject()`
      return fg(Object.assign({}, locals, { posts }));
    });
  });

  // The "post" generator needs some special treatment
  hexo.extend.generator.register('post', async function(locals) {
    const fg = original.post.bind(this);
    log('generating both normal posts and hidden posts');

    // Pass public posts and hidden posts to original generator
    const generatedPublic = await fg(locals);
    const generatedHidden = await fg(Object.assign({}, locals, {
      posts: locals.hidden_posts
    }));

    // Remove post.prev and post.next for hidden posts
    generatedHidden.forEach(ele => {
      // For posts which have `layout: false` set in front-matter, the data property is a string.
      if (typeof ele.data === 'object') {
        ele.data.prev = null;
        ele.data.next = null;
      }
    });

    return generatedPublic.concat(generatedHidden);
  });

  // Special treatment for "category" and "tag" generator.
  // They use the warehouse model to query associated posts, so we need to patch them too.

  if (allowedNames.includes('category')) {
    // See: https://github.com/hexojs/hexo/blob/master/lib/models/category.js
    log('monkey-patching model getter:', chalk.magenta('Category.posts'));

    hexo.database._models.Category.schema.virtual('posts').get(function() {
      const PostCategory = hexo.model('PostCategory');
      const ids = PostCategory.find({ category_id: this._id }).map(item => item.post_id);
      const posts = constructNewPostsQuery('category');
      log('the Category.posts getter executed', chalk.green(this.name), ids.length);

      return posts.find({
        _id: { $in: ids }
      });
    });
  }

  if (allowedNames.includes('tag')) {
    // See: https://github.com/hexojs/hexo/blob/master/lib/models/tag.js
    log('monkey-patching model getter:', chalk.magenta('Tag.posts'));

    hexo.database._models.Tag.schema.virtual('posts').get(function() {
      const PostTag = hexo.model('PostTag');
      const ids = PostTag.find({ tag_id: this._id }).map(item => item.post_id);
      const posts = constructNewPostsQuery('tag');
      log('the Tag.posts getter executed', chalk.green(this.name), ids.length);

      return posts.find({
        _id: { $in: ids }
      });
    });
  }

  log('all wrapper generators initialized');
}

module.exports = injectGenerators;
