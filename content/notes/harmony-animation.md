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

[Harmony] is a an algorithm for aligning multiple high-dimensional datasets,
described by [Ilya Korsunsky] *et al.* in [this paper][harmony-paper]. When
analyzing multiple single-cell RNA-seq datasets, we often encounter the problem
that each dataset is separated from the others in low dimensional space -- even
when we know that all of the datasets have similar cell types. To address this
problem, the Harmony algorithm iteratively clusters and adjusts high
dimensional datasets to integrate them on a single manifold. In this note, we
will create animated visualizations to see how the algorithm works and develop
an intuitive understanding.

[harmony-paper]: https://www.nature.com/articles/s41592-019-0619-0
[Harmony]: https://github.com/immunogenomics/harmony
[Ilya Korsunsky]: https://github.com/ilyakorsunsky

<!--more-->

<h1 class="mt5">:racehorse: Harmony in motion</h1>

Let's make this animation:

<!--<img src="harmony-in-motion.gif"></img>-->
<img src="harmony-in-motion-3donors.gif"></img>

Single-cell RNA-seq data reduced to two dimensions with PCA and UMAP. 3,500
peripheral blood mononuclear cells (PBMCs). Each cell is from one of the donors
(A, B, and C). Six markers are shown for different cell types. Color indicates
gene expression as log2(CPM+1) (CPM is counts per million). The animation
starts with unadjusted PCs, and then cycles through 3 iterations of the Harmony
algorithm applied to the PCs.

<table class="center">
<tbody>
<tr class="striped--near-white "><th class="pv2 ph3 f6 fw6 ttu">Gene</th><th class="f6 ttu fw6 pv2 ph3">Cell type</th></tr>
<tr class="striped--near-white"><td class="pv2 ph3"><i>CD3D</i></td><td class="pv2 ph3">T cells</td></tr>
<tr class="striped--near-white"><td class="pv2 ph3"><i>CD8A</i></td><td class="pv2 ph3">CD8 T cells</td></tr>
<tr class="striped--near-white"><td class="pv2 ph3"><i>GZMK</i></td><td class="pv2 ph3">NKT cells</td></tr>
<tr class="striped--near-white"><td class="pv2 ph3"><i>CD20</i></td><td class="pv2 ph3">B cells</td></tr>
<tr class="striped--near-white"><td class="pv2 ph3"><i>CD14</i></td><td class="pv2 ph3">Monocytes</td></tr>
<tr class="striped--near-white"><td class="pv2 ph3"><i>CD16</i></td><td class="pv2 ph3">Natural killer cells, neutrophils, monocytes, and macrophages</td></tr>
</tbody>
</table>

# Install packages

These are the critical R packages I used to write this note:

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

The MUDAN package comes pre-loaded with some single-cell RNA-seq data published
by [10x Genomics][10xdata]. Let's load it into our R session.

[10xdata]: https://support.10xgenomics.com/single-cell-gene-expression/datasets


```r
data("pbmcA")
dim(pbmcA)
#> [1] 13939  2896
data("pbmcB")
dim(pbmcB)
#> [1] 15325  7765
data("pbmcC")
dim(pbmcC)
#> [1] 16144  9493
```



Some of the cells with very high read counts or very low read counts can be
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
rm(pbmcA, pbmcB, pbmcC)

# A dataframe that indicates which donor each cell belongs to.
meta <- str_split_fixed(colnames(counts), "_", 2)
meta <- as.data.frame(meta)
colnames(meta) <- c("donor", "cell")
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

# How many genes (rows) and cells (columns)?
dim(counts)
#> [1] 13414  3500

# How many entries in the counts matrix are non-zero?
sparsity <- 100 * (1 - (length(counts@x) / Reduce("*", counts@Dim)))
```

The matrix of read counts is 94.9% sparse. That means
that the vast majority of values in the matrix are zero.



Now, we can use functions provided by the [MUDAN] R package to:

- normalize the counts matrix for number of reads per cell
- normalize the variance for each gene
- run principal component analysis (PCA)


```r

# CPM normalization
counts_to_cpm <- function(A) {
  A@x <- A@x / rep.int(Matrix::colSums(A), diff(A@p))
  A@x <- 1e6 * A@x
  return(A)
}

cpm <- counts_to_cpm(counts)
log10cpm <- cpm
log10cpm@x <- log10(1 + log10cpm@x)

# variance normalize, identify overdispersed genes
cpm_info <- MUDAN::normalizeVariance(cpm, details = TRUE, verbose = FALSE) 

# 30 PCs on overdispersed genes
set.seed(42)
pcs <- getPcs(
  mat     = log10cpm[cpm_info$ods,],
  nGenes  = length(cpm_info$ods),
  nPcs    = 30,
  verbose = FALSE
)
pcs[1:5, 1:5]
#>                        PC1        PC2         PC3      PC4        PC5
#> A_AAACATTGCACTAG  1.767734 -14.418014   0.5740947 8.818121  2.7819395
#> A_AAACATTGGCTAAC  1.052417   6.005906 -10.2430982 4.035912 -1.5828038
#> A_AAACATTGTAACCG -2.031748   2.600434   1.5062893 5.392586  0.2284509
#> A_AAACCGTGTGGTCA -1.069945  -3.784165  -0.5634285 3.477583  4.9772192
#> A_AAACCGTGTTACCT  1.496703   5.978402 -11.1087743 3.943560 -1.5968947

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
set.seed(42)
com <- MUDAN::getComMembership(
  mat = harmonized,
  k = 30,
  # method = igraph::cluster_louvain
  method = igraph::cluster_infomap
)
#> [1] "finding approximate nearest neighbors ..."
#> [1] "calculating clustering ..."
#> [1] "graph modularity: 0.683895626832917"
#> [1] "identifying cluster membership ..."
#> com
#>    1    2    3    4    5    6    7    8    9 
#> 1086  613  563  421  328  183  141  126   39
dat_harmonized$cluster <- com
```

![plot of chunk plot-mudan-clustering](/notes/harmony-animation_files/figure-html/plot-mudan-clustering-1.png)

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
  mutate_if(is.numeric, signif, 3) %>%
  kable() %>%
  kable_styling(bootstrap_options = "striped", full_width = FALSE)
#> `mutate_if()` ignored the following grouping variables:
#> Column `group`
```

<table class="table table-striped" style="width: 100%; margin-left: auto; margin-right: auto;">
 <thead>
  <tr>
   <th style="text-align:left;"> feature </th>
   <th style="text-align:left;"> group </th>
   <th style="text-align:right;"> avgExpr </th>
   <th style="text-align:right;"> logFC </th>
   <th style="text-align:right;"> statistic </th>
   <th style="text-align:right;"> auc </th>
   <th style="text-align:right;"> pval </th>
   <th style="text-align:right;"> padj </th>
   <th style="text-align:right;"> pct_in </th>
   <th style="text-align:right;"> pct_out </th>
  </tr>
 </thead>
<tbody>
  <tr>
   <td style="text-align:left;"> LTB </td>
   <td style="text-align:left;"> 1 </td>
   <td style="text-align:right;"> 3.06 </td>
   <td style="text-align:right;"> 1.30 </td>
   <td style="text-align:right;"> 1810000 </td>
   <td style="text-align:right;"> 0.689 </td>
   <td style="text-align:right;"> 0 </td>
   <td style="text-align:right;"> 0 </td>
   <td style="text-align:right;"> 92.9 </td>
   <td style="text-align:right;"> 53.40 </td>
  </tr>
  <tr>
   <td style="text-align:left;"> LDHB </td>
   <td style="text-align:left;"> 1 </td>
   <td style="text-align:right;"> 2.88 </td>
   <td style="text-align:right;"> 1.26 </td>
   <td style="text-align:right;"> 2020000 </td>
   <td style="text-align:right;"> 0.771 </td>
   <td style="text-align:right;"> 0 </td>
   <td style="text-align:right;"> 0 </td>
   <td style="text-align:right;"> 91.7 </td>
   <td style="text-align:right;"> 54.30 </td>
  </tr>
  <tr>
   <td style="text-align:left;"> IL7R </td>
   <td style="text-align:left;"> 2 </td>
   <td style="text-align:right;"> 1.72 </td>
   <td style="text-align:right;"> 1.17 </td>
   <td style="text-align:right;"> 1250000 </td>
   <td style="text-align:right;"> 0.706 </td>
   <td style="text-align:right;"> 0 </td>
   <td style="text-align:right;"> 0 </td>
   <td style="text-align:right;"> 59.2 </td>
   <td style="text-align:right;"> 19.40 </td>
  </tr>
  <tr>
   <td style="text-align:left;"> LTB </td>
   <td style="text-align:left;"> 2 </td>
   <td style="text-align:right;"> 3.37 </td>
   <td style="text-align:right;"> 1.45 </td>
   <td style="text-align:right;"> 1410000 </td>
   <td style="text-align:right;"> 0.797 </td>
   <td style="text-align:right;"> 0 </td>
   <td style="text-align:right;"> 0 </td>
   <td style="text-align:right;"> 97.4 </td>
   <td style="text-align:right;"> 58.90 </td>
  </tr>
  <tr>
   <td style="text-align:left;"> FGFBP2 </td>
   <td style="text-align:left;"> 3 </td>
   <td style="text-align:right;"> 3.00 </td>
   <td style="text-align:right;"> 2.79 </td>
   <td style="text-align:right;"> 1530000 </td>
   <td style="text-align:right;"> 0.926 </td>
   <td style="text-align:right;"> 0 </td>
   <td style="text-align:right;"> 0 </td>
   <td style="text-align:right;"> 90.6 </td>
   <td style="text-align:right;"> 6.67 </td>
  </tr>
  <tr>
   <td style="text-align:left;"> GZMH </td>
   <td style="text-align:left;"> 3 </td>
   <td style="text-align:right;"> 3.18 </td>
   <td style="text-align:right;"> 2.96 </td>
   <td style="text-align:right;"> 1570000 </td>
   <td style="text-align:right;"> 0.947 </td>
   <td style="text-align:right;"> 0 </td>
   <td style="text-align:right;"> 0 </td>
   <td style="text-align:right;"> 93.4 </td>
   <td style="text-align:right;"> 7.35 </td>
  </tr>
  <tr>
   <td style="text-align:left;"> FCN1 </td>
   <td style="text-align:left;"> 4 </td>
   <td style="text-align:right;"> 3.35 </td>
   <td style="text-align:right;"> 3.29 </td>
   <td style="text-align:right;"> 1290000 </td>
   <td style="text-align:right;"> 0.992 </td>
   <td style="text-align:right;"> 0 </td>
   <td style="text-align:right;"> 0 </td>
   <td style="text-align:right;"> 98.6 </td>
   <td style="text-align:right;"> 2.34 </td>
  </tr>
  <tr>
   <td style="text-align:left;"> CST3 </td>
   <td style="text-align:left;"> 4 </td>
   <td style="text-align:right;"> 3.51 </td>
   <td style="text-align:right;"> 3.41 </td>
   <td style="text-align:right;"> 1290000 </td>
   <td style="text-align:right;"> 0.992 </td>
   <td style="text-align:right;"> 0 </td>
   <td style="text-align:right;"> 0 </td>
   <td style="text-align:right;"> 98.8 </td>
   <td style="text-align:right;"> 3.51 </td>
  </tr>
  <tr>
   <td style="text-align:left;"> CD79B </td>
   <td style="text-align:left;"> 5 </td>
   <td style="text-align:right;"> 2.70 </td>
   <td style="text-align:right;"> 2.55 </td>
   <td style="text-align:right;"> 952000 </td>
   <td style="text-align:right;"> 0.915 </td>
   <td style="text-align:right;"> 0 </td>
   <td style="text-align:right;"> 0 </td>
   <td style="text-align:right;"> 84.8 </td>
   <td style="text-align:right;"> 5.45 </td>
  </tr>
  <tr>
   <td style="text-align:left;"> CD79A </td>
   <td style="text-align:left;"> 5 </td>
   <td style="text-align:right;"> 2.95 </td>
   <td style="text-align:right;"> 2.92 </td>
   <td style="text-align:right;"> 987000 </td>
   <td style="text-align:right;"> 0.948 </td>
   <td style="text-align:right;"> 0 </td>
   <td style="text-align:right;"> 0 </td>
   <td style="text-align:right;"> 89.9 </td>
   <td style="text-align:right;"> 1.23 </td>
  </tr>
  <tr>
   <td style="text-align:left;"> GZMK </td>
   <td style="text-align:left;"> 6 </td>
   <td style="text-align:right;"> 2.88 </td>
   <td style="text-align:right;"> 2.62 </td>
   <td style="text-align:right;"> 555000 </td>
   <td style="text-align:right;"> 0.915 </td>
   <td style="text-align:right;"> 0 </td>
   <td style="text-align:right;"> 0 </td>
   <td style="text-align:right;"> 90.2 </td>
   <td style="text-align:right;"> 8.23 </td>
  </tr>
  <tr>
   <td style="text-align:left;"> NKG7 </td>
   <td style="text-align:left;"> 6 </td>
   <td style="text-align:right;"> 3.02 </td>
   <td style="text-align:right;"> 1.88 </td>
   <td style="text-align:right;"> 435000 </td>
   <td style="text-align:right;"> 0.716 </td>
   <td style="text-align:right;"> 0 </td>
   <td style="text-align:right;"> 0 </td>
   <td style="text-align:right;"> 90.2 </td>
   <td style="text-align:right;"> 30.90 </td>
  </tr>
  <tr>
   <td style="text-align:left;"> GNLY </td>
   <td style="text-align:left;"> 7 </td>
   <td style="text-align:right;"> 3.98 </td>
   <td style="text-align:right;"> 3.48 </td>
   <td style="text-align:right;"> 456000 </td>
   <td style="text-align:right;"> 0.963 </td>
   <td style="text-align:right;"> 0 </td>
   <td style="text-align:right;"> 0 </td>
   <td style="text-align:right;"> 98.6 </td>
   <td style="text-align:right;"> 14.30 </td>
  </tr>
  <tr>
   <td style="text-align:left;"> GZMB </td>
   <td style="text-align:left;"> 7 </td>
   <td style="text-align:right;"> 3.11 </td>
   <td style="text-align:right;"> 2.79 </td>
   <td style="text-align:right;"> 439000 </td>
   <td style="text-align:right;"> 0.927 </td>
   <td style="text-align:right;"> 0 </td>
   <td style="text-align:right;"> 0 </td>
   <td style="text-align:right;"> 91.5 </td>
   <td style="text-align:right;"> 9.94 </td>
  </tr>
  <tr>
   <td style="text-align:left;"> CCL5 </td>
   <td style="text-align:left;"> 8 </td>
   <td style="text-align:right;"> 3.68 </td>
   <td style="text-align:right;"> 2.48 </td>
   <td style="text-align:right;"> 368000 </td>
   <td style="text-align:right;"> 0.865 </td>
   <td style="text-align:right;"> 0 </td>
   <td style="text-align:right;"> 0 </td>
   <td style="text-align:right;"> 98.4 </td>
   <td style="text-align:right;"> 33.90 </td>
  </tr>
  <tr>
   <td style="text-align:left;"> NKG7 </td>
   <td style="text-align:left;"> 8 </td>
   <td style="text-align:right;"> 3.40 </td>
   <td style="text-align:right;"> 2.24 </td>
   <td style="text-align:right;"> 334000 </td>
   <td style="text-align:right;"> 0.785 </td>
   <td style="text-align:right;"> 0 </td>
   <td style="text-align:right;"> 0 </td>
   <td style="text-align:right;"> 96.0 </td>
   <td style="text-align:right;"> 31.70 </td>
  </tr>
  <tr>
   <td style="text-align:left;"> GNLY </td>
   <td style="text-align:left;"> 9 </td>
   <td style="text-align:right;"> 3.99 </td>
   <td style="text-align:right;"> 3.39 </td>
   <td style="text-align:right;"> 128000 </td>
   <td style="text-align:right;"> 0.952 </td>
   <td style="text-align:right;"> 0 </td>
   <td style="text-align:right;"> 0 </td>
   <td style="text-align:right;"> 97.4 </td>
   <td style="text-align:right;"> 16.80 </td>
  </tr>
  <tr>
   <td style="text-align:left;"> TYROBP </td>
   <td style="text-align:left;"> 9 </td>
   <td style="text-align:right;"> 2.90 </td>
   <td style="text-align:right;"> 2.18 </td>
   <td style="text-align:right;"> 109000 </td>
   <td style="text-align:right;"> 0.810 </td>
   <td style="text-align:right;"> 0 </td>
   <td style="text-align:right;"> 0 </td>
   <td style="text-align:right;"> 89.7 </td>
   <td style="text-align:right;"> 21.10 </td>
  </tr>
</tbody>
</table>

# Save each iteration of Harmony

Let's run Harmony and limit the maximum number of iterations to 0, 1, 2,
3, 4, and 5. That way, we can track how the PC coordinates change after each
iteration.


```r
harmony_iters <- c(0, 1, 2, 3, 4, 5)
res <- lapply(harmony_iters, function(i) {
  set.seed(42)
  HarmonyMatrix(
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
#>                  iter donor       PC1        PC2         PC3
#> A_AAACATTGCACTAG    0     A  1.767734 -14.418014   0.5740947
#> A_AAACATTGGCTAAC    0     A  1.052417   6.005906 -10.2430982
#> A_AAACATTGTAACCG    0     A -2.031748   2.600434   1.5062893
#> A_AAACCGTGTGGTCA    0     A -1.069945  -3.784165  -0.5634285
#> A_AAACCGTGTTACCT    0     A  1.496703   5.978402 -11.1087743
#> A_AAACGCACACGGGA    0     A -2.889615   3.397147   2.3764580
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
res.umap[[1]] <- umap(d = res[[1]], config = umap.settings)

for (i in 2:length(res)) {
  print(i)
  # Initialize UMAP with the coordinates from the previous Harmony iteration.
  umap.settings$init <- res.umap[[i - 1]]$layout
  set.seed(umap.seed)
  res.umap[[i]] <- umap(d = res[[i]], config = umap.settings)
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
#>    UMAP1 UMAP2   PC1   PC2   PC3    PC4   PC5    PC6   PC7   PC8   PC9
#>    <dbl> <dbl> <dbl> <dbl> <dbl>  <dbl> <dbl>  <dbl> <dbl> <dbl> <dbl>
#> 1 -0.517 11.9   20.1  1.44  2.82 -0.246 1.14   1.45   1.16  2.02 0.452
#> 2 -4.44  11.7   19.3  1.81  2.84  1.75  0.175 -0.448 -2.69  1.03 1.24 
#> 3 -0.395  9.48  19.2  1.84  2.90  1.80  0.160 -0.418 -2.80  1.07 1.29 
#> 4  0.562  9.45  19.2  1.84  2.90  1.80  0.160 -0.418 -2.80  1.07 1.29 
#> 5  3.30  11.8   19.2  1.84  2.90  1.80  0.160 -0.418 -2.80  1.07 1.29 
#> 6  6.15  13.4   19.2  1.84  2.90  1.80  0.160 -0.418 -2.80  1.07 1.29 
#> # … with 26 more variables: PC10 <dbl>, PC11 <dbl>, PC12 <dbl>,
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
4 (the columns in the grid below).

Clusters 3 and 4 are each adjusted by different amounts:
- PC4 is adjusted more for cluster 3 than cluster 4.
- PC7 is adjusted more for cluster 4 than cluster 3.

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





We can also look at PCs. For example, take a closer look at cells moving along
PC1. You might notice that the cells on the right side of the panel move more
than the cells on the left side of the panel. This tells us all cells do not
get an identical adjustment along PC1. Instead, each cell's PC1 value is
adjusted differently than its neighbors.

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

[Edit this page on GitHub][source]

[source]: https://github.com/slowkow/slowkow.com/blob/master/content/notes/harmony-animation.Rmd

