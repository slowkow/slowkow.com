---
title: "Find the most abundant barcodes in FASTQ files"
author: "Kamil Slowikowski"
date: "2021-04-22"
layout: post
tags:
  - Tutorials
categories: notes
thumb: /notes/barcodes/noun_Barcode_4039561.png
twitter:
  card: "summary_large_image"
---

Single-cell RNA-seq data contains oligonucleotide [barcodes] to uniquely
identify each multiplexed sample, each single cell, and each individual
molecule. Can we check which barcodes are present in a given FASTQ file? Maybe
we can guess which 10x sample index was used during library preparation?

[unused]: https://www.10xgenomics.com/blog/sequence-with-confidence-understand-index-hopping-and-how-to-resolve-it

[barcodes]: https://assets.ctfassets.net/an68im79xiti/7lhDuXSbro9ux7Dl9k7uTd/fb7526242c33ac2972a3a29d1d163f30/CG000325_TechNote_ChromiumNextGEMSingle_Cell_3___v3.1_Dual_Index_Rev_A.pdf

<!--more-->

# An example cellranger output folder

Suppose we ran [`cellranger mkfastq`][cellranger] to generate an output folder like this:

[cellranger]: https://support.10xgenomics.com/single-cell-gene-expression/software/pipelines/latest/what-is-cell-ranger

```bash
$ ls mydata/data_output/210804_SL-NVF_0123_AHF5K3DSXY_fastqs/fastq_path

HF5K3DSXY/
Reports/
Stats/
Undetermined_S0_L001_I1_001.fastq.gz
Undetermined_S0_L001_R1_001.fastq.gz
Undetermined_S0_L001_R2_001.fastq.gz
Undetermined_S0_L002_I1_001.fastq.gz
Undetermined_S0_L002_R1_001.fastq.gz
Undetermined_S0_L002_R2_001.fastq.gz
Undetermined_S0_L003_I1_001.fastq.gz
Undetermined_S0_L003_R1_001.fastq.gz
Undetermined_S0_L003_R2_001.fastq.gz
Undetermined_S0_L004_I1_001.fastq.gz
Undetermined_S0_L004_R1_001.fastq.gz
Undetermined_S0_L004_R2_001.fastq.gz
```

Inside `HF5K3DSXY/` we will find one folder for each sample of demultiplexed data:

```bash
$ ls HF5K3DSXY

batch1
batch2
batch3
batch4
```

Inside `HF5K3DSXY/batch1` we will find the FASTQ files for that sample:

```bash
$ ls HF5K3DSXY/batch1

batch1_S1_L001_I1_001.fastq.gz
batch1_S1_L001_R1_001.fastq.gz
batch1_S1_L001_R2_001.fastq.gz
batch1_S1_L002_I1_001.fastq.gz
batch1_S1_L002_R1_001.fastq.gz
batch1_S1_L002_R2_001.fastq.gz
batch1_S1_L003_I1_001.fastq.gz
batch1_S1_L003_R1_001.fastq.gz
batch1_S1_L003_R2_001.fastq.gz
batch1_S1_L004_I1_001.fastq.gz
batch1_S1_L004_R1_001.fastq.gz
batch1_S1_L004_R2_001.fastq.gz
```

If we suspect that these FASTQ files are a bit smaller than they should be,
then we may want to consider the possibility that we ran `cellranger` with the
wrong sample index barcodes.

If we ran `cellranger` with a sample sheet that contained the wrong barcodes,
then the reads that did not match the barcodes will have been saved into the
`Undetermined_*.fastq.gz` files.

Let's have a look at one of them:

```bash
$ gzip -cd Undetermined_S0_L001_I1_001.fastq.gz | head

@A00442:381:HF5K3DSXY:1:1101:2239:1016 1:N:0:NGGGGGGG
NGGGGGGG
+
#FFF:F:F
@A00442:381:HF5K3DSXY:1:1101:2709:1016 1:N:0:NGGGGGGG
NGGGGGGG
+
#FFFFFFF
@A00442:381:HF5K3DSXY:1:1101:3902:1016 1:N:0:NTAAGGTA
NTAAGGTA
```

The last colon-delimited entry in each line has the sample barcode (e.g.,
`NGGGGGGG`, `NTAAGGTA`).

To learn more about the FASTQ file formats, read the [bcl2fastq
documention][bcl2fastq].

[bcl2fastq]: https://support.illumina.com/content/dam/illumina-support/documents/documentation/software_documentation/bcl2fastq/bcl2fastq2-v2-20-software-guide-15051736-03.pdf

# Count sample barcodes in a FASTQ file

Here's one way to count the abundance of each barcode and list the top 10 most
abundant barcodes:


<div class="highlight"><pre style="background-color:#f0f0f0;-moz-tab-size:4;-o-tab-size:4;tab-size:4"><code class="language-bash" data-lang="bash">$ gzip -cd Undetermined_S0_L001_I1_001.fastq.gz <span style="color:#4070a0;font-weight:bold">\
</span><span style="color:#4070a0;font-weight:bold"></span> | grep <span style="color:#4070a0">'^@'</span> | cut -d: -f10 | sort | uniq -c | sort -k1rn | head -n10
<span></span>
<span style="color:#40a070">35643135</span> <span style="background-color:#E69F0080">GCGTACAC</span>
<span style="color:#40a070">31411951</span> <span style="background-color:#56B4E980">ATTGCGTG</span>
<span style="color:#40a070">26271617</span> <span style="background-color:#009E7380">CGACTTGA</span>
<span style="color:#40a070">22104605</span> <span style="background-color:#F0E44280">TACAGACT</span>
<span style="color:#40a070">6264332</span> AGGATCGA
<span style="color:#40a070">5934908</span> CACGATTC
<span style="color:#40a070">5873602</span> TCTCGACT
<span style="color:#40a070">5714926</span> GTATCGAG
<span style="color:#40a070">1774897</span> GGGGGGGG
<span style="color:#40a070">184548</span> TGCGAACT
</code></pre></div>

Each of the top 4 barcodes have 22-35M reads, and the 5th one has just 6M reads.

If we look for the top 4 barcodes in the [index files from 10x Genomics][2],
here's what we find:

[2]: https://support.10xgenomics.com/single-cell-vdj/sequencing/doc/specifications-sample-index-sets-for-single-cell-immune-profiling


<div class="highlight"><pre tabindex="0" style="background-color:#f0f0f0;-moz-tab-size:4;-o-tab-size:4;tab-size:4"><code class="language-bash" data-lang="bash"><span style="color:#60a0b0;font-style:italic"># Single_Index_Kit_T_Set_A.csv</span>
SI-GA-C5,<span style="background-color:#009E7380">CGACTTGA</span>,<span style="background-color:#F0E44280">TACAGACT</span>,<span style="background-color:#56B4E980">ATTGCGTG</span>,<span style="background-color:#E69F0080">GCGTACAC</span>
</code></pre></div>

# Conclusions

- Since all four of the most abundant barcodes from the FASTQ file match with
  the `SI-GA-C5` sequences, we might conclude that `SI-GA-C5` is the correct
  barcode to use for this data.

- Since we have a large number (22-35M) of reads in the
  `Undetermined_*.fastq.gz` files, it is likely that our sample sheet was wrong
  when we ran `cellranger mkfastq`. We should re-run with a corrected sample
  sheet.

