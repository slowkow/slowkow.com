---
title: "Color points by density with ggplot2"
author: "Kamil Slowikowski"
date: "2017-01-17"
layout: post
tags:
  - R
  - Tutorials
categories: notes
thumb: /notes/ggplot2-color-by-density_files/figure-html/plot-with-density-1.png
twitter:
  card: "summary_large_image"
---

Here, we use the 2D kernel density estimation function from the [MASS] R
package to to color points by density in a plot created with [ggplot2]. This
helps us to see where most of the data points lie in a busy plot with many
overplotted points.

<!--more-->





Load libraries, define a convenience function to call [MASS::kde2d], and generate some data:

[MASS::kde2d]: https://stat.ethz.ch/R-manual/R-devel/library/MASS/html/kde2d.html



```r
library(MASS)
#> 
#> Attaching package: 'MASS'
#> The following object is masked from 'package:dplyr':
#> 
#>     select
#> The following object is masked from 'package:patchwork':
#> 
#>     area
library(ggplot2)
library(viridis)
#> Loading required package: viridisLite
#> 
#> Attaching package: 'viridis'
#> The following object is masked from 'package:scales':
#> 
#>     viridis_pal
theme_set(theme_bw(base_size = 16))

# Get density of points in 2 dimensions.
# @param x A numeric vector.
# @param y A numeric vector.
# @param n Create a square n by n grid to compute density.
# @return The density within each square.
get_density <- function(x, y, ...) {
  dens <- MASS::kde2d(x, y, ...)
  ix <- findInterval(x, dens$x)
  iy <- findInterval(y, dens$y)
  ii <- cbind(ix, iy)
  return(dens$z[ii])
}

set.seed(1)
dat <- data.frame(
  x = c(
    rnorm(1e4, mean = 0, sd = 0.1),
    rnorm(1e3, mean = 0, sd = 0.1)
  ),
  y = c(
    rnorm(1e4, mean = 0, sd = 0.1),
    rnorm(1e3, mean = 0.1, sd = 0.2)
  )
)
```


Notice how the points are overplotted, so you can't see the peak density:



```r
ggplot(dat) + geom_point(aes(x, y))
```

![plot of chunk plot-without-density](/notes/ggplot2-color-by-density_files/figure-html/plot-without-density-1.png)


Here, we split the plot into a 100 by 100 grid of squares and then color the
points by the estimated density in each square. I recommend [viridis] for the
color scheme.

[viridis]: https://cran.r-project.org/web/packages/viridis/vignettes/intro-to-viridis.html



```r
dat$density <- get_density(dat$x, dat$y, n = 100)
ggplot(dat) + geom_point(aes(x, y, color = density)) + scale_color_viridis()
```

![plot of chunk plot-with-density](/notes/ggplot2-color-by-density_files/figure-html/plot-with-density-1.png)


Here's what happens when you set `n = 15` (the squares in the grid are too big):



```r
dat$density <- get_density(dat$x, dat$y, n = 15)
ggplot(dat) + geom_point(aes(x, y, color = density)) + scale_color_viridis()
```

![plot of chunk plot-with-density-rough](/notes/ggplot2-color-by-density_files/figure-html/plot-with-density-rough-1.png)


And what if you modify the bandwidth of the normal kernel with `h = c(1, 1)`?



```r
dat$density <- get_density(dat$x, dat$y, h = c(1, 1), n = 100)
ggplot(dat) + geom_point(aes(x, y, color = density)) + scale_color_viridis()
```

![plot of chunk plot-with-density-bandwith](/notes/ggplot2-color-by-density_files/figure-html/plot-with-density-bandwith-1.png)


Check out the [MASS] package for more cool functions!

[MASS]: https://CRAN.R-project.org/package=MASS
[ggplot2]: https://CRAN.R-project.org/package=ggplot2

Also consider using the [ggpointdensity] R package by [Lukas Kremer]. It was
created two years after this note was published. 

[ggpointdensity]: https://github.com/LKremer/ggpointdensity
[Lukas Kremer]: https://github.com/LKremer

