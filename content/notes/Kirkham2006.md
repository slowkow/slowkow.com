---
title: "Extract data from a PDF file with Tabula"
author: "Kamil Slowikowski"
date: "2018-12-29"
layout: post
tags: 
  - R
  - Data
  - "Rheumatoid-arthritis"
  - Tutorials
categories: notes
thumb: "/tabula/tabula-thumb.png"
twitter:
  card: "summary_large_image"
---





[Kirkham et al. 2006][1] is a prospective 2-year study of 60 patients with
rheumatoid arthritis (RA). It shows that "synovial membrane cytokine mRNA
expression is predictive of joint damage progression in RA". The PDF includes a
few tables with data on cytokine measurements and correlations with joint
damage. Here, we'll use [Tabula] to extract data from tables in the PDF file.
Then we'll make figures with R.

[1]: https://www.ncbi.nlm.nih.gov/pubmed/16572447
[Tabula]: https://tabula.technology/

<!--more-->

# :racehorse: Tabula in action

<img src="/tabula/tabula-in-action.gif">

# Download Tabula

Go to <a rel="noopener" target="_blank" href="https://tabula.technology">tabula.technology</a> and download the
version for your operating system.

<img src="/tabula/tabula-logo.png">

# Mark each table with your mouse

When you launch Tabula, you will see a new web site hosted at `127.0.0.1:8080`.
Open a PDF file to get started. With your mouse, click and drag to make a
selection over each table in the PDF file. Don't include extra things like
headers or notes below the table, because they usually won't be recognized
correctly.

<img src="/tabula/tabula-select-table.png">

# Export the data as a CSV or script

You can export the data as a comma-separated-values (CSV) file,
tab-separated-values (TSV) file, JSON, a zip file with multiple CSV files, or
even as a shell script you can run from the command line.

<img src="/tabula/tabula-export-options.png">

For example, here is the shell script that I got by selecting `Script` as the
export format:

```bash
java -jar tabula-java.jar  -a 118.958,100.598,327.803,510.638 -p 4 "$1" 
```

With this script, we don't need to launch the Tabula app. We can run the jar
file from the command line, giving the coordinates of the table with `-a` and
the page number with `-p`. The `"$1"` argument represents the name of the PDF
file.

See [tabula-java](https://github.com/tabulapdf/tabula-java) for more details
about the Java command line application.

# :floppy_disk: Download the data and code

We can use [RStudio] to clean up the exported data with Find and Replace. Then,
we can use R and [ggplot2] to visualize the data.

[RStudio]: https://www.rstudio.com/
[ggplot2]: https://ggplot2.tidyverse.org/

Download the code for the figures here:

- <a rel="noopener" target="_blank" href="/notes/Kirkham2006.R" download>Kirkham2006.R</a>

Here is the data, cleaned up and ready for making figures:

<ul>
<li><a rel="noopener" target="_blank" href="/notes/data/Kirkham2006-Table1.tsv" download>Kirkham2006-Table1.tsv</a></li>
<li><a rel="noopener" target="_blank" href="/notes/data/Kirkham2006-Table2.tsv" download>Kirkham2006-Table2.tsv</a></li>
<li><a rel="noopener" target="_blank" href="/notes/data/Kirkham2006-Table3.tsv" download>Kirkham2006-Table3.tsv</a></li>
</ul>

Below, you can see the figures I created for Tables 1, 2, and 3.

# Figures

## Figure for Table 1


![plot of chunk table1](/notes/Kirkham2006_files/figure-html/table1-1.png)


## Figure for Table 2


![plot of chunk table2](/notes/Kirkham2006_files/figure-html/table2-1.png)


## Figure for Table 3


![plot of chunk table3](/notes/Kirkham2006_files/figure-html/table3-1.png)


