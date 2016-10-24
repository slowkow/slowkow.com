---
layout: post
title: GTEx RNA-Seq Visualizations
tags: Javascript
categories: notes
---

I created three visualizations of RNA-Seq data from the [GTEx] project
(version 2013-03-21). They're powered by [JBrowse], the [WashU Epigenome
Browser], and [canvasXpress].

[JBrowse]: http://jbrowse.org/
[WashU Epigenome Browser]: http://epigenomegateway.wustl.edu/browser/
[canvasXpress]: http://canvasxpress.org/

# JBrowse Genome Browser

<a href="{{ site.url }}/public/images/GTEx_JBrowse_IGF2.png">
<img src="{{ site.url }}/public/images/GTEx_JBrowse_IGF2-thumb.png" alt="GTEx JBrowse IGF2" />
</a>

[View expression of each coding nucleotide in the human genome
(hg19).][jbrowse]

A nucleotide's expression level is the sum of [Gencode v12] transcript RPKMs.
The transcript levels were quantified by the [GTEx] team using [Flux
Capacitor]. If you have RNA-Seq data, [do not use Flux Capacitor][no flux].
Instead, you should use [RSEM] or [Cufflinks].

[Gencode v12]: http://www.gencodegenes.org/releases/12.html
[GTEx]: http://www.gtexportal.org/home/
[Flux Capacitor]: http://sammeth.net/confluence/display/FLUX/Home
[no flux]: https://liorpachter.wordpress.com/tag/flux-capacitor/
[RSEM]: http://deweylab.biostat.wisc.edu/rsem/
[Cufflinks]: http://cufflinks.cbcb.umd.edu/
[jbrowse]: http://www.broadinstitute.org/~slowikow/JBrowse-1.10.1/?loc=3%3A189558782..189620394&tracks=Ensembl%20v72%20Transcripts%2CMuscle%20-%20Skeletal%2CBrain%20-%20Hippocampus%2CSkin%20-%20Sun%20Exposed%20(Lower%20leg)&highlight=

# WashU Epigenome Browser

<a href="{{ site.url }}/public/images/IGF2-GTEx.png">
<img src="{{ site.url }}/public/images/IGF2-GTEx-thumb.png" alt="GTEx Wash U Epigenome Browser" />
</a>

[View the expression of Gencode v12 transcripts across 23 human
tissues.][washu]

[washu]: http://epigenomegateway.wustl.edu/browser/?genome=hg19&session=Em4CqCRaHy&statusId=2082219336


# Heatmap

<a href="{{ site.url }}/public/images/GTEx_heatmap_IGF2.png">
<img src="{{ site.url }}/public/images/GTEx_heatmap_IGF2-thumb.png" alt="GTEx heatmap IGF2" />
</a>

[View expression of all Gencode v12 transcripts for a chosen gene.][gtexvis]

(At some point, this broke and I haven't had time to fix it.)

[gtexvis]: http://www.broadinstitute.org/~slowikow/gtexvis
