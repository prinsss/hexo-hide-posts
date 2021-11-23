'use strict';

const chalk = require('chalk');

/**
 * Patch generators. Here we pass all posts to `post` generator to ensure that
 * every post will be rendered. And other generators could only get public posts.
 * (Those in `public_generators` can still get a complete list)
 *
 * Should hook on `after_init` filter to make sure all plugins are loaded.
 */
function injectGenerators() {
  const hexo = this;
  const config = hexo.config.hide_posts;
  const log = (...args) => hexo.log.debug('hexo-hide-posts:', ...args);

  // Do a copy for original generators. Don't just grab `hexo.extend.generator.store`
  // directly, that will lead to circular reference in callbacks.
  const original = {};
  for (const name in hexo.extend.generator.list()) {
    original[name] = hexo.extend.generator.get(name);
  }
  log('retrieved original generator:', chalk.magenta(Object.keys(original).join(' ')));

  // Wrap and overwrite generators to inject our codes
  hexo.extend.generator.register('post', async function(locals) {
    const fg = original.post.bind(this);
    log('generating both normal posts and hidden posts');

    // Pass public posts and hidden posts to original generator
    const generated_public = await fg(locals);
    const generated_hidden = await fg(Object.assign({}, locals, {
      posts: locals.hidden_posts
    }));

    // Remove post.prev and post.next for hidden posts
    generated_hidden.forEach(ele => {
      ele.data.prev = null;
      ele.data.next = null;
    });

    return generated_public.concat(generated_hidden);
  });

  // Then we hack into other generators if necessary
  config.public_generators.filter(
    name => Object.keys(original).includes(name)
  ).forEach(name => {
    log('expose hidden posts to generator:', chalk.magenta(name));

    // Overwrite original generator
    hexo.extend.generator.register(name, function(locals) {
      const fg = original[name].bind(this);
      log('executing wrapped generator:', chalk.magenta(name));

      return fg(Object.assign({}, locals, {
        // Build new Warehouse Query object which includes 'sage' posts
        // @see https://hexojs.github.io/warehouse/Query.html
        posts: new locals.posts.constructor(
          locals.posts.data.concat(locals.hidden_posts.data)
        )
      }));
    });
  });

  log('wrapper generators initialized');

  // Hijack Category.posts and Tag.posts getter to find in hidden posts
  // @see https://github.com/hexojs/hexo/blob/master/lib/models/category.js
  if (config.public_generators.includes('category')) {
    hexo.database._models.Category.schema.virtual('posts').get(function() {
      const PostCategory = hexo.model('PostCategory');
      const ids = PostCategory.find({category_id: this._id}).map(item => item.post_id);
      const posts = hexo.locals.get('all_posts') || hexo.locals.get('posts');

      return posts.find({
        _id: {$in: ids}
      });
    });
    log('hijacked Category.posts getter');
  }

  // @see https://github.com/hexojs/hexo/blob/master/lib/models/tag.js
  if (config.public_generators.includes('tag')) {
    hexo.database._models.Tag.schema.virtual('posts').get(function() {
      const PostTag = hexo.model('PostTag');
      const ids = PostTag.find({tag_id: this._id}).map(item => item.post_id);
      const posts = hexo.locals.get('all_posts') || hexo.locals.get('posts');

      return posts.find({
        _id: {$in: ids}
      });
    });
    log('hijacked Tag.posts getter');
  }
}

module.exports = injectGenerators;
