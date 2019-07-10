---
layout: post
date: 2019-07-10
title: Make tidy gene lists with MyGene.info and Tabulator
tags: 
  - Javascript
  - API
categories: notes
thumb: "/images/geneinfo-tabulator.png"
twitter:
  card: "summary_large_image"
---

Let's use <a target="_blank" href="https://mygene.info">MyGene.info</a> and <a
target="_blank" href="http://tabulator.info">Tabulator</a> by <a
target="_blank" href="https://www.patreon.com/olifolkerd">Oli Folkerd</a> to
create a simple tool for tidying up messy gene lists. See how it works below,
download the code, and try it yourself.

<!--more-->

[Tabulator]: http://tabulator.info/
[Oli Folkerd]: https://www.patreon.com/olifolkerd

[mygene.info]: http://mygene.info/
[typeahead.js]: https://twitter.github.io/typeahead.js/

<h1 class="mt5">:racehorse: In action</h1>

Here is an animation that shows what this code can do:

<img src="/images/geneinfo-tabulator.gif" alt="mygene.info with tabulator.js" style="max-width:550px"/>

<h1 class="mt5">:floppy_disk: Download the code</h1>

Download the code and try it out yourself:

- <a target="_blank" href="/genes.html" download>genes.html</a>

To run it, start a server. Go to your `~/Downloads` folder and run:

```bash
cd ~/Downloads
python3 -m http.server
```
```
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
```

Then open your web browser and go to <a target="_blank" href="http://localhost:8000/genes.html">http://localhost:8000/genes.html</a>


<h1 class="mt5">:zap: Try it here</h1>

See if the <a target="_blank" href="https://mygene.info">MyGene.info</a> service or <a target="_blank" href="https://rest.ensembl.org">Ensembl API</a> can guess the Entrez
IDs or Ensembl IDs that match your query.

You can also try it <a target="_blank" href="/genes/">here</a> in a new tab.

{{% include file="/content/genes.html" %}}

