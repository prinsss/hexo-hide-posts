# hexo-hide-posts

[![npm-version](https://img.shields.io/npm/v/hexo-hide-posts.svg)](https://www.npmjs.com/package/hexo-hide-posts)
[![hexo-version](https://img.shields.io/badge/hexo-%3E=4.0.0-blue?logo=hexo)](https://hexo.io)

[**English Documentation**](https://github.com/printempw/hexo-hide-posts/blob/master/README.md)

本 Hexo 插件可以在博客中隐藏指定的文章，并使它们仅可通过链接访问。

当一篇文章被设置为「隐藏」时，它不会出现在任何列表中（包括首页、存档、分类页面、标签页面、Feed、站点地图等），也不会被搜索引擎索引（前提是搜索引擎遵守 noindex 标签）。

只有知道文章链接的人才可以访问被隐藏的文章。

## 安装

```bash
npm install hexo-hide-posts
```

## 使用

在文章的 [front-matter](https://hexo.io/docs/front-matter) 中添加 `hidden: true` 即可隐藏文章。

比如我们隐藏了 `source/_posts/lorem-ipsum.md` 这篇文章：

```text
---
title: 'Lorem Ipsum'
date: '2019/8/10 11:45:14'
hidden: true
---

Lorem ipsum dolor sit amet, consectetur adipiscing elit.
```

虽然首页上被隐藏了，但你仍然可以通过 `https://hexo.test/lorem-ipsum/` 链接访问它。（如果想要完全隐藏一篇文章，可以直接将其设置为[草稿](https://hexo.io/zh-cn/docs/writing.html#%E8%8D%89%E7%A8%BF)）

你可以在命令行运行 `hexo hidden:list` 来获取当前所有的已隐藏文章列表。

插件也在 [Local Variables](https://hexo.io/api/locals) 中添加了 `all_posts` 和 `hidden_posts` 变量，供自定义主题使用。

## 配置

在你的站点 `_config.yml` 中添加如下配置：

```yml
hide_posts:
  # 是否启用 hexo-hide-posts
  enable: true

  # 隐藏文章的 front-matter 标识，也可以改成其他你喜欢的名字
  filter: hidden

  # 为隐藏的文章添加 noindex meta 标签，阻止搜索引擎收录
  noindex: true

  # 设置白名单，白名单中的 generator 可以访问隐藏文章
  # 常见的 generators 有：index, tag, category, archive, sitemap, feed, etc.
  # allowlist_generators: []

  # 设置黑名单，黑名单中的 generator 不可以访问隐藏文章
  # 如果同时设置了黑名单和白名单，白名单的优先级更高
  # blocklist_generators: ['*']
```

举个栗子：设置 `filter: secret` 之后，你就可以在 front-matter 中使用 `secret: true` 来隐藏文章了。

## 高级配置

在 0.3.0 及以上版本，插件提供了更精细的黑白名单控制。

**示例1**：让所有隐藏文章在存档页面和分类页面中可见，其他地方不可见

```yml
hide_posts:
  enable: true
  # 功能与 0.2.0 及以前版本的 public_generators 一致，改了个名字
  allowlist_generators: ['archive', 'category']
```

**示例2**：仅在首页和 RSS 隐藏部分文章，其他地方可见

```yml
hide_posts:
  enable: true
  # 更多黑白名单的高级配置示例，可以在 `lib/isGeneratorAllowed.test.js` 文件中查看
  allowlist_generators: ['*']
  blocklist_generators: ['index', 'feed']
```

**注意**：不是所有插件注册的 generator 名称都与其插件名称相同。比如 [`hexo-generator-searchdb`](https://github.com/next-theme/hexo-generator-searchdb) 插件，其注册的 generator 名称就是 `xml` 和 `json`，而非 `searchdb`。因此，在填写 `allowlist_generators` 和 `blocklist_generators` 参数时要注意使用插件实际注册的 generator 名称（可以查阅对应插件的源码来获取准确的注册名）。

> Tips: 运行 `hexo g --debug`，可以在调试日志中查看所有已安装的 generator 的注册名称。

**示例3**：使用自定义 JavaScript 函数判断白名单

在博客中添加一个[插件脚本](https://hexo.io/docs/plugins)：

```js
// scripts/allowlist.js (文件名任意)

hexo.config.hide_posts.allowlist_function = function (name) {
  return /archive|feed/.test(name);
}
```

## 自定义 ACL 函数

如果你需要更细粒度地控制某篇文章应该如何显示或隐藏，可以使用本插件的更高级功能：**自定义 ACL 函数**（需要 0.4.0 及以上版本）。

插件支持传入自定义 JavaScript 函数作为 ACL (Access Control List，访问控制列表)。ACL 函数功能十分强大，可以完全控制某一篇文章是否应该被某一个 generator 渲染。函数接受两个参数：文章对象 `post`，以及当前 generator 的注册名称 `generatorName`。同时，也可以访问全局变量 `hexo`。

下面是一个较为复杂的例子，实现了以下功能，如有需要可自行修改使用：

- 在 front-matter 中标记为 `acl: no-rss` 的文章，博客中正常展示，但在 RSS 和 sitemap 中隐藏
- 标记为 `acl: archive-only` 的文章，仅在存档页面中展示，在其他地方隐藏
- 分类为 `news` 的文章，在所有地方都展示
- 发布日期早于 2020 年的文章，在所有地方都隐藏

```js
// FILE: scripts/acl.js
const isGeneratorAllowed = require('hexo-hide-posts/lib/isGeneratorAllowed');

// Advanced usage: ACL (Access Control List) per post.
// The most powerful way to control which posts should be included in which generator.
// Return `true` to allow and `false` to block access. It's all up to you.
hexo.config.hide_posts.acl_function_per_post = function (post, generatorName) {
  // Mark the post with front-matter `acl: xxx` so we can recognize it here.
  // For the full definition of `post` and all available properties,
  // see: https://github.com/hexojs/hexo/blob/master/lib/models/post.js
  // console.log(post, post.slug, post.acl, post.tags, post.categories)

  // Posts marked as "no-rss" will not be included in the feed and sitemap
  if (post.acl === 'no-rss') {
    return generatorName !== 'atom' && generatorName !== 'sitemap';
  }

  // Posts marked as "archive-only" will only be included in the archive
  if (post.acl === 'archive-only') {
    return generatorName === 'archive';
  }

  // You can also filter posts with tags and categories
  // All posts in category "news" will NOT be hidden
  // if (post.tags.find({ name: 'news' }).length) {}
  if (post.categories.find({ name: 'news' }).length) {
    return true;
  }

  // Or even the creation date!
  // All posts created before 2020 will be hidden
  if (post.date.year() < 2020) {
    return false;
  }

  // For the rest of posts, apply the default rule (allowlist & blocklist)
  return isGeneratorAllowed(hexo.config.hide_posts, generatorName);
}
```

## 开源许可

MIT
