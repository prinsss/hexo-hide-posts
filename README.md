# hexo-sage-posts

[![build-status](https://travis-ci.org/printempw/hexo-sage-posts.svg?branch=master)](https://travis-ci.org/printempw/hexo-sage-posts)
[![npm-version](https://img.shields.io/npm/v/hexo-sage-posts.svg)](https://www.npmjs.com/package/hexo-sage-posts)

A plugin to hide specified posts from your Hexo blog and make them only accessible by links.

The name ["sage"](https://knowyourmeme.com/memes/sage) is borrowed from *chan image board. In this plugin, a post marked as "sage" is just like a YouTube video whose privacy set to ["unlisted"](https://support.google.com/youtube/answer/157177). The "sage" posts will not show up in the article lists (index, archive, category, tag, feed, sitemap, whatever), but they can still be accessed directly by entering its URL.

Without the post's URL, nobody can access a "sage" post.

## Installation

``` bash
$ npm install hexo-sage-posts --save
```

## Usage

Add `sage: true` to the [front-matter](https://hexo.io/docs/front-matter) of posts which you want to hide.

e.g. Edit `source/_posts/lorem-ipsum.md`:

```text
---
title: 'Lorem Ipsum'
date: '2019/8/10 11:45:14'
sage: true
---

Lorem ipsum dolor sit amet, consectetur adipiscing elit.
```

This post will not be shown anywhere, but you can still access it by `https://hexo.test/lorem-ipsum/`.

## License

MIT
