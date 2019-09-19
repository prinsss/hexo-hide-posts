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

  // Exclude hidden posts from all generators except 'post'
  // @see https://github.com/hexojs/hexo/blob/master/lib/hexo/locals.js
  this.locals.set('all_posts', all_posts);
  this.locals.set('hidden_posts', hidden_posts);
  this.locals.set('posts', normal_posts);

  hexo.log.info('%s posts are marked as hidden', chalk.magenta(hidden_posts.length));
});

// Hook on `after_init` filter to make sure all plugins are loaded
hexo.extend.filter.register('after_init', function () {
  // Do a copy for original generators. Don't just grab `hexo.extend.generator.store`
  // directly, that will lead to circular reference in callbacks.
  const original = {};
  for (const name in hexo.extend.generator.list()) {
    original[name] = hexo.extend.generator.get(name);
  }

  // Wrap and overwrite generators to inject our codes
  hexo.extend.generator.register('post', async function (locals) {
    const fg = original.post.bind(this);

    // Pass public posts and hidden posts to original generator
    const generated_public = await fg(locals);
    const generated_hidden = await fg(Object.assign({}, locals, {
      posts: locals.hidden_posts
    }));

    // Remove post.prev and post.next for hidden posts
    generated_hidden.forEach(ele => {
      ele.data.prev = ele.data.next = null;
    });

    return generated_public.concat(generated_hidden);
  });

  // Then we hack into other generators if necessary
  config.public_generators.filter(
    name => Object.keys(original).includes(name)
  ).forEach(name => {
    hexo.log.debug('Expose hidden posts to generator: %s', chalk.magenta(name));

    // Overwrite original generator
    hexo.extend.generator.register(name, function (locals) {
      const fg = original[name].bind(this);

      return fg(Object.assign({}, locals, {
        // Build new Warehouse Query object which includes 'sage' posts
        // @see https://hexojs.github.io/warehouse/Query.html
        posts: new locals.posts.constructor(
          locals.posts.data.concat(locals.hidden_posts.data)
        )
      }));
    });
  });

  hexo.log.debug('hexo-hide-posts: wrapper generators initialized');
});

// Usage: `$ hexo hidden:list`
hexo.extend.console.register('hidden:list', 'Show a list of all hidden articles.', function () {
  this.load().then(() => {
    this.locals.get('hidden_posts').forEach(post => {
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
    if (str.includes(config.html_flag)) {
      str = str.replace('</title>', '</title>' + config.noindex_tag);
    }
    return str;
  });
}
