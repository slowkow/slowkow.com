---
layout: post
date: 2014-10-05
title: Autocomplete gene names with mygene.info and typeahead.js
tags: 
  - Javascript
categories: notes
thumb: "/images/mygene_typeahead.png"
twitter:
  card: "summary_large_image"
---

We can use [mygene.info] with [typeahead.js] to autocomplete gene names and
retrieve every annotation you can think of (GO, Kegg, Ensembl, position,
homologs, etc.). Try typing your gene name in the interactive example in this
post, and download my code.

<!--more-->

[mygene.info]: http://mygene.info/
[typeahead.js]: https://twitter.github.io/typeahead.js/

# :racehorse: In action

<img src="/images/geneinfo-typeahead.gif" alt="mygene.info with typeahead.js" style="max-width:550px"/>

# :floppy_disk: Download the code

Download the code and try it out yourself:

- <a target="_blank" href="/notes/geneinfo.html" download>geneinfo.html</a>

To run it, start a server. Go to your `~/Downloads` folder and run:

```bash
cd ~/Downloads
python3 -m http.server
```
```
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
```

Then open your web browser and go to <a target="_blank" href="http://localhost:8000/geneinfo-typeahead.html">http://localhost:8000/geneinfo-typeahead.html</a>

# :zap: Try it here

Start typing in the text box below and you should see suggestions for
completing your gene name. You should see more information if you press
<kbd>Enter</kbd> on your selected gene.

{{% include file="/static/notes/geneinfo.html" %}}

