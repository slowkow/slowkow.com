#!/usr/bin/env Rscript
iname <- "index.Rmd"
oname <- "index.html"
if (
  !file.exists(oname) ||
  file_test("-nt", iname, oname)
) {
  rmarkdown::render(iname, 'xaringan::moon_reader')
}
out_dir <- "../../ggrepel"
dir.create(file.path(out_dir, "libs"), recursive = TRUE)
file_list <- c(
  "index.html",
  "theme.css",
  "index_files"
)
file.copy(
  from = file_list,
  to = out_dir,
  recursive = TRUE
)
file.copy(
  from = "libs/remark-latest.min.js",
  to = file.path(out_dir, "libs/")
)
