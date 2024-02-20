'use strict';

const chalk = require('chalk');

/**
 * Modify posts in `hexo.locals` before running generators.
 * @see https://github.com/hexojs/hexo/blob/master/lib/hexo/index.js#L317
 *
 * Typically, we remove posts which have '<filter_name>: true' assigned in
 * their front-matter from `hexo.locals.posts`, therefore all
 * generators ('archive', 'category', 'tag', 'feed', 'sitemap', etc.) will
 * just ignore them. We also put the 'hidden' posts into `hexo.locals.hidden_posts`
 * for further use (to make them correctly processed by 'post' generator).
 */
function prepareHiddenPosts() {
  const config = this.config.hide_posts;
  const log = (...args) => this.log.debug('hexo-hide-posts:', ...args);

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

  log('hidden posts:', chalk.magenta(hidden_posts.length));
  log('hidden pages:', chalk.magenta(hidden_pages.length));
}

module.exports = prepareHiddenPosts;
