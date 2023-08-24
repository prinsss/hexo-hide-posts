# hexo-hide-posts

[![npm-version](https://img.shields.io/npm/v/hexo-hide-posts.svg)](https://www.npmjs.com/package/hexo-hide-posts)
[![hexo-version](https://img.shields.io/badge/hexo-%3E=4.0.0-blue?logo=hexo)](https://hexo.io)

[**中文文档**](https://github.com/printempw/hexo-hide-posts/blob/master/README_ZH.md)

A plugin to hide specific posts from your Hexo blog and make them only accessible by links.

**Hide** means your posts will not come up in article lists (homepage, archive, category, tag, feed, sitemap, whatever), or search results either (by telling search engines not to index these pages with a "noindex" meta tag). Only those who know the link can view the post, and you can share the link with anyone.

This means that posts marked as hidden could still be seen by anyone, but only if they guess the link.

## Installation

``` bash
npm install hexo-hide-posts
```

## Usage

Add `hidden: true` to the [front-matter](https://hexo.io/docs/front-matter) of posts which you want to hide.

e.g. Edit `source/_posts/lorem-ipsum.md`:

```text
---
title: 'Lorem Ipsum'
date: '2019/8/10 11:45:14'
hidden: true
---

Lorem ipsum dolor sit amet, consectetur adipiscing elit.
```

This post will not be shown anywhere, but you can still access it by `https://hexo.test/lorem-ipsum/`. (If you want to completely prevent a post from rendering, just set it as a [draft](https://hexo.io/docs/writing.html#Drafts).)

To get a list of hidden posts, you can run `hexo hidden:list` from command line.

For developers, `all_posts` and `hidden_posts` added to [Local Variables](https://hexo.io/api/locals) may be useful.

## Config

In your site's `_config.yml`:

```yml
hide_posts:
  # Should hexo-hide-posts be enabled.
  enable: true

  # The front-matter key for flagging hidden posts.
  # You can change the filter name if you like.
  filter: hidden

  # Add "noindex" meta tag to prevent hidden posts from being indexed by search engines.
  noindex: true

  # Generators in the allowlist will have access to the hidden posts.
  # Common generators in Hexo: 'index', 'tag', 'category', 'archive', 'sitemap', 'feed'
  # allowlist_generators: []

  # Generators in the blocklist can *not* access the hidden posts.
  # The allowlist has higher priority than the blocklist, if both set.
  # blocklist_generators: ['*']
```

e.g. Set filter to `secret`, so you can use `secret: true` in front-matter instead.

## Advanced Config

For power users, they can have a more fine-grained control on access to hidden posts by configuring blocklist and allowlist. This feature is available in version 0.3.0 or later.

**Config Example 1**: Hide the flagged posts everywhere, but make them visible on archives page and sitemap.

```yml
hide_posts:
  enable: true
  # This property was previously called `public_generators` prior to v0.2.0, and was renamed in newer version.
  allowlist_generators: ['archive', 'sitemap']
```

**Config Example 2**: Hide the flagged posts only on homepage and RSS, and show them elsewhere.

```yml
hide_posts:
  enable: true
  # For advanced usage of allowlist/blocklist, check `lib/isGeneratorAllowed.test.js` for more test cases.
  allowlist_generators: ['*']
  blocklist_generators: ['index', 'feed']
```

**Note:** although most of generator plugins respect a naming convention that they register
generator with the name in their package names, the generator name could be arbitrary.
For example, [`hexo-generator-searchdb`](https://github.com/next-theme/hexo-generator-searchdb) does not register
generators with name `searchdb`, but `xml` and `json`.
For accurate generator name, you should check their source code.

> Tips: Run `hexo g --debug` command will show you all the generators installed with their names in the debug log.

**Config Example 3**: Pass a custom JavaScript function to determine which generator should be allowlisted.

This could be done by adding a [plugin script](https://hexo.io/docs/plugins) to your Hexo blog.

```js
// scripts/allowlist.js

hexo.config.hide_posts.allowlist_function = function (name) {
  return /archive|feed/.test(name);
}
```

## License

MIT
