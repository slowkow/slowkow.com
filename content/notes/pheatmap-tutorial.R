#' ---
#' title: "Make heatmaps in R with pheatmap"
#' author: "Kamil Slowikowski"
#' date: "2017-02-16"
#' layout: post
#' tags: 
#'   - R
#'   - Tutorials
#' categories: notes
#' thumb: /notes/pheatmap-tutorial_files/figure-html/pheatmap-quantile-dendsort-example-1.png
#' twitter:
#'   card: "summary_large_image"
#' ---
#' 
#' 
## ----setup, include=FALSE------------------------------------------------
library(knitr)
opts_chunk$set(
  echo = TRUE
)

#' 
#' 
#' Here are a few tips for making heatmaps with the {{< cran pheatmap >}} R package by [Raivo Kolde]. We'll use quantile color
#' breaks, so each color represents an equal proportion of the data. We'll also
#' cluster the data with neatly sorted dendrograms, so it's easy to see which
#' samples are closely or distantly related.
#' 
#' [Raivo Kolde]: https://github.com/raivokolde
#' 
#' <!--more-->
#' 
#' The code for this post is available here:
#' 
#' - <a rel="noopener" target="_blank" href="/notes/pheatmap-tutorial.R" download>pheatmap-tutorial.R</a>
#' 
#' # Making random data
#' 
#' Let's make some random data:
#' 
#' 
## ----random-data---------------------------------------------------------
set.seed(42)
random_string <- function(n) {
  substr(paste(sample(letters), collapse = ""), 1, n)
}

mat <- matrix(rgamma(1000, shape = 1) * 5, ncol = 50)

colnames(mat) <- paste(
  rep(1:3, each = ncol(mat) / 3),
  replicate(ncol(mat), random_string(5)),
  sep = ""
)
rownames(mat) <- replicate(nrow(mat), random_string(3))

#' 
#' 
#' Here's the data:
#' 
#' 
## ------------------------------------------------------------------------
mat[1:5,1:5]

#' 
#' 
#' Let's split our columns into 3 groups:
#' 
#' 
## ------------------------------------------------------------------------
col_groups <- substr(colnames(mat), 1, 1)
table(col_groups)

#' 
#' 
#' Let's increase the values for group 1 by a factor of 5:
#' 
#' 
## ------------------------------------------------------------------------
mat[,col_groups == "1"] <- mat[,col_groups == "1"] * 5

#' 
#' 
#' The data is skewed, so most of the values are below 50, but the maximum
#' value is
#' `r round(max(mat), 0)`
#' :
#' 
#' 
## ----non-uniform-density, fig.height=3-----------------------------------
# install.packages("ggplot2")
library(ggplot2)
# Set the theme for all the following plots.
theme_set(theme_bw(base_size = 16))

dat <- data.frame(values = as.numeric(mat))
ggplot(dat, aes(values)) + geom_density(bw = "SJ")

#' 
#' 
#' # Making a heatmap
#' 
#' Let's make a heatmap and check if we can see that the group 1 values are 5
#' times larger than the group 2 and 3 values:
#' 
#' 
## ----pheatmap-default-example--------------------------------------------
# install.packages("pheatmap", "RColorBrewer", "viridis")
library(pheatmap)
library(RColorBrewer)
library(viridis)

# Data frame with column annotations.
mat_col <- data.frame(group = col_groups)
rownames(mat_col) <- colnames(mat)

# List with colors for each annotation.
mat_colors <- list(group = brewer.pal(3, "Set1"))
names(mat_colors$group) <- unique(col_groups)

pheatmap(
  mat               = mat,
  color             = inferno(10),
  border_color      = NA,
  show_colnames     = FALSE,
  show_rownames     = FALSE,
  annotation_col    = mat_col,
  annotation_colors = mat_colors,
  drop_levels       = TRUE,
  fontsize          = 14,
  main              = "Default Heatmap"
)

#' 
#' 
#' The default color breaks in `pheatmap` are uniformly distributed across
#' the range of the data.
#' 
#' We can see that values in group 1 are larger than values in groups 2 and 3.
#' However, we can't distinguish different values within groups 2 and 3.
#' 
#' # Uniform breaks
#' 
#' We can visualize the unequal proportions of data represented by each color:
#' 
#' 
## ----uniform-color-breaks------------------------------------------------
mat_breaks <- seq(min(mat), max(mat), length.out = 10)



## ----uniform-color-breaks-detail, fig.height=2, echo=FALSE---------------
dat_colors <- data.frame(
  xmin = mat_breaks[1:(length(mat_breaks)-1)],
  xmax = mat_breaks[2:length(mat_breaks)],
  ymin = 0,
  ymax = max(density(mat, bw = "SJ")$y),
  fill = rev(inferno(length(mat_breaks) - 1)),
  stringsAsFactors = FALSE
)
ggplot() +
  geom_rect(
    data = dat_colors,
    mapping = aes(
      xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax, fill = fill
    )
  ) +
  geom_density(
    data = dat,
    mapping = aes(values),
    bw = "SJ", color = "cyan"
  ) +
  scale_fill_manual(values = dat_colors$fill) +
  theme(legend.position = "none") +
  labs(title = "Uniform breaks")

#' 
#' 
#' 
#' With our uniform breaks and non-uniformly distributed data, we represent
#' `r scales::percent(sum(dat$values < 21.44411) / length(dat$values))`
#' of the data with a single color.
#' 
#' On the other hand,
#' `r sum(dat$values >= 100)`
#' data points greater than or equal to 100 are represented with 4 different
#' colors.
#' 
#' 
#' 
## ----uniform-color-breaks-bars, fig.height=3, echo=FALSE-----------------
dat2 <- as.data.frame(table(cut(
  mat, mat_breaks
)))
dat2$fill <- inferno(nrow(dat2))
ggplot() +
  geom_bar(
    data = dat2,
    mapping = aes(x = Var1, weight = Freq, fill = Var1),
    color = "black", size = 0.1
  ) +
  coord_flip() +
  scale_fill_manual(values = dat2$fill) +
  theme(legend.position = "none") +
  labs(y = "data points", x = "breaks",
       title = "Number of data points per color")

#' 
#' 
#' # Quantile breaks
#' 
#' If we reposition the breaks at the quantiles of the data, then each color
#' will represent an equal proportion of the data:
#' 
#' 
## ----quantile-color-breaks-----------------------------------------------
quantile_breaks <- function(xs, n = 10) {
  breaks <- quantile(xs, probs = seq(0, 1, length.out = n))
  breaks[!duplicated(breaks)]
}

mat_breaks <- quantile_breaks(mat, n = 11)



## ----quantile-color-breaks-detail, fig.height=2, echo=FALSE--------------
dat_colors <- data.frame(
  xmin = mat_breaks[1:(length(mat_breaks)-1)],
  xmax = mat_breaks[2:length(mat_breaks)],
  ymin = 0,
  ymax = max(density(mat, bw = "SJ")$y),
  fill = rev(inferno(length(mat_breaks) - 1)),
  stringsAsFactors = FALSE
)
ggplot() +
  geom_rect(
    data = dat_colors,
    mapping = aes(
      xmin = xmin, xmax = xmax, ymin = ymin, ymax = ymax, fill = fill
    )
  ) +
  geom_density(
    data = dat,
    mapping = aes(values),
    bw = "SJ", color = "cyan"
  ) +
  scale_fill_manual(values = dat_colors$fill) +
  theme(legend.position = "none") +
  labs(title = "Quantile breaks")



## ----quantile-color-breaks-bars, fig.height=3, echo=FALSE----------------
dat2 <- as.data.frame(table(cut(
  mat, mat_breaks
)))
dat2$fill <- inferno(nrow(dat2))
ggplot() +
  geom_bar(
    data = dat2,
    mapping = aes(x = Var1, weight = Freq, fill = Var1),
    color = "black", size = 0.1
  ) +
  coord_flip() +
  scale_fill_manual(values = dat2$fill) +
  theme(legend.position = "none") +
  labs(y = "data points", x = "breaks",
       title = "Number of data points per color")

#' 
#' 
#' When we use quantile breaks in the heatmap, we can clearly see that
#' group 1 values are much larger than values in groups 2 and 3, and we can
#' also distinguish different values within groups 2 and 3:
#' 
#' 
## ----pheatmap-quantile-example-------------------------------------------
pheatmap(
  mat               = mat,
  color             = inferno(length(mat_breaks) - 1),
  breaks            = mat_breaks,
  border_color      = NA,
  show_colnames     = FALSE,
  show_rownames     = FALSE,
  annotation_col    = mat_col,
  annotation_colors = mat_colors,
  drop_levels       = TRUE,
  fontsize          = 14,
  main              = "Quantile Color Scale"
)

#' 
#' 
#' # Transforming the data
#' 
#' We can also transform the data to the log scale instead of using quantile
#' breaks, and notice that the clustering is different on this scale:
#' 
#' 
## ----pheatmap-log10-example----------------------------------------------
pheatmap(
  mat               = log10(mat),
  color             = inferno(10),
  border_color      = NA,
  show_colnames     = FALSE,
  show_rownames     = FALSE,
  annotation_col    = mat_col,
  annotation_colors = mat_colors,
  drop_levels       = TRUE,
  fontsize          = 14,
  main              = "Log10 Transformed Values"
)

#' 
#' 
#' # Sorting the dendrograms
#' 
#' The dendrogram on top of the heatmap is messy, because the branches are
#' ordered randomly:
#' 
#' 
## ----hclust-default-example----------------------------------------------
mat_cluster_cols <- hclust(dist(t(mat)))
plot(mat_cluster_cols, main = "Unsorted Dendrogram", xlab = "", sub = "")

#' 
#' 
#' Let's flip the branches to sort the dendrogram. The most similar
#' columns will appear clustered toward the left side of the plot. The columns
#' that are more distant from each other will appear clustered toward the right
#' side of the plot.
#' 
#' 
## ----hclust-dendsort-example---------------------------------------------
# install.packages("dendsort")
library(dendsort)

sort_hclust <- function(...) as.hclust(dendsort(as.dendrogram(...)))

mat_cluster_cols <- sort_hclust(mat_cluster_cols)
plot(mat_cluster_cols, main = "Sorted Dendrogram", xlab = "", sub = "")

#' 
#' 
#' Let's do the same for rows, too, and use these dendrograms in the heatmap:
#' 
#' 
## ----pheatmap-quantile-dendsort-example----------------------------------
mat_cluster_rows <- sort_hclust(hclust(dist(mat)))
pheatmap(
  mat               = mat,
  color             = inferno(length(mat_breaks) - 1),
  breaks            = mat_breaks,
  border_color      = NA,
  cluster_cols      = mat_cluster_cols,
  cluster_rows      = mat_cluster_rows,
  show_colnames     = FALSE,
  show_rownames     = FALSE,
  annotation_col    = mat_col,
  annotation_colors = mat_colors,
  drop_levels       = TRUE,
  fontsize          = 14,
  main              = "Sorted Dendrograms"
)

#' 
#' 
#' # Rotating column labels
#' 
#' Here's a way to rotate the column labels in pheatmap (thanks to
#' [Josh O'Brien][rotate]):
#' 
#' [rotate]: http://stackoverflow.com/questions/15505607/diagonal-labels-orientation-on-x-axis-in-heatmaps/15506652#15506652
#' 
#' 
## ----pheatmap-column-labels, fig.width = 18------------------------------
# Overwrite default draw_colnames in the pheatmap package.
# Thanks to Josh O'Brien at http://stackoverflow.com/questions/15505607
draw_colnames_45 <- function (coln, gaps, ...) {
    coord <- pheatmap:::find_coordinates(length(coln), gaps)
    x     <- coord$coord - 0.5 * coord$size
    res   <- grid::textGrob(
      coln, x = x, y = unit(1, "npc") - unit(3,"bigpts"),
      vjust = 0.75, hjust = 1, rot = 45, gp = grid::gpar(...)
    )
    return(res)
}
assignInNamespace(
  x = "draw_colnames",
  value = "draw_colnames_45",
  ns = asNamespace("pheatmap")
)

pheatmap(
  mat               = mat,
  color             = inferno(length(mat_breaks) - 1),
  breaks            = mat_breaks,
  border_color      = NA,
  cluster_cols      = mat_cluster_cols,
  cluster_rows      = mat_cluster_rows,
  cellwidth         = 20,
  show_colnames     = TRUE,
  show_rownames     = FALSE,
  annotation_col    = mat_col,
  annotation_colors = mat_colors,
  drop_levels       = TRUE,
  fontsize          = 14,
  main              = "Rotated Column Names"
)

#' 
#' 
