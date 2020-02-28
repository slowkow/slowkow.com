---
title: "Projects"
date: "2016-05-05T21:48:51-07:00"
menu: main
name: "Projects"
url: "/projects/"
weight: 3
---

<div class="bb b--black-10 pb5 mb5">
<ul>
<li><a href="#software">Software</a></li>
<li><a href="#apps">Web apps</a></li>
<li><a href="#volunteer">Volunteer Activities</a></li>
<li><a href="#fun">Just for Fun</a></li>
</ul>
</div>

<h1 class="f2 pb2 pt3" id="software">Software</h1>

<div id="ggrepel" class="bb b--black-10 pb5 mb5">

<h1 class="mt0">ggrepel <img src="/images/ggrepel-logo.svg" width="121px" align="right"></h1>

<p>
<a class="f5 fw5 link br-pill ba b--black-10 hvr-shadow ph3 pv2 mb2 dib near-black" target="_blank" href="https://github.com/slowkow/ggrepel"><i class="fab fa-github"></i> GitHub</a>
<a class="f5 fw5 link br-pill ba b--black-10 hvr-shadow ph3 pv2 mb2 dib near-black" target="_blank" href="https://slowkow.com/ggrepel"><i class="fas fa-chalkboard-teacher"></i> Slides</a>
</p>

<p>
<a class="dib" target="_blank" href="https://CRAN.R-project.org/package=ggrepel"><img src="https://www.r-pkg.org/badges/version/ggrepel?color=blue" alt="CRAN_Status_Badge" height="24px" width="110px"></a>
<a class="dib" target="_blank" href="https://www.r-pkg.org/pkg/ggrepel"><img src="https://cranlogs.r-pkg.org/badges/grand-total/ggrepel?color=blue" alt="CRAN_Downloads_Badge" height="24px" width="140px"></a>
</p>

<p>ggrepel is an R package that provides geoms for <a target="_blank" href="https://ggplot2.tidyverse.org/">ggplot2</a> to repel overlapping text labels:</p>

<ul>
<li><code>geom_text_repel()</code></li>
<li><code>geom_label_repel()</code></li>
</ul>

<p>Text labels repel away from each other, away from data points, and away
from edges of the plotting area.</p>

<div class="highlight">
<pre><code class="r hljs"><span class="hljs-keyword">library</span>(ggrepel)
ggplot(mtcars, aes(wt, mpg, label = rownames(mtcars))) +
<span style="display:inline-block;width:100%;" class="bg-light-yellow"> geom_text_repel() +</span>
 geom_point(color = <span class="hljs-string">'red'</span>) +
 theme_classic(base_size = <span class="hljs-number">16</span>)
</code></pre>
</div>

<div class="db center tc w-70 figure" style="margin-top:2rem">
<video src="https://slowkow.com/ggrepel/index_files/animation.mp4" style="width:100%;" type="video/mp4" muted="" autoplay="" loop=""></video>
</div>
</div>

<div id="snpsea" class="bb b--black-10 pb5 mb5">

<h1 class="mt0">SNPSEA <img src="/images/snpsea-logo.svg" width="121px" align="right"></h1>

<a class="f5 fw5 link br-pill ba b--black-10 hvr-shadow ph3 pv2 mb2 dib near-black" target="_blank" href="https://github.com/slowkow/snpsea"><i class="fab fa-github"></i> GitHub</a>

<p>
SNPSEA is a SNP Set Enrichment Algorithm to identify which cell types
preferentially express the genes that are associated with a trait.
</p

<p>
Input files:
<ol>
<li>A list of genome-wide significant SNP identifiers (e.g. <code>rs42</code>) from a genome-wide association study (GWAS) on your preferred trait.</li>
<li>A (NxM) matrix of gene expression values for all genes (N) across a large number (M) of cell types.</li>
</ol>
</p>

<div class="mw6 center"><img class="figure" class="figure" src="/images/slowikowski2014.png" alt="Figure 1"></img></div>

<p>
SNPSEA compares the trait-associated <a target="_blank" href="https://en.wikipedia.org/wiki/Single-nucleotide_polymorphism">single-nucleotide polymorphisms (SNPs)</a> to randomly sampled SNPs while
accounting for <a target="_blank" href="https://en.wikipedia.org/wiki/Linkage_disequilibrium">linkage disequilibrium (LD)</a>.
It's implemented in C++ with <a target="_blank" href="https://github.com/slowkow/snpsea/releases">executables available for macOS or Linux</a>.
</p>


</div>

<h1 class="f2  pb3" id="apps">Web apps</h1>

<div class="bb b--black-10 pb5 mb5">

<h1 class="mt0">Immunogenomics.io</h1>

<p>
<a class="f5 fw5 link br-pill ba b--black-10 hvr-shadow ph3 pv2 mb2 dib near-black" target="_blank" href="https://immunogenomics.io/"><i class="fas fa-rocket"></i> View</a>
</p>

<p>View the primary genomics data from several biomedical research studies. I developed all of the data visualizations on this site with R and Javascript. You can view bulk RNA-seq, single-cell RNA-seq, and mass cytometry data.</p>

<div class="mw6 center">
<a target="_blank" href="https://immunogenomics.io/">
 <img class="figure" src="/images/screencapture-immunogenomics-io-2020-02-28-14_30_04.jpg" alt="immunogenomics.io"></img>
</a>
</div>

</div>

<h1 class="f2  pb3" id="volunteer">Volunteer Activities</h1>

<div id="custemized" class="bb b--black-10 pb5 mb5">

<h1 class="mt0">CuSTEMized<img src="/images/custemized-logo.svg" width="221px" align="right"></h1>

<a class="f5 fw5 link br-pill ba b--black-10 hvr-shadow ph3 pv2 mb2 dib near-black" target="_blank" href="https://custemized.org"><i class="fas fa-external-link-alt"></i> CuSTEMized.org</a>

<p>
At CuSTEMized, we make one-of-a-kind personalized children's books about scientific careers.
CuSTEMized is a 501c3 non-profit created by <a target="_blank" href="https://jef.works">Jean
Fan</a>.</p>

<div class="mw6 center"><img src="/images/kamil-with-bear.png" alt="Kamil with bear"></img></div>

<p>I help develop the website and maintain the server. Do you want to help out? <a target="_blank" href="https://custemized.org/volunteer">Let us know.</a></p>

</div>

<h1 class="f2  pb3" id="fun">Just for Fun</h1>

<div id="snpbook" class="bb b--black-10 pb5 mb5">

<h1 class="mt0">snpbook</h1>

<a class="f5 fw5 link br-pill ba b--black-10 hvr-shadow ph3 pv2 mb2 dib near-black" target="_blank" href="https://github.com/slowkow/snpbook"><i class="fab fa-github"></i> GitHub</a>
<a class="f5 fw5 link br-pill ba b--black-10 hvr-shadow ph3 pv2 mb2 dib near-black" target="_blank" href="https://slowkow.github.io/snpbook"><i class="fas fa-rocket"></i> View</a>

<p>
Find proxies for your favorite single nucleotide polymorphism (SNP). This is a
simple HTML and Javascript page that uses some tricks to query the variants in
the 1000 Genomes Project and compute <a
target="_blank" href="https://en.wikipedia.org/wiki/Linkage_disequilibrium">linkage
disequilibrium (LD)</a> in the web browser.
</p>

<div class="db center tc w-70 figure">
<video src="/images/snpbook.mp4" style="width:100%;" type="video/mp4" muted="" autoplay="" loop=""></video>
</div>

</div>

<div id="doodle" class="bb b--black-10 pb5 mb5">

<h1 class="mt0">Doodle<img src="/images/doodle.jpg" width="121px" align="right"></h1>

<a class="f5 fw5 link br-pill ba b--black-10 hvr-shadow ph3 pv2 mb2 dib near-black" target="_blank" href="https://beta.observablehq.com/@slowkow/animated-doodle"><i class="fas fa-rocket"></i> Observable</a>

<p>
A Javascript animation of a doodle made with Perlin noise, inspired by <a target="_blank" href="https://www.mattdesl.com/">Matt DesLauriers</a>.
</p>

</div>

<div id="circles" class="bb b--black-10 pb5 mb5">

<h1 class="mt0">Circles<img src="/images/circles.jpg" width="121px" align="right"></h1>

<a class="f5 fw5 link br-pill ba b--black-10 hvr-shadow ph3 pv2 mb2 dib near-black" target="_blank" href="https://github.com/slowkow/circles"><i class="fab fa-github"></i> GitHub</a>
<a class="f5 fw5 link br-pill ba b--black-10 hvr-shadow ph3 pv2 mb2 dib near-black" target="_blank" href="https://slowkow.github.io/circles"><i class="fas fa-rocket"></i> View</a>

<p>
A Javascript animation of colorful circles.
</p>

</div>

<div id="fern" class="pb5 mb5">

<h1 class="mt0">Barnsley Fern<img src="/images/fern.jpg" width="121px" align="right"></h1>

<a class="f5 fw5 link br-pill ba b--black-10 hvr-shadow ph3 pv2 mb2 dib near-black" target="_blank" href="https://github.com/slowkow/fern"><i class="fab fa-github"></i> GitHub</a>
<a class="f5 fw5 link br-pill ba b--black-10 hvr-shadow ph3 pv2 mb2 dib near-black" target="_blank" href="https://slowkow.github.io/fern"><i class="fas fa-rocket"></i> View</a>

<p>
A Javascript animation of the <a target="_blank" href="https://en.wikipedia.org/wiki/Barnsley_fern">Barnsley Fern</a>, inspired by <i class="fab fa-youtube"></i> <a target="_blank" href="https://youtu.be/kbKtFN71Lfs">Chaos Game - Numberphile</a>.
</p>

</div>

