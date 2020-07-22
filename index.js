/* global hexo */
'use strict';

const chalk = require('chalk');

// Load plugin config
const config = Object.assign({
  filter: 'hidden',
  public_generators: [],
  noindex: true,
  noindex_tag: '<meta name="robots" content="noindex">',
  html_flag: '<!-- flag of hidden posts -->'
}, hexo.config.hide_posts);

if (config.public_generators && !Array.isArray(config.public_generators)) {
  config.public_generators = [config.public_generators];
}

function debug_log(...args) {
  hexo.log.debug('hexo-hide-posts:', ...args);
}

// Modify posts in `hexo.locals` before running generators.
// @see https://github.com/hexojs/hexo/blob/master/lib/hexo/index.js#L317
//
// Typically, we remove posts which have '<filter_name>: true' assigned in
// their front-matter from `hexo.locals.posts`, therefore all
// generators ('archive', 'category', 'tag', 'feed', 'sitemap', etc.) will
// just ignore them. We also put the 'hidden' posts into `hexo.locals.hidden_posts`
// for further use (to make them correctly processed by 'post' generator).
hexo.extend.filter.register('before_generate', function () {
  // Quick fix, I don't know exactly why.
  // It works just fine without this line on Node 8.x, but on Node 10.x,
  // the `hexo.locals.posts` we got here becomes incomplete. So we have to
  // assign the values again manually. Such a weird problem, damn it.
  this._bindLocals();

  // Do the filter
  const all_posts = this.locals.get('posts');
  const hidden_posts = all_posts.find({ [config.filter]: true });
  const normal_posts = all_posts.filter(post => !post[config.filter]);
  const hidden_pages = this.locals.get('pages').find({ [config.filter]: true });

  // Exclude hidden posts from all generators except 'post'
  // @see https://github.com/hexojs/hexo/blob/master/lib/hexo/locals.js
  this.locals.set('all_posts', all_posts);
  this.locals.set('hidden_posts', hidden_posts);
  this.locals.set('posts', normal_posts);

  // Pages are currently not being processed by most of hexo generators,
  // which means they should be only accessible by permalinks by default.
  // Exceptionally, we hide it from sitemap and append noindex tag if needed.
  hidden_pages.forEach(page => {
    page.sitemap = false;
    page.save();
  });

  debug_log('hidden posts:', chalk.magenta(hidden_posts.length));
  debug_log('hidden pages:', chalk.magenta(hidden_pages.length));
});

// Hook on `after_init` filter to make sure all plugins are loaded
hexo.extend.filter.register('after_init', () => {
  // Do a copy for original generators. Don't just grab `hexo.extend.generator.store`
  // directly, that will lead to circular reference in callbacks.
  const original = {};
  for (const name in hexo.extend.generator.list()) {
    original[name] = hexo.extend.generator.get(name);
  }
  debug_log('retrieved original generator:', chalk.magenta(Object.keys(original).join(' ')));

  // Wrap and overwrite generators to inject our codes
  hexo.extend.generator.register('post', async function (locals) {
    const fg = original.post.bind(this);
    debug_log('generating both normal posts and hidden posts');

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
    debug_log('expose hidden posts to generator:', chalk.magenta(name));

    // Overwrite original generator
    hexo.extend.generator.register(name, function (locals) {
      const fg = original[name].bind(this);
      debug_log('executing wrapped generator:', chalk.magenta(name));

      return fg(Object.assign({}, locals, {
        // Build new Warehouse Query object which includes 'sage' posts
        // @see https://hexojs.github.io/warehouse/Query.html
        posts: new locals.posts.constructor(
          locals.posts.data.concat(locals.hidden_posts.data)
        )
      }));
    });
  });

  debug_log('wrapper generators initialized');

  // Hijack Category.posts and Tag.posts getter to find in hidden posts
  // @see https://github.com/hexojs/hexo/blob/master/lib/models/category.js
  if (config.public_generators.includes('category')) {
    hexo.database._models.Category.schema.virtual('posts').get(function () {
      const PostCategory = hexo.model('PostCategory');
      const ids = PostCategory.find({category_id: this._id}).map(item => item.post_id);
      const posts = hexo.locals.get('all_posts') || hexo.locals.get('posts');

      return posts.find({
        _id: {$in: ids}
      });
    });
    debug_log('hijacked Category.posts getter');
  }

  // @see https://github.com/hexojs/hexo/blob/master/lib/models/tag.js
  if (config.public_generators.includes('tag')) {
    hexo.database._models.Tag.schema.virtual('posts').get(function () {
      const PostTag = hexo.model('PostTag');
      const ids = PostTag.find({tag_id: this._id}).map(item => item.post_id);
      const posts = hexo.locals.get('all_posts') || hexo.locals.get('posts');

      return posts.find({
        _id: {$in: ids}
      });
    });
    debug_log('hijacked Tag.posts getter');
  }
});

// Usage: `$ hexo hidden:list`
hexo.extend.console.register('hidden:list', 'Show a list of all hidden articles.', function () {
  this.load().then(() => {
    [].concat(
      this.locals.get('hidden_posts').toArray(),
      this.locals.get('pages').find({ [config.filter]: true }).toArray()
    ).forEach(post => {
      console.log('');
      // Print properties
      ['source', 'slug', 'title', 'date', 'updated'].forEach(prop => {
        console.log(`${chalk.green(prop)}: ${post[prop]}`);
      });
    });
  });
});

// Append a special HTML tag to render result of hidden posts for future use.
hexo.extend.filter.register('after_post_render', data => {
  if (data[config.filter]) {
    data.content += config.html_flag;
  }
  return data;
});

// When `after_render:html` filter is triggered, no useful data but
// only a bunch of messy HTML string will be passed as argument.
// So we have to use the HTML flag set before in `after_post_render` filter
// to recognize hidden posts, and manipulate whatever we want.
if (config.noindex) {
  hexo.extend.filter.register('after_render:html', str => {
    if (str && str.includes(config.html_flag)) {
      str = str.replace('</title>', '</title>' + config.noindex_tag);
    }
    return str;
  });
}
