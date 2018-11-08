/* global hexo */
'use strict';

// Modify posts in `hexo.locals` before running generators.
// @see https://github.com/hexojs/hexo/blob/master/lib/hexo/index.js#L317
//
// Typically, we remove posts which have 'sage: true' assigned in
// their front-matter from `hexo.locals.posts`, therefore all
// generators ('archive', 'category', 'tag', 'feed', 'sitemap', etc.) will
// just ignore them. We also put the 'sage' posts into `hexo.locals.sage_posts`
// for further use (to make them correctly processed by 'post' generator).
hexo.extend.filter.register('before_generate', function () {
  // Quick fix, I don't know exactly why.
  // It works just fine without this line on Node 8.x, but on Node 10.x,
  // the `hexo.locals.posts` we got here becomes incomplete. So we have to
  // assign the values again manually. Such a weird problem, damn it.
  this._bindLocals();
  // Exclude 'sage' posts from all generators except 'post'
  // @see https://github.com/hexojs/hexo/blob/master/lib/hexo/locals.js
  this.locals.set('sage_posts', this.locals.get('posts').find({ sage: true }));
  this.locals.set('posts', this.locals.get('posts').filter(post => !post.sage));
});

// @see https://github.com/hexojs/hexo/blob/master/lib/plugins/generator/post.js
const original_post_generator = hexo.extend.generator.get('post');

// Here we overwrite the 'post' generator to inject our codes
hexo.extend.generator.register('post', function (locals) {
  // Call the original 'post' generator to do the detailed stuff
  return original_post_generator.bind(this)({
    // Build new Warehouse Query object which includes 'sage' posts
    // @see https://hexojs.github.io/warehouse/Query.html
    posts: new locals.posts.constructor(
      locals.posts.data.concat(locals.sage_posts.data)
    )
  });
});
