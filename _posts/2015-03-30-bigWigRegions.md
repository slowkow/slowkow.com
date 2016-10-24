---
layout: post
title: Print bigWig data for each region in a BED file
tags: Bash
categories: notes
---

I wrote a Bash script to call [bigWigToBedGraph] for each region in a [BED]
file. You can quickly take a subset of [bigWig] data for regions of interest.
In my particular case, I needed to get [phastCons] conservation scores for
putative transcription factor binding sites.

<!--more-->

Suppose you'd like to determine the evolutionary conservation of putative
transcription factor binding sites, to improve discrimination of true and
false positive sites. It is possible to use conservation information with
[CENTIPEDE], for example.

Let's start by retrieving precomputed phastCons values for conservation across
100 vertebrates from UCSC:

See: <http://hgdownload.cse.ucsc.edu/goldenPath/hg19/phastCons100way/>

```bash
mkdir phastCons100way
cd phastCons100way
URL=rsync://hgdownload.cse.ucsc.edu/goldenPath/hg19/phastCons100way
rsync -avz --progress ${URL}/hg19.100way.phastCons.bw .
```

We also need the `bigWigToBedGraph` utility. See:
<http://hgdownload.cse.ucsc.edu/admin/exe/>

If we have our binding sites in a BED file called `sites.bed`, we can
get the conservation scores for those sites as follows:

```bash
bigWigRegions hg19.100way.phastCons.bw sites.bed > sites.phastCons.bedGraph
```

# Source code

{% gist 8573de6d9f17727cdfde %}

[bigWigToBedGraph]: http://hgdownload.cse.ucsc.edu/admin/exe/
[bigWig]: https://genome.ucsc.edu/goldenpath/help/bigWig.html
[BED]: https://genome.ucsc.edu/FAQ/FAQformat.html#format1
[phastCons]: http://compgen.bscb.cornell.edu/phast/
[CENTIPEDE]: http://centipede.uchicago.edu/
