---
title: "Color points by density with ggplot2"
author: "Kamil Slowikowski"
date: "2017-01-17"
layout: post
tags: R Tutorials
categories: notes
thumb: public/figures/plot-with-density-1.png
---
A code snippet that shows how to color points by density in R with ggplot2.



Load libraries, define a convenience function to call [MASS::kde2d], and generate some data:

[MASS::kde2d]: https://stat.ethz.ch/R-manual/R-devel/library/MASS/html/kde2d.html


{% highlight r %}
library(MASS)
library(ggplot2)
library(viridis)
theme_set(theme_bw(base_size = 16))

# Get density of points in 2 dimensions.
# @param x A numeric vector.
# @param y A numeric vector.
# @param n Create a square n by n grid to compute density.
# @return The density within each square.
get_density <- function(x, y, n = 100) {
  dens <- MASS::kde2d(x = x, y = y, n = n)
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
{% endhighlight %}

Notice how the points are overplotted, so you can't see the peak density:


{% highlight r %}
ggplot(dat) + geom_point(aes(x, y))
{% endhighlight %}

![plot of chunk plot-without-density]({{ site.url }}/{{ site.baseurl }}/public/figures/plot-without-density-1.png)

Here, we split the plot into a 100 by 100 grid of squares and then color the
points by the density in each square. I recommend [viridis] for the color
scheme.

[viridis]: https://cran.r-project.org/web/packages/viridis/vignettes/intro-to-viridis.html


{% highlight r %}
dat$density <- get_density(dat$x, dat$y)
ggplot(dat) + geom_point(aes(x, y, color = density)) + scale_color_viridis()
{% endhighlight %}

![plot of chunk plot-with-density]({{ site.url }}/{{ site.baseurl }}/public/figures/plot-with-density-1.png)

Here's what happens when you set `n = 15` (the squares in the grid are too big):


{% highlight r %}
dat$density <- get_density(dat$x, dat$y, n = 15)
ggplot(dat) + geom_point(aes(x, y, color = density)) + scale_color_viridis()
{% endhighlight %}

![plot of chunk plot-with-density-rough]({{ site.url }}/{{ site.baseurl }}/public/figures/plot-with-density-rough-1.png)

