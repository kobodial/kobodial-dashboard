# Contributing to kobodial-dashboard

This is the operator-facing corner of KoboDial. The people whose money
the system moves never open it — they use a USSD menu on a feature
phone. What lands here is read by agents and operators trying to answer
a practical question quickly: did that transfer go through, is the
gateway up, what happened to this customer.

## Getting set up

```sh
nvm use            # Node 22, per .nvmrc
npm install
cp .env.example .env.local     # point NEXT_PUBLIC_GATEWAY_API_URL at a gateway
npm run dev
```

You need a running [kobodial-gateway](https://github.com/kobodial/kobodial-gateway)
for real data — but not to work on the UI. With the gateway down, every
page renders its "gateway unavailable" state, which is itself worth
looking at while you change it.

## Before you push

```sh
npm run lint        # eslint + prettier --check
npm run typecheck
npm run build
```

CI runs exactly these three. `npm run format` fixes formatting.

## The constraints worth knowing

**This dashboard is read-only over the gateway.** It holds no keys,
signs nothing, and never talks to Soroban directly. A feature that
needs it to move money or authorize anything is a change to the
system's trust model, not a dashboard feature — raise it as an issue
first.

**Don't invent data the gateway doesn't return.** `/wallets` has no
balance field, because balances live on-chain and the gateway
deliberately doesn't cache them. The wallets table shows an em dash and
says why. If you need a value the API doesn't expose, the fix is an
endpoint on the gateway — not a plausible-looking number here.

**Amounts are strings, and must stay strings.** Contract amounts are
i128 and exceed `Number.MAX_SAFE_INTEGER`. `formatAmount` groups digits
without parsing, and the overview totals in `BigInt`. Parsing an amount
into a JS number will silently round real money.

**Phone hashes are digests, not masked numbers.** The gateway never
stores a raw phone number, so there is nothing hidden behind the
truncation — it's for legibility. Don't write copy implying a real
number is being protected; that would misrepresent what the system
does.

**Fetch on the server.** The gateway sends no CORS headers, so browser
fetches to it cross-origin are blocked. `lib/gateway.ts` runs in server
components and route handlers only. A new page that needs gateway data
should be a server component.

**Every data page handles the gateway being down.** Catch
`GatewayUnavailableError` and render `<GatewayUnavailable />`. A blank
screen or an endless spinner is a bug here, not a degraded state.

## Design

It's an operational tool: scannable beats decorative. Tables over
cards for row data, tabular figures in numeric columns so they align,
and status conveyed by wording as well as colour so it survives a bad
monitor. There's no component library — plain Tailwind, and a small set
of components in `components/`.

## Scope

Authentication and agent commission calculations are deliberately out
of scope for the MVP and tracked as issues. The agents list is a
dashboard-side stub because the gateway has no agents endpoint; making
it real means adding one there, not hardening the stub here.

## Commits

Say why in the message. The diff already says what.
