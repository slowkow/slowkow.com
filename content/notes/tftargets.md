---
date: 2015-03-05
layout: post
title: Get human transcription factor target genes
tags: [R, Data]
categories: notes
thumb: /images/noun_Target_1266750_000000.svg
twitter:
  card: "summary"
---

I made a [data package with human transcription factor target genes][1] for
use in [R][3]. It is a collection of data from three sources: [TRED], [ITFP],
and [ENCODE]. I use them to test if the targets of a transcription factor are
differentially expressed in my data. Also, I can test if a set of
transcription factor target genes is enriched for some gene set of interest.

[3]: http://www.r-project.org/
[1]: https://github.com/slowkow/tftargets
[TRED]: https://cb.utdallas.edu/cgi-bin/TRED/tred.cgi?process=home
[ITFP]: http://itfp.biosino.org/itfp/
[ENCODE]: http://hgdownload.cse.ucsc.edu/goldenpath/hg19/encodeDCC/wgEncodeRegTfbsClustered/

<!--more-->

On [Biostars], several people have asked how to find the targets of
transcription factors:

-   [How Can I Find Target Genes Of A Transcription
    Factor?](https://www.biostars.org/p/18112/)

-   [How To Identify Targets Of A Transcription Factor
    ?](https://www.biostars.org/p/2148/#133213)

-   [Download Transcription Factor Targeting Genes
    Data](https://www.biostars.org/p/54511/)

-   [Transcription Factor And Corresponding Target Gene
    Resources](https://www.biostars.org/p/73731/)

-   [Determine Transcription Factors For
    Genes](https://www.biostars.org/p/8042/)

[Biostars]: https://www.biostars.org/

To address these questions, I made commonly mentioned resources available for
immediate use in R. This allows me to avoid navigating a website and typing in
gene names.

# Usage

The github repository: <https://github.com/slowkow/tftargets>

Download the `RData` file:

```r
# install.packages("RCurl")
library(RCurl)
download.file(
  url = "https://raw.githubusercontent.com/slowkow/tftargets/master/data/tftargets.RData",
  destfile = "tftargets.RData",
  method = "curl"
)
load("tftargets.RData")
```

List the Entrez Gene IDs for targets of a transcription factor:

```r
> TRED[["STAT3"]]
 [1]      2    332    355    595    596    598    896    943    958   1026 1051
[12]   1401   1588   1962   2194   2209   2353   3082   3162   3320   3326 3479
[23]   3559   3572   3586   3659   3718   3725   3929   4170   4582   4585 4609
[34]   4843   5008   5021   5292   5551   5967   6095   6347   6654   7076 7078
[45]   7097   7124   7200   7422   7432   8651   8996   9021  11336  23514 26229
[56]  27151  55893 117153 201254
```

In my analyses, I am finding that TRED and ENCODE are both useful datasets.
ITFP seems to be too noisy in my analyses, but you might have better luck.

Today, I found an additional dataset worth checking out by [Neph et al.
2012][2] that comes with an interesting web-based visualization:
<http://www.regulatorynetworks.org/>. I will eventually add it to my
R package.

[2]: http://www.cell.com/abstract/S0092-8674(12)00639-3

# Note

I have not performed careful filtering of the datasets, so each transcription
factor might have low confidence targets, or targets found in different cell
types. If you're interested in a particular cell type, you might want to
filter the data and prepare your own lists instead of using the lists that
I prepared.

