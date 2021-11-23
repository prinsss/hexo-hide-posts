/* global hexo */
'use strict';

// Load plugin config
hexo.config.hide_posts = Object.assign({
  enable: true,
  filter: 'hidden',
  public_generators: [],
  noindex: true,
  noindex_tag: '<meta name="robots" content="noindex">',
  html_flag: '<!-- flag of hidden posts -->'
}, hexo.config.hide_posts);

const config = hexo.config.hide_posts;

if (!config.enable) {
  return;
}

if (config.public_generators && !Array.isArray(config.public_generators)) {
  config.public_generators = [config.public_generators];
}

// Prepare hidden posts
hexo.extend.filter.register('before_generate', require('./lib/prepareHiddenPosts'));

// Hook into generators
hexo.extend.filter.register('after_init', require('./lib/injectGenerators'));

// Add a command to get a list of all hidden posts.
// Usage: `$ hexo hidden:list`
hexo.extend.console.register(
  'hidden:list',
  'Show a list of all hidden articles.',
  require('./lib/getHiddenList')
);

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
