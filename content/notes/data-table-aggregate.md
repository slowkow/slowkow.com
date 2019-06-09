---
title: "Quickly aggregate your data in R with data.table"
author: "Kamil Slowikowski"
date: "2015-01-28"
layout: post
tags:
  - R
categories: notes
redirect_from: "/2015/01/28/data-table-aggregate"
thumb: "/images/datatable-logo.png"
twitter:
  card: "summary"
---





In genomics data, we often have multiple measurements for each gene.
Sometimes we want to aggregate those measurements with the mean, median, or
sum. The [data.table] R package can do this quickly with large datasets.

In this note, we compute the average of multiple measurements for each gene in
a gene expression matrix.

<!--more-->

[data.table]: http://cran.r-project.org/web/packages/data.table/
[aggregate]: http://www.inside-r.org/r-doc/stats/aggregate

To see what else you can do with `data.table`, check out these
fantastic cheat sheets:

- [A brief cheat sheet from DataCamp (pdf)][brief]
- [A detailed cheat sheet from DataCamp (pdf)][detailed]

[brief]: https://s3.amazonaws.com/assets.datacamp.com/blog_assets/datatable_Cheat_Sheet_R.pdf
[detailed]: https://s3.amazonaws.com/assets.datacamp.com/img/blog/data+table+cheat+sheet.pdf

# Summary

1. Make random data
2. Aggregate quickly with `data.table`
3. Aggregate slowly with `stats::aggregate()`

# Step 1. Make random data



```r
random_string <- function(n, chars) {
  replicate(n = n, expr = {
    paste(sample(LETTERS, chars, replace = TRUE), collapse = "")
  })
}

set.seed(42)

# Each gene is represented by 1 or more probes.
n_probes <- 1e5
gene_names <- random_string(n_probes, 3)
sort(table(gene_names), decreasing = TRUE)[1:10]
#> gene_names
#> BWU DIH QLP WAX XVA ZPT FBE HMO LZS NTD 
#>  17  16  16  16  16  16  15  15  15  15

library(data.table)
d <- data.table(
  Gene = gene_names,
  Probe = seq_along(gene_names)
)

# We measured genes in a number of samples.
n_samples <- 100
for (i in seq(n_samples)) {
  d[[sprintf("S%s", i)]] <- rnorm(nrow(d))
}

# Now we have a gene expression matrix.
# Notice that gene "AAB" is represented by multiple probes.
d <- d[order(d$Gene)]
d[1:5,1:5]
#>    Gene Probe         S1          S2          S3
#> 1:  AAA 17339  0.6886677 -0.59704276  0.73534953
#> 2:  AAA 19529  0.2430747  0.48148142 -0.07411017
#> 3:  AAA 19915  0.4096048 -0.02989425 -0.91970815
#> 4:  AAA 34545 -0.4604622 -2.02437078 -0.09687003
#> 5:  AAA 81092  0.9990284 -1.22508517  1.32621912
```


# Step 2. Aggregate quickly with data.table

Now we can easily average the probes for each gene.



```r
system.time({
    d_mean <- d[, lapply(.SD, mean), by = Gene, .SDcols = sprintf("S%s", 1:100)]
})
#>    user  system elapsed 
#>   0.179   0.015   0.072
d_mean[1:5,1:5]
#>    Gene          S1         S2          S3          S4
#> 1:  AAA  0.33549805 -0.9506345  0.04691119 -0.08173554
#> 2:  AAC -0.46102761 -0.2623302 -0.03353125  0.20238075
#> 3:  AAD  0.02861623  0.6479871  0.42838896 -0.28628726
#> 4:  AAE  0.04544300 -0.3214495  0.33347142  0.11855635
#> 5:  AAF -0.25445109 -0.5118745 -0.24236236  0.03974918
```


# Step 3. Aggregate slowly with stats::aggregate()

The base R function `stats::aggregate()` can do the same thing, but it is
much slower.
 


```r
dat <- data.frame(d)
system.time({
  d_mean2 <- aggregate(dat[, 3:102], by = list(dat$Gene), mean)
})
#>    user  system elapsed 
#>  10.617   0.181  10.862
```


The results are identical:



```r
colnames(d_mean2)[1] <- "Gene"
all.equal(d_mean, data.table(d_mean2))
#> [1] TRUE
```


Feel free to edit the [source code] for this post.

[source code]: https://github.com/slowkow/slowkow.com/blob/master/_rmd/2015-01-28-data-table-aggregate.R
