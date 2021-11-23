# hexo-hide-posts

[![npm-version](https://img.shields.io/npm/v/hexo-hide-posts.svg)](https://www.npmjs.com/package/hexo-hide-posts)
[![hexo-version](https://img.shields.io/badge/hexo-%3E=4.0.0-blue?logo=hexo)](https://hexo.io)

[**English Documentation**](https://github.com/printempw/hexo-hide-posts/blob/master/README.md)

本 Hexo 插件可以在博客中隐藏指定的文章，并使它们仅可通过链接访问。

当一篇文章被设置为「隐藏」时，它不会出现在任何列表中（包括首页、存档、分类页面、标签页面、Feed、站点地图等），也不会被搜索引擎索引（前提是搜索引擎遵守 noindex 标签）。

只有知道文章链接的人才可以访问被隐藏的文章。

## 安装

``` bash
$ npm install hexo-hide-posts --save
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
# hexo-hide-posts
hide_posts:
  enable: true
  # 可以改成其他你喜欢的名字
  filter: hidden
  # 指定你想要传递隐藏文章的 generator，比如让所有隐藏文章在存档页面可见
  # 常见的 generators 有：index, tag, category, archive, sitemap, feed, etc.
  public_generators: []
  # 为隐藏的文章添加 noindex meta 标签，阻止搜索引擎收录
  noindex: true
```

举个栗子：设置 `filter: secret` 之后，你就可以在 front-matter 中使用 `secret: true` 来隐藏文章了。

**注意**：不是所有插件注册的 generator 名称都与其插件名称相同。比如 [`hexo-generator-searchdb`](https://github.com/next-theme/hexo-generator-searchdb) 插件，其注册的 generator 名称就是 `xml` 和 `json`，而非 `searchdb`。因此，在填写 `public_generators` 参数时要注意使用插件实际注册的 generator 名称（可以查阅对应插件的源码来获取准确的注册名）。

## 开源许可

MIT
