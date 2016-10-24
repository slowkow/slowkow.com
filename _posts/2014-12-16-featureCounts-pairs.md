---
layout: post
title: featureCounts requires identical mate ids
tags: Bash
categories: notes
---

[featureCounts], a read-counting program, requires identical mate ids to
identify a pair of read mates as correctly paired. However, FASTQ files
generated from an SRA file with [fastq-dump] have different mate ids for each
mate in a pair. The forward and reverse mate ids end with `.1` and `.2`,
respectively. I wrote a bash function to fix BAM files with this problem.

[featureCounts]: http://bioinf.wehi.edu.au/featureCounts/
[fastq-dump]: http://www.ncbi.nlm.nih.gov/Traces/sra/sra.cgi?view=toolkit_doc&f=fastq-dump

# Problem

When you use the `fastq-dump` program to create FASTQ files from an SRA file:

```bash
fastq-dump -I --gzip --split-files file.sra > fastq-dump.log
```

The read identifiers have suffixes `.1` and `.2` for the forward and reverse
strand reads, respectively. This BAM file has read identifiers with suffixes:

```bash
$ samtools view aligned.bam | head -n4 | cut -f1

SRR1032976.1.1
SRR1032976.1.2
SRR1032976.2.1
SRR1032976.2.2
```

`featureCounts` identifies paired mates when two reads have identical read
identifiers. The suffixes make the identifiers unique, so `featureCounts`
treats them as two separate fragments instead of one fragment.

It matters for the purpose of computing expression values, since a single
fragment will sometimes be double-counted and sometimes not. If a gene has one
read pair and one singleton, its count will be 3 instead of the correct 2 due
to this suffix bug.

# Solution

I wrote a bash function to fix the problem:

```bash
fix_mate_ids() {
  local original="$1"
  local fixed="${original}.fixed.bam"
  (
    samtools view -H "$original";
    samtools view "$original" \
      | awk 'BEGIN { FS=OFS="\t" } { sub(/[12]$/, "", $1) } 1'
  ) \
    | samtools view -Shb -@4 - > "$fixed" \
    && mv -f "$fixed" "$original"
}
```

Use it like this:


```bash
$ fix_mate_ids aligned.bam

[samopen] SAM header is present: 25 sequences.
```

Now the BAM is fixed:

```bash
$ samtools view aligned.bam | head -n4 | cut -f1

SRR1032976.1.
SRR1032976.1.
SRR1032976.2.
SRR1032976.2.
```

Notice that the read identifier changed from `SRR1032976.1.1` to
`SRR1032976.1.` without the trailing `1` at the end. Now, the mates have
identical ids, so `featureCounts` will count them as one fragment instead of
two.
