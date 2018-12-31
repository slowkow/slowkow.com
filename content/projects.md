---
title: "Projects"
date: "2016-05-05T21:48:51-07:00"
menu: main
name: "Projects"
url: "/projects/"
weight: 3
---

<ul>
<li><a href="#software">Software</a></li>
<li><a href="#apps">Web apps</a></li>
<li><a href="#volunteer">Volunteer Activities</a></li>
<li><a href="#fun">Just for Fun</a></li>
</ul>


<h1 id="software">Software</h1>

<div id="ggrepel" class="ba br3 b--black-10 pa3 mb3">

<h1 class="mt0">ggrepel <img src="/images/ggrepel-logo.svg" width="121px" align="right"></h1>

<p>
<a class="f5 fw5 link br-pill ba b--black-10 hvr-shadow ph3 pv2 mb2 dib near-black" target="_blank" href="https://github.com/slowkow/ggrepel"><i class="fab fa-github"></i> GitHub</a>
<a class="f5 fw5 link br-pill ba b--black-10 hvr-shadow ph3 pv2 mb2 dib near-black" target="_blank" href="https://slowkow.com/ggrepel"><i class="fas fa-chalkboard-teacher"></i> Slides</a>
</p>

<p>
<a class="dib" target="_blank" href="https://CRAN.R-project.org/package=ggrepel"><img src="https://www.r-pkg.org/badges/version/ggrepel?color=blue" alt="CRAN_Status_Badge"></a>
<a class="dib" target="_blank" href="https://www.r-pkg.org/pkg/ggrepel"><img src="https://cranlogs.r-pkg.org/badges/grand-total/ggrepel?color=blue" alt="CRAN_Downloads_Badge"></a>
</p>

<p>ggrepel is an R package that provides geoms for <a target="_blank" href="https://ggplot2.tidyverse.org/">ggplot2</a> to repel overlapping text labels:</p>

<ul>
<li><code>geom_text_repel()</code></li>
<li><code>geom_label_repel()</code></li>
</ul>

<p>Text labels repel away from each other, away from data points, and away
from edges of the plotting area.</p>

<pre><code class="r hljs"><span class="hljs-keyword">library</span>(ggrepel)
ggplot(mtcars, aes(wt, mpg, label = rownames(mtcars))) +
<span style="display:inline-block;width:100%;" class="bg-light-yellow">  geom_text_repel() +</span>
  geom_point(color = <span class="hljs-string">'red'</span>) +
  theme_classic(base_size = <span class="hljs-number">16</span>)
</code></pre>

<div class="db center tc w-70 figure">
<video src="https://slowkow.com/ggrepel/index_files/animation.mp4" style="width:100%;" type="video/mp4" muted="" autoplay="" loop=""></video>
</div>
</div>

<div id="snpsea" class="ba br3 b--black-10 pa3 mb3">

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

<h1 id="apps">Web apps</h1>

<div class="ba br3 b--black-10 pa3 mb3">

<h1 class="mt0">Innate T cell RNA-seq Data Viewer</h1>

<p>
<a class="f5 fw5 link br-pill ba b--black-10 hvr-shadow ph3 pv2 mb2 dib near-black" target="_blank" href="https://github.com/immunogenomics/itcviewer"><i class="fab fa-github"></i> GitHub</a>
<a class="f5 fw5 link br-pill ba b--black-10 hvr-shadow ph3 pv2 mb2 dib near-black" target="_blank" href="https://immunogenomics.io/itc"><i class="fas fa-rocket"></i> Play</a>
</p>

<div class="mw8 center cf">
  <div class="fl w-50">
  <p>
  View the expression of a single gene in single-cell RNA-seq and bulk RNA-seq
  data across 7 types of T cells from <a target="_blank" href="https://doi.org/10.1101/280370">Gutierrez-Arcelus et al. 2018</a>. Implemented with R, <a target="_blank" href="https://shiny.rstudio.com/">Shiny</a>, and Javascript.
  </p>
  </div>
<a target="_blank" href="https://immunogenomics.io/itc">
  <div class="ml4 ml4-m ml5-l fl w-30">
  <img class="figure" src="/images/immunogenomics-itc.jpg" alt="immunogenomics.io/itc"></img>
  </div>
</a>
</div>

<p>Please feel free to download the figures and cite: <blockquote>Gutierrez-Arcelus, M., Teslovich, N., Mola, A. R. & Kim, H. A genome-wide innateness gradient defines the functional state of human innate T cells. bioRxiv (2018). <a target="_blank" href="https://doi.org/10.1101/280370">doi:10.1101/280370</a></blockquote></p>

</div>

<div class="ba br3 b--black-10 pa3 mb3">

<h1 class="mt0">AMP Phase 1 RA/SLE Data Viewer</h1>

<p>
<a class="f5 fw5 link br-pill ba b--black-10 hvr-shadow ph3 pv2 mb2 dib near-black" target="_blank" href="https://github.com/immunogenomics/amp_phase1_ra_viewer"><i class="fab fa-github"></i> GitHub</a>
<a class="f5 fw5 link br-pill ba b--black-10 hvr-shadow ph3 pv2 mb2 dib near-black" target="_blank" href="https://immunogenomics.io/ampra"><i class="fas fa-rocket"></i> Play</a>
</p>

<!--
<div class="mw8 center cf">
  <div class="fl w-20">
<p>
View the expression of a single gene across single-cell RNA-seq, bulk RNA-seq, and mass cytometry
data from the <a target="_blank" href="https://fnih.org/what-we-do/programs/amp-ra-sle">AMP RA/SLE Network</a>. Implemented with R and <a target="_blank" href="https://shiny.rstudio.com/">Shiny</a>.
</p>
  </div>
<a target="_blank" href="https://immunogenomics.io/ampra">
  <div class="ml4 ml5-l fl w-20">
  <img class="figure" src="/images/immunogenomics-ampra-home.jpg" alt="immunogenomics.io/ampra"></img>
  </div>
  <div class="ml4 ml5-l fl w-20">
  <img class="figure" src="/images/immunogenomics-ampra-data-viewer.jpg" alt="immunogenomics.io/ampra"></img>
  </div>
</a>
</div>
-->

<div class="mw8 center cf">
  <div class="fl w-50">
  <p>
  View the expression of a single gene across single-cell RNA-seq, bulk RNA-seq, and mass cytometry
  data from the <a target="_blank" href="https://fnih.org/what-we-do/programs/amp-ra-sle">AMP RA/SLE Network</a>. Implemented with R and <a target="_blank" href="https://shiny.rstudio.com/">Shiny</a>.
  </p>
  </div>
<a target="_blank" href="https://immunogenomics.io/ampra">
  <div class="ml4 ml4-m ml5-l fl w-30">
  <img class="figure" src="/images/immunogenomics-ampra-data-viewer.jpg" alt="immunogenomics.io/ampra"></img>
  </div>
</a>
</div>

<p>Please feel free to download the figures and cite: <blockquote>Zhang, F. et al. Defining Inflammatory Cell States in Rheumatoid Arthritis Joint Synovial Tissues by Integrating Single-cell Transcriptomics and Mass Cytometry. bioRxiv 351130 (2018). <a target="_blank" href="https://doi.org/10.1101/351130">doi:10.1101/351130</a></blockquote></p>

</div>

<h1 id="volunteer">Volunteer Activities</h1>

<div id="custemized" class="ba br3 b--black-10 pa3 mb3">

<h1 class="mt0">CuSTEMized<img src="https://custemized.org/img/logo.svg" width="221px" align="right"></h1>

<a class="f5 fw5 link br-pill ba b--black-10 hvr-shadow ph3 pv2 mb2 dib near-black" target="_blank" href="https://github.com/slowkow/circles"><i class="fas fa-external-link-alt"></i> CuSTEMized.org</a>

<p>
At CuSTEMized, we make one-of-a-kind personalized children's books about scientific careers.
CuSTEMized is a 501c3 non-profit created by <a target="_blank" href="https://jef.works">Jean
Fan</a>.</p>

<div class="mw6 center"><img src="https://custemized.org/img/team/kamil.png" alt="Kamil with bear"></img></div>

<p>I help develop the website and maintain the server. Do you want to help out? <a target="_blank" href="https://custemized.org/volunteer">Let us know.</a></p>

</div>

<h1 id="fun">Just for Fun</h1>

<div id="snpbook" class="ba br3 b--black-10 pa3 mb3">

<h1 class="mt0">snpbook</h1>

<a class="f5 fw5 link br-pill ba b--black-10 hvr-shadow ph3 pv2 mb2 dib near-black" target="_blank" href="https://github.com/slowkow/snpbook"><i class="fab fa-github"></i> GitHub</a>
<a class="f5 fw5 link br-pill ba b--black-10 hvr-shadow ph3 pv2 mb2 dib near-black" target="_blank" href="https://slowkow.github.io/snpbook"><i class="fas fa-rocket"></i> Play</a>

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

<div id="doodle" class="ba br3 b--black-10 pa3 mb3">

<h1 class="mt0">Doodle<img src="/images/doodle.jpg" width="121px" align="right"></h1>

<a class="f5 fw5 link br-pill ba b--black-10 hvr-shadow ph3 pv2 mb2 dib near-black" target="_blank" href="https://beta.observablehq.com/@slowkow/animated-doodle"><i class="fas fa-rocket"></i> Observable</a>

<p>
A Javascript animation of a doodle made with Perlin noise, inspired by <a target="_blank" href="https://www.mattdesl.com/">Matt DesLauriers</a>.
</p>

</div>

<div id="circles" class="ba br3 b--black-10 pa3 mb3">

<h1 class="mt0">Circles<img src="/images/circles.jpg" width="121px" align="right"></h1>

<a class="f5 fw5 link br-pill ba b--black-10 hvr-shadow ph3 pv2 mb2 dib near-black" target="_blank" href="https://github.com/slowkow/circles"><i class="fab fa-github"></i> GitHub</a>
<a class="f5 fw5 link br-pill ba b--black-10 hvr-shadow ph3 pv2 mb2 dib near-black" target="_blank" href="https://slowkow.github.io/circles"><i class="fas fa-rocket"></i> Play</a>

<p>
A Javascript animation of colorful circles.
</p>

</div>

<div id="fern" class="ba br3 b--black-10 pa3 mb3">

<h1 class="mt0">Barnsley Fern<img src="/images/fern.jpg" width="121px" align="right"></h1>

<a class="f5 fw5 link br-pill ba b--black-10 hvr-shadow ph3 pv2 mb2 dib near-black" target="_blank" href="https://github.com/slowkow/fern"><i class="fab fa-github"></i> GitHub</a>
<a class="f5 fw5 link br-pill ba b--black-10 hvr-shadow ph3 pv2 mb2 dib near-black" target="_blank" href="https://slowkow.github.io/fern"><i class="fas fa-rocket"></i> Play</a>

<p>
A Javascript animation of the <a target="_blank" href="https://en.wikipedia.org/wiki/Barnsley_fern">Barnsley Fern</a>, inspired by <i class="fab fa-youtube"></i> <a target="_blank" href="https://youtu.be/kbKtFN71Lfs">Chaos Game - Numberphile</a>.
</p>

</div>

