#!/usr/bin/env Rscript --vanilla

library(knitr)

render_jekyll(highlight = "pygments")
opts_knit$set(out.format = 'markdown') 
opts_knit$set(base.url = '{{ site.url }}/{{ site.baseurl }}/')
opts_chunk$set(fig.path = 'public/figures/')

drop_extension <- function(fname) sub('^(.+)\\..*', '\\1', fname)

for (iname in Sys.glob('_rmd/*.R*')) {
	oname <- file.path(
		'_posts', paste(sep = '', basename(drop_extension(iname)), '.md')
	)
    if (!file.exists(oname) || file_test("-nt", iname, oname)) {
        if (grepl("\\.R$", iname)) {
            message('Spinning and knitting ', iname)
            spin(hair = iname, knit = FALSE, format = "Rmd")
            rmd_file <- sprintf("%smd", iname)
            knit(input = rmd_file, output = oname, quiet = TRUE)
            unlink(rmd_file)
        } else {
            message('Knitting ', iname)
            knit(input = iname, output = oname, quiet = TRUE)
        }
    } else {
        message(oname, " is newer than ", iname)
    }
}
