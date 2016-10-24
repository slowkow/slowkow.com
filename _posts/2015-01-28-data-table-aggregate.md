---
layout: post
tags: R
redirect_from: "/2015/01/28/data-table-aggregate"
categories: notes
title: Quickly aggregate your data with data.table in R
categories: notes
---

I wrote a function using [data.table] to replace the default [aggregate]
function in [R]. It runs about 100 times faster on my data (0.32 seconds
instead of 33 seconds). I use it for [microarray] gene expression data, where
I compute the mean expression values for genes that are represented by more
than one probe on the microarray.

<!--more-->

Below, `rmaExp` is a matrix of expression values, where each row is a probe on
the array and each column is an experiment. I have 36 experiments and 53,617
probes.

Many genes are represented by more than one probe, so I want to collapse those
rows by taking the mean of the probe values.

This is a (slow) way to do it with base R functions:

```r
dim(rmaExp)
# [1] 53617   36

length(entrezids)
# [1] 53617

system.time({
  dat <- data.frame(rmaExp)
  dat$entrezid <- entrezids
  dat <- aggregate(dat[ , 1:36], by = list(dat$entrezid), mean, na.rm = TRUE)
  rownames(dat) <- dat$Group.1
  dat <- dat[ , 2:37]
})
#    user  system elapsed 
#  32.941   0.118  33.058 
```

Here's a function to get the same result, this time using the [data.table] and
[reshape2] packages:

(You must load `reshape2` in order to use `melt` on a `data.table`.)

```r
#' Take the mean of all columns of a matrix or dataframe, where rows are
#' aggregated by a vector of values. 100 times faster than stats::aggregate.
#'
#' @param dat A numeric matrix or data.frame.
#' @param xs A vector of groups (e.g. gene names).
#' @return A data.table with the aggregated mean for each group.
#' @seealso stats::aggregate
mean_by <- function(dat, xs) {
  # Convert to data.table.
  dat <- data.table(dat)
  # Append the vector of group names as an extra column.
  dat$agg_var <- xs
  # Melt the data.table so all values are in one column called "value".
  dat <- melt(dat, id.vars = "agg_var")
  # Cast the data.table back into the original shape, and take the mean.
  dat <- dcast.data.table(
    dat, agg_var ~ variable, value.var = "value",
    fun.aggregate = mean, na.rm = TRUE
  )
  rownames(dat) <- dat$agg_var
  # Delete the extra column.
  dat[ , agg_var := NULL]
  dat
}
```

On my data, it is about 100 times faster, saving me about 30 seconds waiting
for my results. It might not seem like much, but if you run a function many
times each day, or if you interactively explore your data, then it makes a big
difference.

```r
system.time({ dat2 = mean_by(rmaExp, entrezids) })
#    user  system elapsed 
#   0.320   0.092   0.411 
```

The results are identical:

```r
all(as.matrix(dat1) == as.matrix(dat2))
# [1] TRUE
```


[data.table]: http://cran.r-project.org/web/packages/data.table/
[reshape2]: http://cran.r-project.org/web/packages/reshape2/
[aggregate]: http://www.inside-r.org/r-doc/stats/aggregate
[R]: http://www.r-project.org/
[microarray]: https://en.wikipedia.org/wiki/DNA_microarray

