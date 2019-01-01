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
#> HDO AKP GBN EHJ HDF HEF MOD YIK YQN CPW 
#>  18  17  17  16  16  16  16  16  16  15

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
#>    Gene Probe         S1          S2         S3
#> 1:  AAA 40739 -0.1931973  0.39253019  0.4356253
#> 2:  AAB  1512  1.3488008 -1.29539093 -2.1635566
#> 3:  AAB  2682 -1.5832467  0.52995218  1.7541041
#> 4:  AAB 11141  0.4073136 -0.64098913  0.6100341
#> 5:  AAB 96388  0.1055670  0.08436423 -1.2162599
```

# Step 2. Aggregate quickly with data.table

Now we can easily average the probes for each gene.


```r
system.time({
    d_mean <- d[, lapply(.SD, mean), by = Gene, .SDcols = sprintf("S%s", 1:100)]
})
#>    user  system elapsed 
#>   0.525   0.025   0.115
d_mean[1:5,1:5]
#>    Gene          S1         S2          S3         S4
#> 1:  AAA -0.19319732  0.3925302  0.43562530  0.8024108
#> 2:  AAB -0.07383859 -0.4262494 -0.22409594 -0.4613176
#> 3:  AAC -0.43138528  0.5606441 -0.03035397  0.1877939
#> 4:  AAD  0.70884740 -0.4440129  0.53255559 -0.1044399
#> 5:  AAE -0.16571850  0.1574606 -0.09323304  0.6574431
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
#>  10.345   0.216  10.701
```

The results are identical:


```r
colnames(d_mean2)[1] <- "Gene"
all.equal(d_mean, data.table(d_mean2))
#> [1] TRUE
```

Feel free to edit the [source code] for this post.

[source code]: https://github.com/slowkow/slowkow.com/blob/master/_rmd/2015-01-28-data-table-aggregate.R
