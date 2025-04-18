#' ---
#' title: "Quickly aggregate your data in R with data.table"
#' author: "Kamil Slowikowski"
#' date: "2015-01-28"
#' layout: post
#' tags:
#'   - R
#' categories: notes
#' redirect_from: "/2015/01/28/data-table-aggregate"
#' thumb: "/images/datatable-logo.png"
#' twitter:
#'   card: "summary"
#' ---
#' 
#' 
## ----setup, include=FALSE-----------------------------------------------------
library(knitr)
opts_chunk$set(
  echo = TRUE
)

#' 
#' 
#' In genomics data, we often have multiple measurements for each gene.
#' Sometimes we want to aggregate those measurements with the mean, median, or
#' sum. The [data.table] R package can do this quickly with large datasets.
#' 
#' In this note, we compute the average of multiple measurements for each gene in
#' a gene expression matrix.
#' 
#' <!--more-->
#' 
#' [data.table]: http://cran.r-project.org/web/packages/data.table/
#' [aggregate]: http://www.inside-r.org/r-doc/stats/aggregate
#' 
#' To see what else you can do with `data.table`, check out these
#' fantastic cheat sheets:
#' 
#' - [A brief cheat sheet from DataCamp (pdf)][brief]
#' - [A detailed cheat sheet from DataCamp (pdf)][detailed]
#' 
#' [brief]: https://s3.amazonaws.com/assets.datacamp.com/blog_assets/datatable_Cheat_Sheet_R.pdf
#' [detailed]: https://s3.amazonaws.com/assets.datacamp.com/img/blog/data+table+cheat+sheet.pdf
#' 
#' # Summary
#' 
#' 1. Make random data
#' 2. Aggregate quickly with `data.table`
#' 3. Aggregate slowly with `stats::aggregate()`
#' 
#' # Step 1. Make random data
#' 
#' 
## ----random-data--------------------------------------------------------------
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

#' 
#' 
#' # Step 2. Aggregate quickly with data.table
#' 
#' Now we can easily average the probes for each gene.
#' 
#' 
## ----data-table-aggregate-----------------------------------------------------
system.time({
    d_mean <- d[, lapply(.SD, mean), by = Gene, .SDcols = sprintf("S%s", 1:100)]
})
d_mean[1:5,1:5]

#' 
#' 
#' # Step 3. Aggregate slowly with stats::aggregate()
#' 
#' The base R function `stats::aggregate()` can do the same thing, but it is
#' much slower.
#'  
#' 
## ----stats-aggregate----------------------------------------------------------
dat <- data.frame(d)
system.time({
  d_mean2 <- aggregate(dat[, 3:102], by = list(dat$Gene), mean)
})

#' 
#' 
#' The results are identical:
#' 
#' 
## ----identical-results--------------------------------------------------------
colnames(d_mean2)[1] <- "Gene"
all.equal(d_mean, data.table(d_mean2))

#' 
#' 
#' Feel free to read the [source code] for this post.
#' 
#' [source code]: https://github.com/slowkow/slowkow.com/blob/master/_rmd/2015-01-28-data-table-aggregate.R
#' 
