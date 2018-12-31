---
date: 2015-06-03
layout: post
title: Determine if a transcription factor is bound to a genomic site with CENTIPEDE
tags: [R, Tutorials]
categories: notes
thumb: /images/noun_DNA_1759393_000000.svg
---

I wrote [a practical tutorial][1] for how to use [CENTIPEDE] to determine if
a transcription factor is bound to a site in the genome. The tutorial explains
how to prepare appropriate input data and how to run the analysis. Please get
in touch if you have any comments or suggestions.

<!--more-->

For details about the statistical models underlying the methods, please see
([Pique-Regi, et al. 2011][2]).

The [github repository][1] has R code to prepare data for CENTIPEDE. Install
and load it like this:

```r
install.packages("devtools")
library(devtools)

devtools::install_github("slowkow/CENTIPEDE.tutorial")
library(CENTIPEDE.tutorial)
```

After you have installed the code, you can follow along with my commands in the
tutorial.

Download the PDF:

- [centipede-tutorial.pdf][pdf]

[1]: https://github.com/slowkow/CENTIPEDE.tutorial
[pdf]: https://github.com/slowkow/CENTIPEDE.tutorial/raw/master/vignettes/centipede-tutorial.pdf
[2]: http://genome.cshlp.org/content/21/3/447
[CENTIPEDE]: http://centipede.uchicago.edu/

