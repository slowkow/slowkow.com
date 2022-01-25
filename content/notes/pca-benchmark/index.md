---
title: "Benchmark principal component analysis (PCA) of scRNA-seq data in R"
author: "Kamil Slowikowski"
date: "2022-01-25"
layout: post
tags:
  - R
  - Tutorials
categories: notes
thumb: "/notes/pca-benchmark/fig-plot_benchmark-1.png"
twitter:
  card: "summary_large_image"
editor_options: 
  chunk_output_type: console
---

Principal component analysis (PCA) is frequently used for analysis of
single-cell RNA-seq (scRNA-seq) data. We can use it to reduce the
dimensionality of a large matrix with thousands of features (genes) to a
smaller matrix with just a few factors (principal components). Since the latest
scRNA-seq datasets include millions of cells, there is a need for efficient
algorithms. Specifically, we need algorithms that work with sparse matrices
instead of dense matrices. Here, we benchmark five implementations of singular
value decomposition (SVD) and PCA.

<!--more-->

# Introduction to PCA and SVD

For a comprehensive introduction to PCA and how to use it for data analysis, please see:

- [Herve Abdi and Lynne J. Williams. Principal component analysis.][abdi] (27 pages, free PDF)

[abdi]: https://personal.utdallas.edu/~herve/abdi-awPCA2010.pdf



# Compare 5 functions for principal component analysis

`stats::prcomp()` from base R.

`rsvd::rpca()` from the [rsvd] R package by [Ben Erichson].

`RSpectra::svds()` from the [RSpectra] R package by [Yixuan Qiu].

`irlba::prcomp_irlba()` and `irlba::irlba()` From the [irlba] R package by [B. W. Lewis].

[rsvd]: https://github.com/erichson/rSVD
[Ben Erichson]: https://github.com/erichson
[RSpectra]: https://github.com/yixuan/RSpectra
[Yixuan Qiu]:https://github.com/yixuan
[irlba]: https://github.com/bwlewis/irlba
[B. W. Lewis]: https://github.com/bwlewis


```r
install.packages(c("rsvd", "RSpectra", "irlba"))
```



# Load single-cell RNA-seq data

We use the dataset of epithelial (Epi) cells published in an article by
[Smillie et al. 2019][Smillie2019], which is available for download at
[SCP259].

[Smillie2019]: https://doi.org/10.1016/j.cell.2019.06.029
[SCP259]: https://singlecell.broadinstitute.org/single_cell/study/SCP259/intra-and-inter-cellular-rewiring-of-the-human-colon-during-ulcerative-colitis


```r
a1 <- qread("Smillie2019-Epi-counts.qs")
```



Let's count the number of genes (rows) and cells (columns). And let's see how
many entries in the matrix are non-zero:


```r
dim(a1$counts)
```

```
## [1]  20028 123006
```

```r
get_density <- function(x) length(x@x) / x@Dim[1] / x@Dim[2]

get_density(a1$counts)
```

```
## [1] 0.07080145
```







Next, let's normalize the unique molecular identifier (UMI) counts to log1p
counts per million (CPM). We use the median of the number of UMIs per cell as
the scaling factor for all cells.


```r
counts_to_cpm <- function(A, norm = median(Matrix::colSums(A))) {
  A@x <- A@x / rep.int(Matrix::colSums(A), diff(A@p))
  A@x <- norm * A@x
  return(A)
}
a1$logcpm <- log1p(counts_to_cpm(a1$counts))
```

Before we run PCA, let's filter the set of features (genes) in our dataset. We
exclude 37 mitochondrial genes that begin with the string "MT-", because we're
interested in the variation of other genes. Next, we use [loess regression] to
model the relationship between log10(mean) and log10(sd) for each gene,
computed from the raw counts. We select the genes with highest residual
variance from that model.

[loess regression]: https://en.wikipedia.org/wiki/Local_regression


```r
# Exclude MT genes
mito_genes <- rownames(a1$counts)[which(str_detect(rownames(a1$counts), "^MT-"))]

# Fit a model from raw counts that captures log10(sd) ~ log10(mean)
a1$loess <- do_loess(a1$counts, exclude_genes = mito_genes, loess_span = 0.1, min_percent = 0.1)

# Select genes with greatest residual variation
a1$selected_genes <- (
  a1$loess$est %>%
  filter(!is.na(residuals)) %>%
  mutate(selected = residuals > quantile(residuals, 0.85)) %>%
  filter(selected)
)$gene

mat <- a1$logcpm[a1$selected_genes,]
```


# Run PCA or SVD with each function

Below, we can see how to run PCA with each function, along with a plot of the
first few factors (e.g., from `mat_prcomp$x` or `mat_svds$x`) returned by each
function. The plots look nearly identical, except that the sign is sometimes
flipped. The sign flips are expected and will not affect downstream results.



## stats::prcomp()




```r
mat_prcomp <- prcomp(t(mat), center = TRUE, scale = TRUE, rank. = n_pcs)
```

![plot of chunk plot_prcomp](fig-plot_prcomp-1.png)

## Rspectra::svds()




```r
mat_svds <- RSpectra::svds(
  A    = t(mat),
  k    = n_pcs,
  opts = list(center = TRUE, scale = TRUE)
)
# Magic data-dependent number to work around a bug
# https://github.com/yixuan/RSpectra/issues/22
mat_svds$d <- mat_svds$d * 99.995
mat_svds$x <- mat_svds$u %*% diag(mat_svds$d)
```

![plot of chunk plot_svds](fig-plot_svds-1.png)

## rsvd::rpca()




```r
mat_rpca <- rsvd::rpca(
  A      = t(mat),
  k      = n_pcs,# number of dominant principle components to be computed
  center = TRUE, # zero center the variables
  scale  = TRUE, # unit variance the variables
  retx   = TRUE, # return rotated variables
  p      = 20,   # oversampling parameter for rsvd (default p=10)
  q      = n_pcs - 1, # number of additional power iterations for rsvd (default q=1)
  rand   = TRUE  # if (TRUE), the rsvd routine is used, otherwise svd is used
)
```

![plot of chunk plot_rpca](fig-plot_rpca-1.png)

## irlba::prcomp\_irlba()




```r
mat_irlba <- irlba::prcomp_irlba(
  x      = t(mat),
  n      = n_pcs,
  center = TRUE,
  scale. = TRUE
)
```

![plot of chunk plot_irlba](fig-plot_irlba-1.png)

## irlba::irlba()




```r
mat_irlba2 <- irlba::irlba(
  A      = t(mat),
  nv     = n_pcs,
  center = Matrix::rowMeans(mat),
  scale  = proxyC::rowSds(mat)
)
mat_irlba2$x <- mat_irlba2$u %*% diag(mat_irlba2$d)
```

![plot of chunk plot_irlba2](fig-plot_irlba2-1.png)


# All of the PCA results are similar to each other

We expect slight fluctuations in the outputs due to implementation details, but
the results should be similar between all of the functions. 

The [root mean squared
error](https://en.wikipedia.org/wiki/Root-mean-square_deviation) might be a
reasonable metric to assess similarity of two vectors:


```r
# Root Mean Squared Error
rmse <- function(x, y) sqrt( sum((x - y) ^ 2) / length(x) )
```

The factor scores are similar to what we get from `stats::prcomp()`:


```r
rbindlist(lapply(
  list("mat_svds", "mat_rpca", "mat_irlba", "mat_irlba2"),
  function(x) {
    list(
      method = x,
      rmse = rmse( abs( mat_prcomp$x[,1] ), abs( get(x)$x[,1] ) )
    )
  }
)) %>% mutate_if(is.numeric, signif, 2)
```

```
##        method    rmse
## 1:   mat_svds 7.6e-09
## 2:   mat_rpca 1.1e-13
## 3:  mat_irlba 2.9e-14
## 4: mat_irlba2 5.7e-14
```

Suppose the `stats::prcomp()` output is correct. Are the other outputs
correlated?

![plot of chunk pca_cor](fig-pca_cor-1.png)

For `rsvd::rpca()`, the last PCs are slightly less correlated with
`stats::prcomp()`. We can improve the correlation by increasing `p` and `q`
parameters.


# Run time and memory usage with increasing number of cells

The latest scRNA-seq datasets have millions of cells, so it's important to find
methods that can handle large datasets.

We use the [bench] R package to measure run time and memory usage for each function:

[bench]: https://github.com/r-lib/bench


```r
mat <- a1$logcpm[a1$selected_genes,]
dim(mat)
```

```
## [1]   2409 123006
```

```r
mat_meta <- a1$obs[match(colnames(mat), a1$obs$NAME),]
all(mat_meta$NAME == colnames(mat))
```

```
## [1] TRUE
```

```r
# Helper function to take a subset of cells from mat
prep_matrix <- function(n_cells) {
  set.seed(42)
  X <- mat[,sample.int(n = ncol(mat), size = n_cells)]
  if (nrow(X) > ncol(X)) { # If more genes than cells, use fewer genes
    X <- X[1:(ncol(X)/2),]
  }
  X <- X[rowSums(X) > 0,]
  X <- X[,colSums(X) > 0]
  return(X)
}

file_bench <- "pca-benchmark.tsv"
if (file.exists(file_bench)) {

  d <- fread(file_bench)

} else {

  pca_bench <- bench::press(
    n_cells = c(1000, 2000, 4000, 8000, 32000, 64000, 123006),
    {
      X <- prep_matrix(n_cells)
      bench::mark(
        check = FALSE,
        time_unit = 's',
        max_iterations = 5,
        "stats::prcomp()" = {
          prcomp(t(X), center = TRUE, scale = TRUE, rank. = 20)
        },
        "RSpectra::svds()" = {
          retval <- RSpectra::svds(A = t(X), k = 20, opts = list(center = TRUE, scale = TRUE))
          retval$d <- retval$d * 99.995
          retval$x <- retval$u %*% diag(retval$d)
          retval
        },
        "irlba::prcomp_irlba()" = {
          irlba::prcomp_irlba(x = t(X), n = 20, center = TRUE, scale. = TRUE)
        },
        "irlba::irlba()" = {
          X_center <- rowMeans(X)
          X_scale <- proxyC::rowSds(X)
          suppressWarnings({
            retval <- irlba::irlba(A = t(X), nv = 20, center = X_center, scale = X_scale)
          })
          retval$x <- retval$u %*% diag(retval$d)
          retval
        },
        "rsvd::rpca()" =  {
          rsvd::rpca(
            A = t(X), k = 20, center = TRUE, scale = TRUE, retx = TRUE,
            p = 10, q = 19, rand = TRUE
          )
        }
      )
    }
  )

  pca_bench$method = attr(pca_bench$expression, "description")
  fwrite(
    x = as_tibble(pca_bench) %>% select(-expression, -result, -memory, -time, -gc),
    file = file_bench,
    sep = "\t"
  )

}
```

The run time and memory usage of each algorithm increases in proportion to the
number of cells we analyze:

![plot of chunk plot_benchmark](fig-plot_benchmark-1.png)

Here is a summary of the performance:


|method                |n_cells |seconds |gb    |cells_per_second |cells_per_gb |
|:---------------------|:-------|:-------|:-----|:----------------|:------------|
|stats::prcomp()       |123,000 |120.00  |42.10 |1,030            |2,920        |
|irlba::prcomp_irlba() |123,000 |104.00  |7.93  |1,190            |15,500       |
|rsvd::rpca()          |123,000 |88.00   |31.90 |1,400            |3,850        |
|RSpectra::svds()      |123,000 |10.10   |0.56  |12,200           |218,000      |
|irlba::irlba()        |123,000 |9.52    |0.78  |12,900           |157,000      |

# Conclusions

The functions `RSpectra::svds()` and `irlba::irlba()` are the most efficient
for computing the SVD for a sparse matrix with single-cell RNA-seq data.

The `RSpectra::svds()` function has the most efficient memory usage, but it is
almost the same as `irlba::irlba()`.

It seems that there [may be a bug][rspectra22] in the `RSpectra::svds()`
function that causes it to return incorrect eigenvalues (`svd$d`) when we use
`opt = list(center = TRUE, scale = TRUE)`.

[rspectra22]: https://github.com/yixuan/RSpectra/issues/22

I would be grateful if you would tell me about any errors you found in this
note. Please feel free to [contact me on Twitter][twitter] or email!

[twitter]: https://twitter.com/slowkow
[Matrix]: https://CRAN.R-project.org/package=Matrix

## How large is the matrix after manually scaling each gene?

After scaling, most of the entries in the matrix will no longer be equal to
zero. So, the resulting matrix will be represented as a dense matrix instead.
We often want to avoid forming the dense matrix in order to avoid using more
memory.

How large is the resulting dense matrix?


```r
# Center and scale each row of a sparse matrix.
scale_data <- function(X) {
  X_mean <- Matrix::rowMeans(X)
  X_std <- proxyC::rowSds(X)
  X <- as.matrix(X - X_mean)
  X <- X / X_std
  X[is.na(X)] <- 0
  return(X)
}
```


```r
# The sparse matrix with logcpm values
size1 <- pryr::object_size(mat)
size1
```

```
## 325 MB
```

```r
# The dense matrix with scaled (mean 0 variance 1) values
size2 <- pryr::object_size(scale_data(mat))
size2
```

```
## 2.38 GB
```

The memory allocation increases 7.3-fold for the dense
scaled matrix. Note that irlba and RSpectra manage to effectively scale the
data without allocating 2.38 GB of memory!


## What is the maximum number of cells we can analyze in R?

One way to address this question is to check how much memory is allocated for a
matrix with different sizes, but with the same density as a real data matrix.


```r
# Density of a real scRNA-seq matrix is usually between 5% and 10%
length(mat@x) / (mat@Dim[1] * mat@Dim[2])
# 0.088

sim <- rsparsematrix(nrow = 2409, ncol = 1e6, density = 0.088)
pryr::object_size(sim)
# 2.55 GB

sim <- rsparsematrix(nrow = 2409, ncol = 2e6, density = 0.088)
pryr::object_size(sim)
# 5.1 GB
```

It seems that we need about 2.55G of memory per million cells if we keep 2,409
genes per cell.

If we assume 0.088 density and 2409 genes, then we might expect to be able to
analyze up to 10 or 11 million cells before we hit [the 32 bit
limit](https://stackoverflow.com/questions/16446154/create-a-very-large-sparse-matrix-in-r).


```r
2409 * 11e6 * 0.088 > .Machine$integer.max
```

```
## [1] TRUE
```

It may be more realistic to assume 0.088 density and 20,000 genes. We'll want
to compute statistics for each gene first, and then pass the filtered matrix to
downstream functions. That means we will already hit the 32 bit limit when we
try to read a counts matrix with 2 million cells and 20,000 genes:


```r
2e4 * 2e6 * 0.088 > .Machine$integer.max
```

```
## [1] TRUE
```

# Source code

The [source code] for this note is available for you to read.

[source code]: https://github.com/slowkow/slowkow.com/tree/master/content/notes/pca-benchmark/index.Rmd


# Session Information

Here are the version numbers at the time of writing:


|         |version |url                                       |
|:--------|:-------|:-----------------------------------------|
|RSpectra |0.16.0  |https://github.com/yixuan/RSpectra        |
|rsvd     |1.0.5   |https://github.com/erichson/rSVD          |
|irlba    |2.3.5   |https://github.com/bwlewis/irlba          |
|Matrix   |1.3.3   |https://CRAN.R-project.org/package=Matrix |
|proxyC   |0.2.0   |https://github.com/koheiw/proxyC          |

Here are the version numbers for all of the software:


```r
sessionInfo()
```

```
## R version 4.1.0 (2021-05-18)
## Platform: x86_64-pc-linux-gnu (64-bit)
## Running under: Ubuntu 18.04.5 LTS
## 
## Matrix products: default
## BLAS:   /usr/lib/x86_64-linux-gnu/openblas/libblas.so.3
## LAPACK: /usr/lib/x86_64-linux-gnu/libopenblasp-r0.2.20.so
## 
## locale:
##  [1] LC_CTYPE=en_US.UTF-8       LC_NUMERIC=C              
##  [3] LC_TIME=en_US.UTF-8        LC_COLLATE=en_US.UTF-8    
##  [5] LC_MONETARY=en_US.UTF-8    LC_MESSAGES=en_US.UTF-8   
##  [7] LC_PAPER=en_US.UTF-8       LC_NAME=C                 
##  [9] LC_ADDRESS=C               LC_TELEPHONE=C            
## [11] LC_MEASUREMENT=en_US.UTF-8 LC_IDENTIFICATION=C       
## 
## attached base packages:
## [1] stats     graphics  grDevices utils     datasets  methods   base     
## 
## other attached packages:
##  [1] geomtextpath_0.1.0   bench_1.1.2          profmem_0.6.0       
##  [4] scattermore_0.7      qs_0.24.1            data.table_1.14.2   
##  [7] scales_1.1.1         glue_1.6.0           ggrepel_0.9.1       
## [10] microbenchmark_1.4.9 forcats_0.5.1        stringr_1.4.0       
## [13] dplyr_1.0.7          purrr_0.3.4          readr_1.4.0         
## [16] tidyr_1.1.4          tibble_3.1.6         tidyverse_1.3.1     
## [19] patchwork_1.1.1      ggplot2_3.3.5        knitr_1.33          
## [22] irlba_2.3.5          Matrix_1.3-3         rsvd_1.0.5          
## [25] RSpectra_0.16-0     
## 
## loaded via a namespace (and not attached):
##  [1] matrixStats_0.61.0  fs_1.5.2            bit64_4.0.5        
##  [4] lubridate_1.7.10    httr_1.4.2          rprojroot_2.0.2    
##  [7] tools_4.1.0         backports_1.2.1     bslib_0.3.1        
## [10] utf8_1.2.2          R6_2.5.1            DBI_1.1.1          
## [13] colorspace_2.0-2    withr_2.4.3         prettyunits_1.1.1  
## [16] processx_3.5.2      tidyselect_1.1.1    proxyC_0.2.0       
## [19] bit_4.0.4           curl_4.3.2          compiler_4.1.0     
## [22] textshaping_0.3.6   cli_3.1.0           rvest_1.0.0        
## [25] xml2_1.3.2          sandwich_3.0-1      labeling_0.4.2     
## [28] stringfish_0.15.1   sass_0.4.0          hexbin_1.28.2      
## [31] mvtnorm_1.1-1       callr_3.7.0         systemfonts_1.0.3  
## [34] digest_0.6.29       R.utils_2.10.1      rmarkdown_2.8      
## [37] pkgconfig_2.0.3     htmltools_0.5.2     scico_1.2.0        
## [40] dbplyr_2.1.1        fastmap_1.1.0       highr_0.9          
## [43] rlang_0.4.12        readxl_1.3.1        pryr_0.1.4         
## [46] rstudioapi_0.13     jquerylib_0.1.4     farver_2.1.0       
## [49] generics_0.1.1      RApiSerialize_0.1.0 zoo_1.8-9          
## [52] jsonlite_1.7.2      R.oo_1.24.0         magrittr_2.0.1     
## [55] Rcpp_1.0.8          munsell_0.5.0       fansi_1.0.2        
## [58] R.methodsS3_1.8.1   lifecycle_1.0.1     Metrics_0.1.4      
## [61] stringi_1.7.6       multcomp_1.4-17     yaml_2.2.1         
## [64] MASS_7.3-54         pkgbuild_1.2.0      grid_4.1.0         
## [67] crayon_1.4.2        lattice_0.20-44     haven_2.4.1        
## [70] splines_4.1.0       hms_1.1.0           ps_1.6.0           
## [73] pillar_1.6.4        codetools_0.2-18    reprex_2.0.0       
## [76] evaluate_0.14       remotes_2.3.0       RcppParallel_5.1.4 
## [79] modelr_0.1.8        vctrs_0.3.8         cellranger_1.1.0   
## [82] gtable_0.3.0        assertthat_0.2.1    xfun_0.23          
## [85] broom_0.7.11        ragg_1.2.1          survival_3.2-11    
## [88] TH.data_1.0-10      ellipsis_0.3.2
```


