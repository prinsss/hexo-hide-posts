/* global hexo */
'use strict';

// Expose the filter keyword so users can change it by their demand,
// and the default keyword is `sage`.
hexo.config.sage_posts = Object.assign({
  filter: 'sage'
}, hexo.config.sage_posts);

// Modify posts in `hexo.locals` before running generators.
// @see https://github.com/hexojs/hexo/blob/master/lib/hexo/index.js#L317
//
// Typically, we remove posts which have '<filter_name>: true' assigned in
// their front-matter from `hexo.locals.posts`, therefore all
// generators ('archive', 'category', 'tag', 'feed', 'sitemap', etc.) will
// just ignore them. We also put the 'sage' posts into `hexo.locals.sage_posts`
// for further use (to make them correctly processed by 'post' generator).
hexo.extend.filter.register('before_generate', function () {
  const config = this.config.sage_posts;
  const all_posts = this.locals.get('posts');
  const sage_posts = this.locals.get('posts').find({ [config.filter]: true });
  const normal_posts = this.locals.get('posts').filter(post => !post[config.filter]);
  // Quick fix, I don't know exactly why.
  // It works just fine without this line on Node 8.x, but on Node 10.x,
  // the `hexo.locals.posts` we got here becomes incomplete. So we have to
  // assign the values again manually. Such a weird problem, damn it.
  this._bindLocals();
  // Exclude 'sage' posts from all generators except 'post'
  // @see https://github.com/hexojs/hexo/blob/master/lib/hexo/locals.js
  this.locals.set('all_posts', all_posts);
  this.locals.set('sage_posts', sage_posts);
  this.locals.set('posts', normal_posts);
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
