---
title: "Embed compressed data in HTML files"
author: "Kamil Slowikowski"
date: "2016-12-17"
layout: post
tags:
  - Tutorials
categories: notes
thumb: /notes/embed-data-html/noun-gz-4642949.png
twitter:
  card: "summary_large_image"
---

HTML is great for presenting rich text documents on the web. Javascript takes
the web experience to the next level by allowing the content creator to develop
scripts that run on the client-side in the visitors' web browsers. In this
post, we'll show a simple example of how we can embed arbitrary data into those
scripts.

<!--more-->

Let's create a file with some data:

```bash
echo "here is some data weeeeeeeeeeeeeeeeeeee" > data.tsv
```

Compress it, encode it with base64, and put it in a javascript variable:

```bash
(echo -n "var data = '"; gzip -c data.tsv | base64 -w0; echo -n "'") > data.js
```

Here's what the data looks like now:

```bash
cat data.js
var data = 'H4sICCbBYlgAA2RhdGEudHN2AMtILUpVyCxWKM7PTVVISSxJVChPxQK4ABdVssMoAAAA'
```

In our HTML file, decode and decompress the original data:

```html
<script src="pako.js"></script>
<script src="data.js"></script>
<script>
// The data variable is imported from "data.js".
var x = pako.ungzip(atob(data), {to: 'string'})
console.log(x) // "here is some data weeeeeeeeeeeeeeeeeeee"
</script>
```

We can create the `pako.js` file like this:

```bash
npm install -g browserify
npm install pako
browserify -r pako --standalone pako > pako.js
```

