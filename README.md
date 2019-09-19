# hexo-hide-posts

[![build-status](https://travis-ci.org/printempw/hexo-hide-posts.svg?branch=master)](https://travis-ci.org/printempw/hexo-hide-posts)
[![npm-version](https://img.shields.io/npm/v/hexo-hide-posts.svg)](https://www.npmjs.com/package/hexo-hide-posts)

[**中文文档**](https://github.com/printempw/hexo-hide-posts/blob/master/README_ZH.md)

A plugin to hide specific posts from your Hexo blog and make them only accessible by links.

**Hide** means your posts will not come up in article lists (homepage, archive, category, tag, feed, sitemap, whatever), or search results either (by telling search engines not to index these pages with a "noindex" meta tag). Only those who know the link can view the post, and you can share the link with anyone.

This means that posts marked as hidden could still be seen by anyone, but only if they guess the link.

## Installation

``` bash
$ npm install hexo-hide-posts --save
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

This post will not be shown anywhere, but you can still access it by `https://hexo.test/lorem-ipsum/`.

To get a list of hidden posts, you can run `hexo hidden:list` from command line.

For developers, `all_posts` and `hidden_posts` added to [Local Variables](https://hexo.io/api/locals) may be useful.

## Config

In your site's `_config.yml`:

```yml
# hexo-hide-posts
hide_posts:
  # Change the filter name to fit your need
  filter: hidden
  # Generators which you want to expose all posts (include hidden ones) to.
  # Common generators: index, tag, category, archive, sitemap, feed, etc.
  public_generators: []
  # Add "noindex" meta tag to prevent hidden posts from being indexed by search engines
  noindex: true
```

e.g. Set filter to `secret`, so you can use `secret: true` in front-matter instead.

## License

MIT License (c) 2019 printempw
