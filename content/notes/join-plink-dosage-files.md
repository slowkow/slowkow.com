---
date: 2014-10-29
layout: post
title: Join multiple PLINK dosage files into one file
tags: ["Python"]
categories: notes
thumb: /images/noun_join_60036_000000.svg
twitter:
  card: "summary"
---

If you have multiple PLINK [dosage files][1] and would like to merge them into
one file, this script might save you some time.

[1]: http://pngu.mgh.harvard.edu/~purcell/plink/dosage.shtml

<!--more-->

# Dosage files

A dosage file is a space-delimited table with a header. (Below, I increased
spacing between the columns to increase legibility.)

Here's an example:

```
   SNP  A1  A2     F1   I1     F2   I2      F3   I3
rs0001   A   C   0.98 0.02   1.00 0.00    0.00 0.01
rs0002   G   A   0.00 1.00   0.00 0.00    0.99 0.01
```

- SNP is the name of the single nucleotide polymorphism.

- A1 and A2 describe the two alleles for each SNP.

- F1 and I1 correspond to the first individual. F2 and I2 to the second
  individual, and so on. We have three individuals in this example.

- Each genotype is represented by two numbers. For individual 1, the
  probabilities of A/A and A/C are 0.98 and 0.02, respectively.

When dosage file 1 has SNPs that are absent from dosage file 2, we want the
output file to have NA values for those SNPs in the columns corresponding to
dosage file 2.

# Source code

Download [join_dosage_files.py][2]

[2]: https://gist.github.com/slowkow/8f36828cd2f10071288e#file-join_dosage_files-py


