---
name: Feature request
about: Suggest something for the dashboard
labels: enhancement
---

**The question an operator is trying to answer**

Start from the person at the desk: what they need to know, and what
they currently have to do instead — count rows by hand, re-run a curl,
ask someone.

**What you'd want on screen**

A rough sketch of the table, column or indicator beats a description of
the feature.

**Does the gateway already expose the data?**

The dashboard is a read-only view over kobodial-gateway's API, and
can't show what that API doesn't return. If the data isn't there yet,
this is really two pieces of work — an endpoint on the gateway, then a
view here — and it's worth saying so.

**Scope note**

Authentication and agent commission calculations are deliberately out
of MVP scope. Anything that would have the dashboard hold keys or
authorize a transaction is a trust-model change, not a dashboard
feature.
