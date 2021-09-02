---
title: "Debug a workflow on the Terra platform"
author: "Kamil Slowikowski"
date: "2021-09-02"
layout: post
tags:
  - Tutorials
categories: notes
thumb: /notes/terra-debug/terra.svg
twitter:
  card: "summary_large_image"
---

Some biomedical researchers might consider using the [Terra][terra] platform
for running data analysis jobs on Google Cloud. But what do we do when
something goes wrong with a workflow? In this tutorial, we will walk through each step of viewing an error, understanding it, and fixing it in an actual workflow. I hope this illustrates the general strategy for how we can solve any workflow issue on Terra.

<!--more-->



# Terra is a user interface for Google Cloud

[Terra][terra] is developed by the [Broad Institute of MIT and Harvard][broad]
in collaboration with [Microsoft] and [Verily].

{{<fig src="Screenshot 2021-08-12 at 3.24.53 PM.jpg" >}}

Basically, we can think of Terra as a user interface that is supposed to make
Google Cloud easier to use.

(In my experience, all Terra users have accounts at the Broad Institute. Since
the institute uses Google to provide services like email, they will provide you
with a Google account that you can use with Google Cloud.)

[broad]: https://www.broadinstitute.org
[terra]: https://terra.bio/
[Microsoft]: https://microsoft.com
[Verily]: https://verily.com


# Workspaces, Workflows, and Jobs

The Terra platform has a few technical terms that we need to learn:

- **Workspace** - A space on Terra that provides access to authorized users,
  and is connected to a single [Google Cloud bucket][bucket].

- **Workflow** - A text file with the `.wdl` extension written in the [Workflow
  Description Language (WDL)](WDL) that specifies how to execute other software
  packages.

- **Job** - An instance of a workflow that was launched on Terra, with a
  dedicated URL for finding the input files, output files, run time status,
  logs, and error messages.

[bucket]: https://cloud.google.com/storage/docs/introduction
[WDL]: https://github.com/openwdl/wdl/blob/main/versions/development/SPEC.md

Please see the [official documentation] for more details.

[official documentation]: https://support.terra.bio/hc/en-us


# Viewing an error in a workflow

Suppose we launched a workflow called `cellranger_workflow` that invokes the
[Cell Ranger] software by 10X Genomics. This is something we might need to do
each time we collect raw sequencing data from a single-cell RNA-seq experiment.

By the way, the `cellranger_workflow` is part of a collection of WDL files called [cumulus].

[cumulus]: https://github.com/klarman-cell-observatory/cumulus

The workflow has a few key steps:

- Convert raw BCL data to FASTQ
- Generate a count matrix with one row for each gene and one column for each cell

[Cell Ranger]: https://support.10xgenomics.com/single-cell-gene-expression/software/pipelines/latest/what-is-cell-ranger

After we launch a workflow, we need to find the job submission and click on it:

{{< fig src="Screenshot 2021-09-02 at 4.07.17 PM.png" >}}

Then, click on the <img style="display:inline;" src="job-manager.png" height="24px"> icon to go to the `Job Manager` for this job:

{{< fig src="Screen Shot 2021-09-02 at 4.07.49 PM.png" >}}

We might have run this workflow successfully many times in the past, but today
we got a new error message that we've never seen before:

{{< fig src="Screenshot 2021-09-02 at 1.49.30 PM.png" >}}

Wait, where's the error?

In Terra, there are three ways to view the error messages:

1. Hover the mouse cursor over the red warning icon <img style="display:inline;" src="warning.png" height="24px"> to reveal a tiny popup window with
   a truncated error message.

2. Click the `ERRORS` tab to view the same truncated error message.

3. Click the green and blue document-with-a-cloud icon <img style="display:inline;" src="document-with-cloud.png" height="24px"> to view a log with
   messages that were printed as the job was running.

Let's go ahead and hover our mouse cursor over that tiny <img style="display:inline;" src="warning.png" height="24px"> icon:

{{< fig src="Screen Shot 2021-09-02 at 10.03.23 AM.png" >}}

Here's the text of the truncated error message:

```text
Failed to evaluate 'if_condition' (reason 1 of 1):
Evaluating (generate_count_config.link_arc_ids[0] != "") failed:
Bad array access generate_count_config.link_arc_ids[0]:
Array size 0 does not have an index value '0'
```

- If your error is present in the green and blue document-with-a-cloud log file <img style="display:inline;" src="document-with-cloud.png" height="24px">,
then you should be able to see the full error message that applies to your
situation.

- But, if your error is only visible by hovering the red warning icon <img style="display:inline;" src="warning.png" height="24px">, then Terra will only show you a truncated version of the error message instead of the full error message. Unfortunately, there is no easy way to get the full error message. If you are willing to use the Google Chrome DevTools, then you can try this [javascript hack] to get the full error, but I hope you won't need it.

[javascript hack]: https://support.terra.bio/hc/en-us/community/posts/4406169552539/comments/4406169841435


# What does the error mean?

If we are familiar with computer programming, then
we might understand that `generate_count_config.link_arc_ids` is an array with zero
elements, so we can't access the 0th element with `[0]`, and we get an error.

But what line of code threw this error? Was it the Cell Ranger code? Or was it the workflow?

As a general rule, this seems to be true:

- Error messages from downstream software executed by the workflow (e.g. Cell Ranger) appear in the document-with-a-cloud log file <img style="display:inline;" src="document-with-cloud.png" height="24px">.

    - For these errors, we should find the source code for the downstream software.

- Error messages from the workflow code appear only on the Terra user interface next to the red icon <img style="display:inline;" src="warning.png" height="24px">, and we will not find these errors in any log files.

    - For workflow errors, we should find the source code for the workflow.


# Download the source code for the workflow

Let's find the source code for the `cellranger_workflow` workflow, and maybe we can figure out what is going on.

In Terra, click `WORKFLOWS` to get to this page and click on the relevant workflow:

{{< fig src="Screenshot 2021-09-02 at 2.20.06 PM.png" >}}

Then click on the `Source:` link:

{{< fig src="Screenshot 2021-09-02 at 2.22.17 PM.png" >}}

We'll be redirected to a site called `portal.firecloud.org` that hosts the source code for the workflow:

{{< fig src="Screenshot 2021-09-02 at 2.20.54 PM.png" >}}

Click `Download WDL` to get the code.


# Modify the workflow code

With the source code in hand, we can find that line 365 threw the error:

{{< highlight groovy "linenos=table,hl_lines=1,linenostart=365" >}}
        if (generate_count_config.link_arc_ids[0] != '') {
            scatter (link_id in generate_count_config.link_arc_ids) {
                call crarc.cellranger_arc_count as cellranger_arc_count {
{{< / highlight >}}

At this point, we should try to study the code for a few minutes to figure out
if we might have provided invalid input for the workflow:

- If we conclude that our input must have been invalid when we launched the workflow, then we should change the input and try again.

- In this case, it seems that our input was fine. The error was caused by
the code in the WDL file, so we should change it.

If we read the [specification for arrays in the WDL language][arrayx], we might
arrive at the idea to change the code to look like this instead:

{{< highlight groovy "linenos=table,hl_lines=1,linenostart=365" >}}
        if (length(generate_count_config.link_arc_ids) > 0) {
            scatter (link_id in generate_count_config.link_arc_ids) {
                call crarc.cellranger_arc_count as cellranger_arc_count {
{{< / highlight >}}

Instead of assuming that the array has elements and testing the first element like `array[0] != ''`, let's use `length()` to check if the length of the array is
greater than zero!

[arrayx]: https://github.com/openwdl/wdl/blob/main/versions/development/SPEC.md#arrayx

Finally, it is worthwhile to double-check if there are any other instances of a similar error in the code that we might be able to fix. It is better to measure twice and cut once, because it is laborious to update the WDL code.

If you followed the link to my [javascript hack], you'll know that the full error
message was hidden by Terra, and we actually had seven instances of the same error:

```text
Failed to evaluate 'if_condition' (reason 1 of 1): Evaluating (generate_count_config.link_arc_ids[0] != "") failed: Bad array access generate_count_config.link_arc_ids[0]: Array size 0 does not have an index value '0'
Failed to evaluate 'if_condition' (reason 1 of 1): Evaluating (generate_count_config.sample_vdj_ids[0] != "") failed: Bad array access generate_count_config.sample_vdj_ids[0]: Array size 0 does not have an index value '0'
Failed to evaluate 'if_condition' (reason 1 of 1): Evaluating (generate_count_config.link_fbc_ids[0] != "") failed: Bad array access generate_count_config.link_fbc_ids[0]: Array size 0 does not have an index value '0'
Failed to evaluate 'if_condition' (reason 1 of 1): Evaluating (generate_count_config.sample_atac_ids[0] != "") failed: Bad array access generate_count_config.sample_atac_ids[0]: Array size 0 does not have an index value '0'
Failed to evaluate 'if_condition' (reason 1 of 1): Evaluating (generate_count_config.sample_feature_ids[0] != "") failed: Bad array access generate_count_config.sample_feature_ids[0]: Array size 0 does not have an index value '0'
Failed to evaluate 'if_condition' (reason 1 of 1): Evaluating (generate_count_config.link_multi_ids[0] != "") failed: Bad array access generate_count_config.link_multi_ids[0]: Array size 0 does not have an index value '0'
```

So, we should go ahead and change all seven of those lines to use `length(array) > 0` instead
of checking `array[0] != ''`. That should do it!


# Upload the new workflow code

We don't have permission to modify the workflow WDL file, because we are not
among the owners listed on the workflow page.

So, let's go ahead and click "Clone..." to make a copy that we can modify:

{{< fig src="Screenshot 2021-09-02 at 2.58.47 PM.png" >}}

Then, follow these steps:

1. Paste the new code into the text box.
2. Change `Namespace` to be your username.
3. Change `Name` to something memorable.
4. Click `Create New Method`.

{{< fig src="Screenshot 2021-09-02 at 3.00.51 PM.png" >}}

Next, click `Export to Workspace...`:

{{< fig src="Screenshot 2021-09-02 at 3.08.35 PM.png" >}}

Next, click `Use Blank Configuration`:

{{< fig src="Screenshot 2021-09-02 at 3.08.55 PM.png" >}}

Next, choose the appropriate workspace where you launch your workflows:

{{< fig src="Screenshot 2021-09-02 at 3.09.08 PM.png" >}}

And finally click `Export to Workspace`:

{{< fig src="Screenshot 2021-09-02 at 3.12.08 PM.png" >}}

Whew! That is a lot of clicking just to update a bit of code.


# Run the new workflow

Our new workflow file should now be available in our Terra workspace. Let's re-launch the same job as before, but this time use the new workflow instead of the old one.

As luck would have it, this fix actually worked. We can see the happy little green checkmarks and no red warning icons:

{{< fig src="Screenshot 2021-09-02 at 3.14.33 PM.png" >}}

Good luck with your workflows!
