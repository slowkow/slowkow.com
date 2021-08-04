---
layout: post
date: 2019-07-14
title: Make tidy variant tables with MyVariant.info and Tabulator
tags: 
  - Javascript
  - API
categories: notes
thumb: "/images/variantinfo-tabulator.png"
twitter:
  card: "summary_large_image"
---

We can use the <a target="_blank" href="https://myvariant.info">MyVariant.info</a> API
and <a target="_blank" href="http://tabulator.info">Tabulator</a> to create a
web page for making tidy tables with genomic variants.

<!--more-->

[Tabulator]: http://tabulator.info/
[Oli Folkerd]: https://www.patreon.com/olifolkerd

[myvariant.info]: http://myvariant.info/
[typeahead.js]: https://twitter.github.io/typeahead.js/

<h1 class="mt5">:racehorse: In action</h1>

Here is an animation that shows what this code can do:

<img src="/images/variantinfo-tabulator.gif" alt="myvariant.info with tabulator.js" style="max-width:550px"/>

<h1 class="mt5">:zap: Try it</h1>

Try pasting a list of SNP ids at <a target="_blank" href="https://quickgene.net/variants/">quickgene.net/variants</a>

After you paste the list and click "Search":

- We use the <a target="_blank" href="https://myvariant.info">MyVariant.info</a> service to guess the
  identifiers that match your query.
- We automatically add links to the [Open Targets Genetics] web service, which
  provides further links to many resources for researching genetic variants.

[Open Targets Genetics]: https://genetics.opentargets.org/

<h1 class="mt5">:floppy_disk: Download the code</h1>

Download the code and try it out yourself:

- <a target="_blank" href="/variants.html" download="variants.html">Download variants.html</a>

Tip: Open the HTML file with your favorite web browser.
