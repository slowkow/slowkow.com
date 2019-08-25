---
title: "Harmony in motion: visualize an iterative algorithm for aligning multiple datasets"
author: "Kamil Slowikowski"
date: "2019-08-25"
layout: post
tags:
  - R
  - Tutorials
categories: notes
thumb: /notes/harmony-animation/twitter-card.png
twitter:
  card: "summary_large_image"
editor_options: 
  chunk_output_type: console
---

[Harmony] is a new algorithm for aligning multiple high-dimensional datasets,
described in [this paper][harmony-paper] by [Ilya Korsunsky] et al. Here, we
will create a visualization to animate the transitions between each iteration
of the algorithm. By seeing it in motion, we might be able to gain some
intuition for what it is happening. 

[harmony-paper]: https://google.com
[Harmony]: https://github.com/immunogenomics/harmony
[Ilya Korsunsky]: https://github.com/ilyakorsunsky

<!--more-->

<h1 class="mt5">:racehorse: Harmony in motion</h1>

Let's make this animation:

<!--<img src="harmony-in-motion.gif"></img>-->
<img src="harmony-in-motion-3donors.gif"></img>

# Install packages

These are the critical R packages used in this post:

- [MUDAN] by [Jean Fan]
- [Harmony] and [presto] by [Ilya Korsunsky]
- [gganimate] by [Thomas Lin Pedersen]


```r

devtools::install_github("jefworks/MUDAN")

devtools::install_github("immunogenomics/harmony")
devtools::install_github("immunogenomics/presto")

install.packages("gganimate")

```



# Run Principal Component Analysis

We can easily load the single-cell RNA-seq data available after we install
[MUDAN].


```r
data("pbmcA")
data("pbmcB")
data("pbmcC")
```



After iterating through many versions of the code in this note, it seems that
some of the cells with very high read counts or very low read counts can be
difficult to cluster together with the other cells. For this reason, we exclude
some of the outlier cells from each dataset.


```r
exclude_outliers <- function(mat, low = 0.06, high = 0.94) {
  mat_sum <- colSums(mat)
  qs <- quantile(mat_sum, c(low, high))
  ix <- mat_sum > qs[1] & mat_sum < qs[2]
  return(mat[, ix])
}

pbmcA <- exclude_outliers(pbmcA)
pbmcB <- exclude_outliers(pbmcB)
pbmcC <- exclude_outliers(pbmcC)

# Genes and cells in each counts matrix.
dim(pbmcA)
#> [1] 13939  2548
dim(pbmcB)
#> [1] 15325  6831
dim(pbmcC)
#> [1] 16144  8351

pbmcA <- pbmcA[, 1:500] # take 500 cells
pbmcB <- pbmcB[, 1:2000] # take 2000 cells
pbmcC <- pbmcC[, 1:1000] # take 1000 cells

# Concatenate into one counts matrix.
genes.int <- intersect(rownames(pbmcA), rownames(pbmcB))
genes.int <- intersect(genes.int, rownames(pbmcC))
counts <- cbind(pbmcA[genes.int,], pbmcB[genes.int,], pbmcC[genes.int,])
dim(counts)
#> [1] 13414  3500

# A dataframe that indicates which donor each cell belongs to.
meta <- str_split_fixed(colnames(counts), "_", 2)
meta <- as.data.frame(meta)
colnames(meta) <- c("donor", "cell")
```


```r
# How many entries in the counts matrix are zero?
sparsity <- 100 * sum(counts == 0) / length(counts)

# How many genes (rows) and cells (columns)?
dim(counts)
#> [1] 13414  3500

# The donor id and cell id for each cell in the counts matrix.
head(meta)
#>   donor           cell
#> 1     A AAACATTGCACTAG
#> 2     A AAACATTGGCTAAC
#> 3     A AAACATTGTAACCG
#> 4     A AAACCGTGTGGTCA
#> 5     A AAACCGTGTTACCT
#> 6     A AAACGCACACGGGA

# Number of cells from each donor.
table(meta$donor)
#> 
#>    A    B    C 
#>  500 2000 1000
```

The matrix of read counts is 94.9% sparse. 

Now, we can use functions provided by the [MUDAN] R package to:

- normalize the counts matrix for number of reads per cell
- normalize the variance for each gene
- run principal component analysis (PCA)


```r
# CPM normalization
cpm <- MUDAN::normalizeCounts(counts, verbose = FALSE) 

# variance normalize, identify overdispersed genes
cpm_info <- MUDAN::normalizeVariance(cpm, details = TRUE, verbose = FALSE) 

# log transform
log10cpm <- log10(cpm_info$mat + 1) 

# 30 PCs on overdispersed genes
set.seed(42)
pcs <- MUDAN::getPcs(
  mat     = log10cpm[cpm_info$ods,],
  nGenes  = length(cpm_info$ods),
  nPcs    = 30,
  verbose = FALSE
)
pcs[1:5, 1:5]
#>                          PC1        PC2        PC3       PC4         PC5
#> A_AAACATTGCACTAG -0.03366605 -2.7278796 -0.5787163 1.5344199  0.95673683
#> A_AAACATTGGCTAAC -0.14488241  1.5595791 -1.8376919 0.8074073 -0.18180585
#> A_AAACATTGTAACCG -0.56974052  0.3935323  0.3634601 0.7732871 -0.02132885
#> A_AAACCGTGTGGTCA -0.37563482 -0.6930404 -0.2145384 0.8881282  0.89139539
#> A_AAACCGTGTTACCT  0.11177587  1.5004529 -2.5579223 0.7732673 -0.13845025

dat_pca <- as.data.frame(
  str_split_fixed(rownames(pcs), "_", 2)
)
colnames(dat_pca) <- c("donor", "cell")
dat_pca <- cbind.data.frame(dat_pca, pcs)

p <- ggplot(dat_pca[sample(nrow(dat_pca)),]) +
  scale_size_manual(values = c(0.9, 0.3, 0.5)) +
  scale_color_manual(values = donor_colors) +
  theme(legend.position = "none")

p1 <- p + geom_point(aes(PC1, PC2, color = donor, size = donor))
p2 <- p + geom_point(aes(PC3, PC4, color = donor, size = donor))
p3 <- p + geom_point(aes(PC5, PC6, color = donor, size = donor))
p4 <- p + geom_point(aes(PC7, PC8, color = donor, size = donor))

this_title <- sprintf(
  "PCA with %s genes and %s cells from 3 PBMC samples, published by 10x Genomics",
  scales::comma(nrow(log10cpm[cpm_info$ods,])),
  scales::comma(nrow(dat_pca))
)

p1 + p2 + p3 + p4 + plot_layout(ncol = 4) + plot_annotation(title = this_title)
```

![plot of chunk pca](/notes/harmony-animation_files/figure-html/pca-1.png)

Next, we can plot the density of cells along each PC, grouped by donor. Below,
we can see that the distributions for each donor are shifted away from each
other, especially along PC4.

![plot of chunk pca-density](/notes/harmony-animation_files/figure-html/pca-density-1.png)

# Use Harmony to adjust the PCs

We can run Harmony to adjust the principal component (PC) coordinates from the
two datasets. When we look at the adjusted PCs, we can see that the donors no
longer clearly separate along any of the principal components.

![plot of chunk harmonize](/notes/harmony-animation_files/figure-html/harmonize-1.png)

And the densitites:

![plot of chunk pca-density-adjusted](/notes/harmony-animation_files/figure-html/pca-density-adjusted-1.png)

Now we can proceed with our analysis using the adjusted principal component
coordinates.

# Group the cells into clusters

To group cells into clusters, we can use the [MUDAN] R package again. First, we
build a nearest neighbor network and then we can identify clusters (or
communities) in the network of cells with the [Louvain community detection
algorithm][louvain] or the [Infomap algorithm][infomap].

[Jean Fan]: https://jef.works
[MUDAN]: https://github.com/jefworks/MUDAN
[louvain]: https://google.com
[infomap]: https://www.mapequation.org


```r
# Joint clustering
com <- MUDAN::getComMembership(
  mat = harmonized,
  k = 30,
  # method = igraph::cluster_louvain
  method = igraph::cluster_infomap
)
#> [1] "finding approximate nearest neighbors ..."
#> [1] "calculating clustering ..."
#> [1] "graph modularity: 0.687623905663182"
#> [1] "identifying cluster membership ..."
#> com
#>    1    2    3    4    5    6    7    8    9   10 
#> 1134  574  547  391  324  168  160  128   41   33
dat_harmonized$cluster <- com
```

# Compute differential gene expression for each cluster

To find genes that are highly expressed in each cluster, we can use the
[presto] R package by Ilya Korsunsky. It will efficiently compute differential
expression statistics:

[presto]: https://github.com/immunogenomics/presto


```r
gene_stats <- presto::wilcoxauc(log10cpm, com)

# Sort genes by the difference between:
# - percent of cells expressing the gene in the cluster
# - percent of cells expressing the gene outside the cluster
gene_stats %>%
  group_by(group) %>%
  top_n(n = 2, wt = pct_in - pct_out) %>%
  mutate_if(is.numeric, signif, 3)
#> `mutate_if()` ignored the following grouping variables:
#> Column `group`
#> # A tibble: 20 x 10
#> # Groups:   group [10]
#>    feature group avgExpr logFC statistic   auc      pval      padj pct_in
#>    <chr>   <chr>   <dbl> <dbl>     <dbl> <dbl>     <dbl>     <dbl>  <dbl>
#>  1 LTB     1       0.315 0.128   1860000 0.695 6.46e- 81 9.88e- 79   93.4
#>  2 LDHB    1       0.37  0.202   2100000 0.782 3.24e-167 2.07e-164   92.5
#>  3 IL7R    2       0.274 0.191   1190000 0.707 6.37e- 91 4.27e- 87   59.2
#>  4 LTB     2       0.426 0.236   1340000 0.797 1.86e-117 2.49e-113   96.7
#>  5 FGFBP2  3       0.453 0.423   1490000 0.924 0.        0.          90.5
#>  6 GZMH    3       0.512 0.485   1540000 0.954 0.        0.          94.7
#>  7 S100A8  4       0.589 0.586   1210000 0.996 0.        0.          99.5
#>  8 FCN1    4       0.59  0.582   1200000 0.99  0.        0.          98.7
#>  9 CD79B   5       0.529 0.512    946000 0.919 0.        0.          85.5
#> 10 CD79A   5       0.568 0.565    979000 0.951 0.        0.          90.4
#> 11 GZMK    6       0.496 0.455    519000 0.927 1.02e-232 1.37e-228   92.9
#> 12 CCL5    6       0.285 0.143    413000 0.737 1.24e- 33 1.66e- 30   89.9
#> 13 GNLY    7       0.671 0.619    513000 0.959 3.62e-192 2.43e-188   97.5
#> 14 GZMB    7       0.556 0.514    491000 0.918 7.52e-203 1.01e-198   89.4
#> 15 GZMK    8       0.447 0.398    357000 0.828 8.37e-107 1.12e-102   73.4
#> 16 CCL5    8       0.505 0.37     374000 0.866 4.08e- 60 2.74e- 56   96.9
#> 17 GNLY    9       0.7   0.627    133000 0.939 6.66e- 48 1.28e- 44   95.1
#> 18 HOPX    9       0.452 0.374    123000 0.868 3.74e- 34 5.58e- 31   87.8
#> 19 LST1    10      0.887 0.815    114000 0.992 5.95e- 49 2.28e- 46  100  
#> 20 SERPIN… 10      0.686 0.639    110000 0.96  5.38e- 75 5.15e- 72   97  
#> # … with 1 more variable: pct_out <dbl>
```

# Save each iteration of Harmony

Let's run Harmony and limit the maximum number of iterations to 0, 1, 2,
3, 4, and 5. That way, we can track how the PC coordinates change after each
iteration.


```r
harmony_iters <- c(0, 1, 2, 3, 4, 5)
res <- lapply(harmony_iters, function(i) {
  set.seed(42)
  HarmonyMatrix(
    # theta            = 0.35,
    theta            = 0.15,
    data_mat         = pcs,
    meta_data        = meta$donor,
    do_pca           = FALSE,
    verbose          = FALSE,
    max.iter.harmony = i
  )
})
h <- do.call(rbind, lapply(harmony_iters, function(i) {
  x       <- as.data.frame(res[[i + 1]])
  x$iter  <- i
  y       <- str_split_fixed(rownames(x), "_", 2)
  x$donor <- y[,1]
  x$cell  <- y[,2]
  x
}))
h[1:6, c("iter", "donor", "PC1", "PC2", "PC3")]
#>                  iter donor         PC1        PC2        PC3
#> A_AAACATTGCACTAG    0     A -0.03366605 -2.7278796 -0.5787163
#> A_AAACATTGGCTAAC    0     A -0.14488241  1.5595791 -1.8376919
#> A_AAACATTGTAACCG    0     A -0.56974052  0.3935323  0.3634601
#> A_AAACCGTGTGGTCA    0     A -0.37563482 -0.6930404 -0.2145384
#> A_AAACCGTGTTACCT    0     A  0.11177587  1.5004529 -2.5579223
#> A_AAACGCACACGGGA    0     A -0.64557995  0.5768672  0.4989103
```

For each run of Harmony, we will reduce 30 adjusted PCs to 2 dimensions with
the [UMAP] algorithm implemented in the [umap][umap-cran] R package by [Tomasz
Konopka].

Since UMAP is a stochastic algorithm, the final layout of the cells on the
canvas can be significantly different from one run to the next. We want to
avoid these large stochastic changes, because our goal is to create a fluid
animation with cells slowly drifting toward their final positions. To do this,
we can pass the coordinates from the `n`-th iteration as the initial positions
for UMAP in the `n+1`-th iteration.

[UMAP]: https://github.com/lmcinnes/umap
[Tomasz Konopka]: https://github.com/tkonopka
[umap-cran]: https://CRAN.R-project.org/package=umap


```r
# Settings for UMAP.
umap.settings <- umap.defaults
umap.settings$min_dist <- 0.8

# List of results.
res.umap <- list()

umap.seed <- 43
set.seed(umap.seed)

# Run UMAP on the first iteration of Harmony's adusted PCs.
res.umap[[1]] <- umap::umap(d = res[[1]], config = umap.settings)

for (i in 2:length(res)) {
  print(i)
  # Initialize UMAP with the coordinates from the previous Harmony iteration.
  umap.settings$init <- res.umap[[i - 1]]$layout
  set.seed(umap.seed)
  res.umap[[i]] <- umap::umap(d = res[[i]], config = umap.settings)
}
#> [1] 2
#> [1] 3
#> [1] 4
#> [1] 5
#> [1] 6

d <- do.call(rbind, lapply(seq_along(res.umap), function(i) {
  d       <- as.data.frame(res.umap[[i]]$layout)
  colnames(d) <- c("UMAP1", "UMAP2")
  d       <- cbind.data.frame(d, res[[i]])
  d$id    <- colnames(counts)
  y       <- str_split_fixed(d$id, "_", 2)
  d$donor <- y[,1]
  d$cell  <- y[,2]
  d$iter  <- i - 1
  return(d)
})) %>% group_by(iter) %>% arrange(cell)

# Add a column with the cluster membership for each cell.
d$cluster <- com[as.character(d$id)]
head(d)
#> # A tibble: 6 x 37
#> # Groups:   iter [6]
#>    UMAP1 UMAP2   PC1    PC2   PC3    PC4     PC5    PC6    PC7    PC8
#>    <dbl> <dbl> <dbl>  <dbl> <dbl>  <dbl>   <dbl>  <dbl>  <dbl>  <dbl>
#> 1 -0.529  12.8  4.11 0.0963 0.398 -0.245  0.128  -0.437 -0.143 -0.574
#> 2  1.05   16.0  3.83 0.197  0.442  0.264 -0.0309  0.389 -0.248 -0.462
#> 3  2.93   19.3  3.81 0.218  0.484  0.404 -0.0856  0.602 -0.255 -0.467
#> 4  5.04   21.2  3.81 0.218  0.482  0.404 -0.0852  0.601 -0.255 -0.468
#> 5  8.77   22.9  3.81 0.218  0.482  0.403 -0.0853  0.601 -0.255 -0.466
#> 6 10.4    24.5  3.81 0.218  0.482  0.403 -0.0852  0.601 -0.255 -0.468
#> # … with 27 more variables: PC9 <dbl>, PC10 <dbl>, PC11 <dbl>, PC12 <dbl>,
#> #   PC13 <dbl>, PC14 <dbl>, PC15 <dbl>, PC16 <dbl>, PC17 <dbl>,
#> #   PC18 <dbl>, PC19 <dbl>, PC20 <dbl>, PC21 <dbl>, PC22 <dbl>,
#> #   PC23 <dbl>, PC24 <dbl>, PC25 <dbl>, PC26 <dbl>, PC27 <dbl>,
#> #   PC28 <dbl>, PC29 <dbl>, PC30 <dbl>, id <chr>, donor <chr>, cell <chr>,
#> #   iter <dbl>, cluster <fct>

# Set a random order for the cells to avoid overplotting issues.
set.seed(42)
random <- sample(table(d$iter)[1])
d <- d %>% group_by(iter) %>% mutate(random = random) %>% arrange(iter, random)
```







Harmony iterations colored by donor:

![plot of chunk plot-harmony-iterations](/notes/harmony-animation_files/figure-html/plot-harmony-iterations-1.png)

Harmony iterations colored by cluster:

![plot of chunk plot_cluster](/notes/harmony-animation_files/figure-html/plot_cluster-1.png)

Below, we can see how the mean PC values change with each iteration of the
Harmony algorithm. Each line represents the mean of cells that belong to one
donor and one cluster of cells.

All cells are not adjusted by the same amount. Instead, each cell gets slightly
different adjustments. Let's look at one example by focusing on clusters 3 and
4 (the columns in the grid below). Clusters 3 and 4 are each adjusted by
different amounts. Notice PC6 is adjusted less for cluster 3 than cluster 4.
PC7 is adjusted more for cluster 3 than cluster 4.

![plot of chunk harmony-iterations-lines](/notes/harmony-animation_files/figure-html/harmony-iterations-lines-1.png)

# Use gganimate to transition between each iteration

To create an animation, we can use the [gganimate] package by [Thomas Lin
Pedersen] to create smooth transitions between each iteration of Harmony:

[gganimate]: https://gganimate.com
[Thomas Lin Pedersen]: https://www.data-imaginist.com/


```r
animate_donor <- function(
  filename, x, y,
  nframes = 15, width = 250, height = 250 / 1.41, res = 150,
  iters = 0:5, hide_legend = FALSE
) {
  this_title <- "Harmony Iteration {closest_state}"
  # p <- plot_donor(subset(d, iter %in% iters), {{x}}, {{y}})
  x <- parse_expr(x)
  y <- parse_expr(y)
  p <- plot_donor(subset(d, iter %in% iters), !!x, !!y)
  if (hide_legend) {
    p <- p + theme(legend.position = "none")
  } else {
    p <- p + ggtitle(this_title)
  }
  p <- p + transition_states(iter, transition_length = 4, state_length = 1) +
    ease_aes("cubic-in-out")
  animation <- animate(
    plot = p,
    nframes = nframes, width = width, height = height, res = res
  )
  dir.create("animation", showWarnings = FALSE)
  print(filename)
  anim_save(filename, animation)
}

nframes <- 200
iters <- 0:3
animate_donor(
  filename = "static/notes/harmony-animation/donor-umap.gif",
  nframes = nframes, iters = iters,
  x = "UMAP1", y = "UMAP2", width = 800, height = 900 / 1.41
)

```



<div class="w-50 center">
<img src="/notes/harmony-animation/donor-umap.gif"></img>
</div>





We can also look at PCs. For example, take a closer look at cells moving along PC1. You might notice that the cells on the right side of the panel move more than the cells on the left side of the panel.

<div class="cf w-80 center">
  <div class="fl w-30"><img class="db w-100" src="/notes/harmony-animation/donor-pca-1-2.gif" alt="PC1 and PC2"></div>
  <div class="fl w-30"><img class="db w-100" src="/notes/harmony-animation/donor-pca-4-6.gif" alt="PC4 and PC6"></div>
  <div class="fl w-30"><img class="db w-100" src="/notes/harmony-animation/donor-pca-5-7.gif" alt="PC4 and PC6"></div>
</div>

By coloring points with gene expression values, we can focus on specific genes:

<div class="cf w-60 center">
  <div class="fl w-50 w-25-ns"><img class="db w-100" src="/notes/harmony-animation/CD3D.gif" alt="CD3D"></div>
  <div class="fl w-50 w-25-ns"><img class="db w-100" src="/notes/harmony-animation/CD8A.gif" alt="CD8A"></div>
  <div class="fl w-50 w-25-ns"><img class="db w-100" src="/notes/harmony-animation/GZMK.gif" alt="GZMK"></div>
  <div class="fl w-50 w-25-ns"><img class="db w-100" src="/notes/harmony-animation/CD79A.gif" alt="CD79A"></div>
  <div class="fl w-50 w-25-ns"><img class="db w-100" src="/notes/harmony-animation/CD19.gif" alt="CD19"></div>
  <div class="fl w-50 w-25-ns"><img class="db w-100" src="/notes/harmony-animation/CD14.gif" alt="CD14"></div>
  <div class="fl w-50 w-25-ns"><img class="db w-100" src="/notes/harmony-animation/FCGR3A.gif" alt="FCGR3A"></div>
  <div class="fl w-50 w-25-ns"><img class="db w-100" src="/notes/harmony-animation/MS4A1.gif" alt="MS4A1"></div>
</div>



# Use HTML and CSS to arrange the GIFs

Finally, we can use HTML and CSS to arrange the GIF files next to each other on
an HTML page.


```html
<style>
.column {
  max-width: 17%;
}
.column2 {
  max-width: 60.5%;
}
</style>

<div> 
  <div class="column2">
    <img src="donor.gif">
  </div>
  <div class="column">
    <img src="CD3D.gif">
    <img src="CD8A.gif">
    <img src="GZMK.gif">
  </div>  
  <div class="column">
    <img src="MS4A1.gif">
    <img src="CD14.gif">
    <img src="FCGR3A.gif">
  </div>  
</div>
```

See several examples of different arrangements at [this link][arrange].
(Right-click and view source to see the HTML and CSS.)

Once the GIF files are arranged nicely on the HTML page, we can use [LICEcap]
to capture what appears on screen into a GIF file. That way, a single GIF file
contains multiple views of the data. Lastly, we can edit the speed, quality,
and other features of the captured GIF file after uploading it to [ezgif.com].

<img src="licecap.png"></img>

[LICEcap]: https://www.cockos.com/licecap/
[ezgif.com]: https://ezgif.com

[arrange]: /notes/harmony-animation/harmony-in-motion.html



# Read the paper

To learn more about Harmony, please check out [the paper][2]. It has many
examples showing how to align multiple different data sets.

[2]: https://google.com

# See the original data

In this post, we used the data included in the [MUDAN] package. The original
source of the data is [10x Genomics].

Get the original data published by 10x Genomics:

- [Frozen PBMCs (Donor A)][data1]
- [Frozen PBMCs (Donor B)][data2]
- [Frozen PBMCs (Donor C)][data3]

[10x Genomics]: https://10xgenomics.com
[data1]: https://support.10xgenomics.com/single-cell-gene-expression/datasets/1.1.0/frozen_pbmc_donor_a
[data2]: https://support.10xgenomics.com/single-cell-gene-expression/datasets/1.1.0/frozen_pbmc_donor_b
[data3]: https://support.10xgenomics.com/single-cell-gene-expression/datasets/1.1.0/frozen_pbmc_donor_c

[Edit the R markdown][source] source code for this post.

[source]: https://github.com/slowkow/slowkow.com/blob/master/content/notes/harmony-animation.Rmd

