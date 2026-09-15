---
name: Bug report
about: Something in the dashboard shows the wrong thing, or nothing
labels: bug
---

**What you saw**

**What you expected**

**Where**

- Page: Overview / Wallets / Transactions / Agents
- The URL, including any filter or paging parameters

**Was the gateway reachable?**

Check the badge on the Overview page, or `curl <gateway>/health`. A
dashboard showing nothing when the gateway is down is working as
intended — a dashboard showing nothing while the gateway is up is this
bug.

**Numbers involved**

If an amount or a count looks wrong, paste the raw API response next to
what the page displayed:

```sh
curl "$NEXT_PUBLIC_GATEWAY_API_URL/transactions?limit=5"
```

Those responses contain only hashes and amounts — no phone numbers, no
PINs — so they're safe to paste.

**Environment**

- Browser, and whether it reproduces in another
- Deployed or local `npm run dev`
