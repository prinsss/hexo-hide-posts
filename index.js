/* global hexo */
'use strict';

// Expose the filter keyword so users can change it by their demand,
// and the default keyword is `hidden`.
const config = Object.assign({
  filter: 'hidden'
}, hexo.config.hide_posts);

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
});

// @see https://github.com/hexojs/hexo/blob/master/lib/plugins/generator/post.js
const original_post_generator = hexo.extend.generator.get('post');

// Here we overwrite the 'post' generator to inject our codes
hexo.extend.generator.register('post', async function (locals) {
  const fg = original_post_generator.bind(this);

  // Pass public posts and hidden posts to original generator
  const generated_public = await fg(locals);
  const generated_hidden = await fg(Object.assign(locals, {
    posts: locals.hidden_posts
  }));

  // Remove post.prev and post.next for hidden posts
  generated_hidden.forEach(ele => {
    ele.data.prev = ele.data.next = null;
  });

  return generated_public.concat(generated_hidden);
});
