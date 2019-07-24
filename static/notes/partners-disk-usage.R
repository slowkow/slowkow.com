#!/usr/bin/env Rscript
# partners-disk-usage.R
#
# Kamil Slowikowski
# 2019-07-23
#
# Read text files that contain output from the `duc` program about
# directory sizes.
#
# Create two plots:
# - Show how the size of the entire directory has changed over time
# - Show how the size of each subdirectory has changed over time

library(ggplot2)
library(ggrepel)
library(lubridate)
library(dplyr)
library(magrittr)
library(stringr)
library(readr)
library(cowplot)
library(pals)
library(patchwork)

files <- Sys.glob("~/Downloads/partners-disk-usage/*.txt")

parse_si <- function(xs) {
  xs <- str_replace(xs, "T$", "e12")
  xs <- str_replace(xs, "G$", "e09")
  xs <- str_replace(xs, "M$", "e06")
  xs <- str_replace(xs, "K$", "e03")
  parse_number(xs)
}

d <- do.call(rbind, lapply(files, function(file) {
  x <- readLines(file, n = 5)
  x <- str_split_fixed(x, "\\s+", 2)
  x[,2]
}))
colnames(d) <- c("date", "time", "files", "dirs", "size")
d <- as.data.frame(d, stringsAsFactors = FALSE)
d %<>% mutate(
  date = parse_date(date),
  files = parse_si(files),
  dirs = parse_si(dirs),
  size = parse_si(size)
)

ggplot(d, aes(files / 1e6, size / 1e12)) +
  geom_path() +
  geom_point() +
  labs(x = "Files (M)", y = "Terabytes") +
  theme_cowplot(font_size = 20)

lm_eqn <- function(df) {
  m <- lm(df[,2] ~ df[,1])
  eq <- substitute(italic(y) == a + b %.% italic(x)*","~~italic(r)^2~"="~r2,
                   list(a = format(unname(coef(m)[1]), digits = 2),
                        b = format(unname(coef(m)[2]), digits = 2),
                        r2 = format(summary(m)$r.squared, digits = 3)))
  as.character(as.expression(eq));
}

ggplot(d, aes(date, size / 1e12)) +
  stat_smooth(method = "lm") +
  geom_path() +
  geom_point() +
  labs(
    title = "Disk usage over time (+170 MB per day)",
    subtitle = "/data/srlab",
    x = "Date", y = "Terabytes"
  ) +
  theme_cowplot(
    font_size = 20
  ) +
  # geom_text(
  #   x = Inf, y = -Inf, label = lm_eqn(d[,c("date", "size")]),
  #   parse = TRUE, size = 5,
  #   vjust = -1.5, hjust = 1
  # ) +
  geom_text_repel(
    data = subset(d, size == max(size)),
    mapping = aes(label = sprintf("%s TB  ", size / 1e12)),
    nudge_x = -10,
    size = 5
  ) +
  theme(plot.margin = unit(c(1,2,1,1) / 2, "cm"))

ggsave("partners-disk-usage.png", width = 7, height = 5, dpi = 300)

# -----

d <- do.call(rbind, lapply(files, function(file) {
  x <- suppressWarnings(readLines(file))
  x <- x[8:length(x)]
  x <- str_replace(x, "^\\s+", "")
  x <- str_split_fixed(x, "\\s+", 2)
  x <- as.data.frame(x, stringsAsFactors = FALSE)
  x$date <- str_replace(basename(file), ".txt", "")
  x
}))
colnames(d) <- c("size", "dir", "date")
d <- as.data.frame(d, stringsAsFactors = FALSE)
d %<>% mutate(
  date = parse_date(date),
  size = parse_si(size)
)

d_text <- d %>%
  group_by(dir) %>%
  top_n(n = 1, wt = date) %>%
  filter(size > 1e12)

d %<>% filter(dir %in% d_text$dir)

set.seed(42)
d_text$dir2 <- sapply(seq(nrow(d_text)), function(i) {
    paste(
      sample(x = letters, size = ceiling(runif(1) * 3 + 2)),
      collapse = ""
    )
})
dir_mask <- unlist(with(d_text, split(dir2, dir)))
d$dir <- dir_mask[d$dir]
d_text$dir <- dir_mask[d_text$dir]

p1 <- ggplot() +
  geom_line(
    data = d, aes(x = date, y = size, group = dir, color = dir),
    size = 1.25
  ) +
  # geom_text_repel(
  #   data = d_text,# %>% filter(size > 2e12),
  #   mapping = aes(date, size, label = dir),
  #   direction = "y", nudge_x = 5, segment.size = 0.2,
  #   hjust = 0
  # ) +
  # scale_x_date(limits = c(min(d$date), max(d$date) + 40)) +
  scale_y_continuous(labels = function(x) x / 1e12) +
  labs(
    title = "Disk usage over time",
    subtitle = "/data/srlab/",
    x = "Date", y = "Terabytes"
  ) +
  theme_cowplot(
    font_size = 20
  ) +
  scale_color_manual(
    values = pals::cols25(n = length(unique(d$dir))),
    guide = FALSE
  )

p2 <- ggplot() +
  geom_col(data = d_text, mapping = aes(reorder(dir, size), size, fill = dir)) +
  coord_flip() +
  scale_fill_manual(
    values = pals::cols25(n = nrow(d_text)),
    guide = FALSE
  ) +
  geom_text(
    data = d_text, mapping = aes(dir, size, label = sprintf("%s TB", size / 1e12)),
    hjust = -0.1, size = 5
  ) +
  scale_y_continuous(expand = c(0, 0), limits = c(0, max(d_text$size) * 1.3)) +
  theme_cowplot(font_size = 20) +
  labs(x = NULL, y = NULL) +
  theme(
    axis.text.x = element_blank(),
    axis.ticks = element_blank(),
    axis.line = element_blank()
  )

p1 + p2 + plot_layout(widths = c(2, 1))

ggsave("anon-partners-disk-usage-per-directory.png", width = 13, height = 7, dpi = 300)
