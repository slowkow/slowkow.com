---
title: "Reduce packet loss on a cable internet connection by increasing power"
author: "Kamil Slowikowski"
date: "2023-01-04"
layout: post
tags:
  - Resources
categories: notes
thumb: /notes/packetloss/thumb.png
twitter:
  card: "summary_large_image"
---

An internet connection with high packet loss is frustating to use. When packets
of data are lost, phone calls over wifi can be randomly punctuated with
silence. Zoom meetings might get frozen and unfrozen at unpredictable times.
Using the internet is unpleasant when the connection is unstable. Here, I will
show that one reason for high packet loss can be low power in the coaxial cable
that connects to the modem.

<!--more-->

# Using ping to detect the problem

I knew there was something wrong with my connection, because people would
comment on the poor connection quality during phone calls and zoom calls.

One of the first things I tried was to run a `ping` command to see if anything
obvious shows up there:

```bash
ping google.com
```

Here are the results after letting it run for 542 seconds:

```bash
--- google.com ping statistics ---
542 packets transmitted, 454 packets received, 16.2% packet loss
round-trip min/avg/max/stddev = 13.687/21.193/279.238/14.176 ms
```

16% packet loss is unacceptably high. That's almost 1/5 packets lost in
transmission! No wonder my connection is bad.

Next, I wanted to check if the packet loss might be happening between my
computer and the wifi router. So I ran `ping` again, this time against the IP
address of my router:

```bash
ping 192.168.1.1
```

```bash
--- 192.168.1.1 ping statistics ---
6262 packets transmitted, 6262 packets received, 0.0% packet loss
round-trip min/avg/max/stddev = 1.349/7.217/488.332/12.410 ms
```

The connection to my router is perfectly stable. So, the problem must be
elswhere.

# High packet loss

<div class="mw10 center">
<img class="figure" src="/notes/packetloss/packetloss-before-after.png" data-zoomable>
</div>

The left panel shows my internet connection when it was unstable. Notice that
17.6% of packets were lost. The spiky yellow peaks indicate that there were 6
moments of poor connectivity during a 90 second testing window. The average
latency is 1.7 seconds! This connection is not suitable for making phone calls,
participating in Zoom meetings, and working on remote servers.

The right panel shows the connection after increasing power on the cable.  The
packet loss dropped all the way down to 0%. There are no yellow peaks at all
during the 90 second testing window. The latency is stable around 30 ms. This
is a great connection, suitable for any typical internet activities.

Thanks to [Matthew Miner](https://matthewminer.name/) for creating a free and
simple website where you can test the packet loss on your own internet
connection:

- <https://packetlosstest.com>

# Modem statistics

Many homes have an internet connection provided by a coaxial cable that
connects to the modem:

```bash
Internet Provider  -- coaxial cable  --  Modem

            Modem  -- ethernet cable --  Router
            
            Router --      wifi      --  Computers, Phones, Tablets
```

The modem connects to the router with an ethernet cable. The router provides
wifi for devices like computers, phones, and tablets.

We can check the modem configuration and statistics at <http://192.168.100.1>

That's where I found error messages like this:

```txt
(Notice (6))	DS profile assignment change. DS Chan ID: 32; Previous Profile: ; New Profile: 1 2 3.;CM-MAC=c1:1e:11:ea:1a:b1;CMTS-MAC=00:01:1c:84:b1:1d;CM-QOS=1.1;CM-VER=3.1;
(Notice (6))	TLV-11 - unrecognized OID;CM-MAC=c1:1e:11:ea:1a:b1;CMTS-MAC=00:01:1c:84:b1:1d;CM-QOS=1.1;CM-VER=3.1;
(Notice (6))	Honoring MDD; IP provisioning mode = IPv6
(Critical (3))	No Ranging Response received - T3 time-out;CM-MAC=c1:1e:11:ea:1a:b1;CMTS-MAC=00:01:1c:84:b1:1d;CM-QOS=1.1;CM-VER=3.1;
(Warning (5))	ToD request sent - No Response received;CM-MAC=c1:1e:11:ea:1a:b1;CMTS-MAC=00:01:1c:84:b1:1d;CM-QOS=1.1;CM-VER=3.1;
(Critical (3))	Received Response to Broadcast Maintenance Request, But no Unicast Maintenance opportunities received - T4 time out;CM-MAC=c1:1e:11:ea:1a:b1;CMTS-MAC=00:01:1c:84:b1:1d;CM-QOS=1.1;CM-VER=3.1;
```

The **T3 time-out** error messages seemed important and searchable.

So I searched the web for "packet loss T3" and found some [forum posts by
SammyFL on forums.xfinity.com][1].

[1]: https://forums.xfinity.com/conversations/your-home-network/cm2050v-t3-errors-uncorrectables-and-disconnects/621925577028b7514c88dae2?page=3

SammyFL shared a lot of modem statistics about *Downstream Bonded Channels*.
The posts helped me to infer that *Correctables* and *Uncorrectables* are
counting the number of errors, so both values should be 0 in an ideal world.

I looked at my modem statistics, and my numbers were different:

<div class="mw10 center">
<img class="figure" src="/notes/packetloss/low-power.png" data-zoomable>
</div>

It seems that **Power** is the most important column here. And my power is too
low at 0.2 dBmV compared to the 5 or 10 dBmV that SammyFL reported as working
well in the forum posts.

But how can we increase the power?

SammyFL also shared this:

> "So after a few days now, since replacing the Comcast installed CommScope 2
> Way splitter from 5-6 years ago with a brand new splitter (Extreme Broadband)
> I haven't had any Uncorrectables or T3 Errors . I check it w few times a
> day/night."

Sure enough, I found a CommScope splitter in my house:

<div class="mw10 center">
<img class="figure" src="/notes/packetloss/splitter.jpg" data-zoomable>
</div>

Then I slowly thought about a few possible solutions:

- My first idea was to buy a new splitter. Maybe this one is old and needs to be replaced?

- We don't actually use the splitter. Could we bypass it with a simple cable connector?

- *What is that special -6 dB connector for?*

I'm glad I took a picture of the splitter, because I could stare at it for a
while and think.


# Low power leads to high packet loss

Thanks to [pickmymodem.com][2] for sharing a helpful page on signal issues.
That's where I started to understand that the power should probably range
from -7 to +7 dBmV.

[2]: https://pickmymodem.com/how-to-fix-your-docsis-3-0-3-1-signal-issues/

My power was hovering at 0.2 dBmV. How can we move power in the positive
or negative direction away from 0?

Could the special -6 dB connector be the solution?

The cable that connects to my modem was connected to the **Out 1** port. So, I
disconnected the cable and reconnected it to the port labeled **-6dB VoIP**.
Did that have any effect on the power?

<div class="mw10 center">
<img class="figure" src="/notes/packetloss/high-power.png" data-zoomable>
</div>

Yes! The new connection has -3.3 dBmV, better than 0.2 dBmV.

Finally, I tested the packet loss on the new connection, and it worked! My
internet connection is stable now with nearly 0% packet loss.

<div class="mw10 center">
<img class="figure" src="/notes/packetloss/before-after.png" data-zoomable>
</div>

If I wanted to use the other connections coming from the splitter, then I would
need to find another way to amplify the signal. But this is good enough for me
right now.

Good luck with your internet connection!

