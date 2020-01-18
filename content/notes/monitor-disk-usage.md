---
layout: post
date: 2019-07-18
title: Monitor disk usage on your server
tags: 
  - Bash
categories: notes
thumb: "/images/partners-disk-usage-card.png"
twitter:
  card: "summary_large_image"
---

You might consider monitoring your disk usage, because this might reveal trends
that help you to plan for the future. Here, we'll use a cron job to
periodically scan a directory with the [duc] program by [Ico Doornekamp].

[duc]: https://github.com/zevv/duc
[Ico Doornekamp]: https://github.com/zevv

<!--more-->

# Repeating jobs each month

Let's create two jobs that will run periodically:

1. Create an index of a folder.

2. Scan the index and email a text report.

We can create new [cron] jobs by running:

[cron]: https://en.wikipedia.org/wiki/Cron

```bash
crontab -e
```

A text editor should open. Paste the following text into the editor. Make sure
you change the paths to match your filesystem. Notice that we write the full
path to the `duc` executable file and the full path to the
`email-disk-usage.sh` script.


```bash
# +---------------- minute (0 - 59)
# |  +------------- hour (0 - 23)
# |  |  +---------- day of month (1 - 31)
# |  |  |  +------- month (1 - 12)
# |  |  |  |  +---- day of week (0 - 6) (Sunday=0 or 7)
# |  |  |  |  |
# *  *  *  *  *  command to be executed
#
# At 2am every day, re-index disk usage of /data/srlab with duc
0 2 * * * /PHShome/USERNAME/.local/bin/duc index /data/srlab 2>/dev/null
#
# 26th of each month send a report
5 8 26 * * /PHShome/USERNAME/email-disk-usage.sh 2>/dev/null
```

# Email reports

Here is the bash script that we will call on the 26th of each month to email a
report to multiple recipients:

```bash
#!/usr/bin/env bash
# email-disk-usage.sh

# Recipients of the email.
rec="admin@institute.edu,lab.member@institute.edu"

# Full path to the duc executable.
duc="$HOME/.local/bin/duc"

# The directory of interest.
dir="/data/srlab"
mkdir -p "${dir}/disk-usage"

# The date for today.
day=$($duc info | grep "$dir" | cut -f1 -d' ')

# Size of each subdirectory.
info=$(
  paste <(
    $duc info | head -n1 | tr ' ' '\n' | grep '\w'
  ) <(
    $duc info | tail -n+2 | head -n1 | tr ' ' '\n' | grep '\w'
  )
)

# Build a complete message.
message=$(
  echo "$info" && echo && $duc ls "$dir"
)

# Write the message to a text file on disk.
echo "$message" > "${dir}/disk-usage/${day}.txt"

# Send the message in an email.
echo "$message" | mail -s "Partners disk usage: '$dir' $day" "$rec"
```

The body of the email looks like this:

```
Date    2018-12-26
Time    02:00:01
Files   10.3M
Dirs    1.1M
Size    118.7T
Path    /data/srlab

 16.4T abcdefg
 14.8T abcdef
 14.3T ghijkl
 13.7T abcdefghijklm
 12.3T nopqr
 11.9T abcde
  7.6T fghijklm
  4.2T abcd
```

# In practice 

I actually used this script to email myself and monitor the disk usage in
[Soumya Raychaudhuri's](https://immunogenomics.hms.harvard.edu/) lab at
Harvard. After we let the job repeat for a few months, we can see how quickly
the disk usage is increasing over time:

<img alt="Disk usage on a Partners server" src="/images/partners-disk-usage.png">

We can also see how each subdirectory has changed over time. Below, you might
notice that the green `qox` subdirectory has grown from 1 TB to over 20 TB in
less than a year.

A few subdirectories like `demyt` or `xrcwq` have not changed over the entire
time course.

<img alt="Disk usage on a Partners server" src="/images/anon-partners-disk-usage-per-directory.png">

The real names of the subdirectories are masked for privacy.

# Code

Here is the R script for reading the text files and creating the plots in this
note:

- <a href="/notes/partners-disk-usage.R" download="partners-disk-usage.R">partners-disk-usage.R</a>

