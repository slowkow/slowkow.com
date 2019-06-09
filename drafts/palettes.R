#' ---
#' title: "Make color palettes in R with colorspace"
#' author: "Kamil Slowikowski"
#' date: "2019-02-11"
#' layout: post
#' draft: true
#' publishdate: "3019-02-11"
#' tags: 
#'   - R
#' categories: notes
#' thumb: /notes/palettes_files/figure-html/distiller-1.png
#' twitter:
#'   card: "summary_large_image"
#' ---
#' 
#' 
## ----setup, include=FALSE------------------------------------------------
library(utils)
library(ggplot2)
library(tidyverse)
library(patchwork)
library(knitr)
opts_chunk$set(
  echo = TRUE,
  cache = TRUE,
  cache.path = 'cache/'
)

#' 
#' 
#' Let's have a look at some of the palettes available in the [colorspace] R
#' package by [Achim Zeileis].
#' 
#' [colorspace]: https://CRAN.R-project.org/package=colorspace
#' [Achim Zeileis]: https://eeecon.uibk.ac.at/~zeileis/
#' 
#' <!--more-->
#' 
#' # Scico
#' 
#' The [scico] package is filled with fantastic functions for working with
#' color palettes.
#' 
#' [scico]: https://cran.r-project.org/web/packages/colorspace/vignettes/colorspace.html
#' 
#' 
## ----scico1, warning = FALSE, echo = FALSE, dpi = 300, fig.width = 2, fig.asp = 1.62----
library("scico")
library("ggplot2")

d <- expand.grid(
  x = seq(1, 150),
  y = seq(1, 140)
)
d$z <- with(d, x ^ y)

make_plots2 <- function(d, pals) {
  plots <- lapply(pals, function(pal) {
    ggplot(d, aes(x, y, fill = z)) +
      geom_raster(na.rm = TRUE) +
      scale_fill_scico(trans = "log10", palette = pal) +
      scale_x_continuous(expand = c(0, 0)) +
      scale_y_continuous(expand = c(0, 0)) +
      theme_void() +
      labs(title = pal) +
      theme(
       panel.border = element_rect(size = 0.1, fill = NA),
       plot.title = element_text(size = 5, hjust = 0.5),
       legend.position = "none",
       plot.margin = margin(t = 0, b = 0, r = 3, l = 3)
      )
  })
}

pals <- scico::scico_palette_names()
plots <- make_plots2(d, pals)
px <- 1000
# png("bleh.png", width = px, height = px, units = "px")
wrap_plots(plots, ncol = 4) +
  plot_annotation(
    title = "\nscale_fill_scico(palette = pal)",
    theme = theme(
      title = element_text(size = 5, family = "mono")
    )
  )

#' 
#' 
#' # Distiller
#' 
#' [ggplot2] offers the `scale_fill_distiller()` function
#' 
#' [ggplot2]: https://ggplot2.tidyverse.org/reference/scale_brewer.html
#' 
#' 
## ----distiller, warning = FALSE, fig.height = 3.75, fig.width = 1.8, echo = FALSE, dpi = 300----
# n <- 1e3
# d <- expand.grid(
#   x = seq(1, n),
#   y = seq(1, n)
# )
# d$z <- with(d, x ^ y)

d <- expand.grid(
  x = seq(1, 150),
  y = seq(1, 140)
)
d$z <- with(d, x ^ y)

make_plots <- function(d, n = 9) {
  plots <- lapply(1:n, function(i) {
    ggplot(d, aes(x, y, fill = z)) +
      geom_raster(na.rm = TRUE) +
      scale_fill_distiller(trans = "log10", palette = i, na.value = "white") +
      scale_x_continuous(expand = c(0, 0)) +
      scale_y_continuous(expand = c(0, 0)) +
      theme_void() +
      labs(title = i) +
      theme(
       panel.border = element_rect(size = 0.1, fill = NA),
       plot.title = element_text(size = 5, hjust = 0.5),
       legend.position = "none",
       plot.margin = margin(t = 0, b = 0, r = 3, l = 3)
      )
  })
}

plots <- make_plots(d, 18)
px <- 1000
# png("bleh.png", width = px, height = px, units = "px")
wrap_plots(plots, ncol = 3) +
  plot_annotation(
    title = "\nscale_fill_distiller(palette = i)",
    theme = theme(
      title = element_text(size = 5, family = "mono")
    )
  )
# dev.off()

#' 
#' 
#' # Colorspace
#' 
#' The [colorspace] package is filled with fantastic functions for working with
#' color palettes.
#' 
#' [colorspace]: https://cran.r-project.org/web/packages/colorspace/vignettes/colorspace.html
#' 
#' 
## ----colorspace-pals, echo=FALSE-----------------------------------------
pals <- c(
  "Purple-Blue", "Red-Purple", "Red-Blue", "Purple-Orange", "Purple-Yellow",
  "Blue-Yellow", "Green-Yellow", "Red-Yellow", "Heat", "Heat 2", "Terrain",
  "Terrain 2", "Viridis", "Plasma", "Inferno", "Dark Mint", "Mint",
  "BluGrn", "Teal", "TealGrn", "Emrld", "BluYl", "ag_GrnYl", "Peach",
  "PinkYl", "Burg", "BurgYl", "RedOr", "OrYel", "Purp", "PurpOr", "Sunset",
  "Magenta", "SunsetDark", "ag_Sunset", "BrwnYl", "YlOrRd", "YlOrBr", "OrRd",
  "Oranges", "YlGn", "YlGnBu", "Reds", "RdPu", "PuRd", "Purples", "PuBuGn",
  "PuBu", "Greens", "BuGn", "GnBu", "BuPu", "Blues", "Lajolla", "Turku"
)
npals <- length(pals)
# h <- npals / 6.875
w <- 2
h <- ceiling(npals / 4) * 0.5

#' 
#' 
#' 
## ----colorspace1, warning = FALSE, echo = FALSE, dpi = 300, fig.width = w, fig.height = h----
library("colorspace")
# hcl_palettes(plot = TRUE, cex = 1.1)
library("ggplot2")

d <- expand.grid(
  x = seq(1, 150),
  y = seq(1, 140)
)
d$z <- with(d, x ^ y)

make_plots2 <- function(d, pals) {
  plots <- lapply(pals, function(pal) {
    ggplot(d, aes(x, y, fill = z)) +
      geom_raster(na.rm = TRUE) +
      # scale_fill_continuous_sequential(trans = "log10", palette = pal) +
      scale_fill_gradientn(
                           trans = "log10",
        colors = sequential_hcl(palette = pal, n = 100)
      ) +
      scale_x_continuous(expand = c(0, 0)) +
      scale_y_continuous(expand = c(0, 0)) +
      theme_void() +
      labs(title = pal) +
      theme(
       panel.border = element_rect(size = 0.1, fill = NA),
       plot.title = element_text(size = 5, hjust = 0.5),
       legend.position = "none",
       plot.margin = margin(t = 0, b = 0, r = 3, l = 3)
      )
  })
}


plots <- make_plots2(d, pals)
px <- 1000
# png("bleh.png", width = px, height = px, units = "px")
wrap_plots(plots, ncol = 4) +
  plot_annotation(
    title = "\nsequential_hcl(palette = pal)",
    theme = theme(
      title = element_text(size = 5, family = "mono")
    )
  )

#' 
