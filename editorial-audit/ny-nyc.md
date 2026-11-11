# Editorial audit: New York State and NYC entries (27)

Proposal only. No entry or official file has been edited. This audit checks every `state/ny-*` and `local/nyc-*` entry against `docs/content-guide.md` as updated 2026-11-11: the worker point of view, the net-impact test, and the new credit order (the people who did the work first, executives first only when they proposed, negotiated, or issued it, `signed` last).

**Scope note:** the brief said 25 entries. The directories hold 27 (12 `ny-`, 15 `nyc-`). All 27 are covered.

**Method and limits:**
- Mayoral action on every NYC local law below was checked against the certification page of the law text (intro.nyc copies of the official Local Laws).
- Governor-proposal claims for the FY2026 budget were checked against the State Comptroller's report on the Executive Budget.
- For the four older NY laws (2016, 2019, 2023 ×2), sponsor histories were checked by a research pass against nysenate.gov and nyassembly.gov bill pages and contemporaneous reporting.
- Partway through, the session's shared web-search quota ran out. After that I could only open known URLs (StreetEasy and Gothamist block automated access, and budget.ny.gov did not respond). Points I couldn't settle are marked **could not confirm** or **could not establish**.

## Summary

| slug | net impact | credit change | body change | confidence |
|---|---|---|---|---|
| ny-2016-paid-family-leave | keep | replace (add sponsors; Cuomo → `proposed`; drop Flanagan) | y | high (med on Flanagan) |
| ny-2019-tenant-protection-act | keep | reorder + add people | y | high |
| ny-2023-clean-slate-act | keep | reorder (Hochul → `negotiated`, last) | y (minor) | high |
| ny-2023-medical-debt-credit-reports | keep | reorder | n | high |
| ny-2023-minimum-wage | keep | add people (only credit is the signer) | y | high |
| ny-2024-good-cause-eviction | keep | reorder + add people | y | high |
| ny-2024-paid-prenatal-leave | keep | role change (Hochul `signed` → `proposed`) | y (minor) | high |
| ny-2025-empire-state-child-credit | keep + say what it cost | role change (Hochul → `proposed`) | y | high |
| ny-2025-inflation-refund-checks | keep + say what it cost (flag: thin, broadly targeted) | replace (Hochul `proposed`; drop leaders) | y | med-high |
| ny-2025-school-phone-ban | owner's call (possible filler) | role change (Hochul → `proposed`) | y (minor) | med |
| ny-2025-universal-school-meals | keep | reorder (Hochul → `proposed`, last) | y | high |
| ny-2026-universal-pre-k | owner's call (lean keep + say what it cost) | role change (Hochul → `proposed`) | y | med |
| nyc-2k-free-child-care | keep + say what it cost | none (optional role tweak) | y (minor) | med-high |
| nyc-child-care-copays-eliminated | keep | none | n | high |
| nyc-click-to-cancel | keep | none | n | high |
| nyc-curbside-composting | keep | add people | y | med-high |
| nyc-debt-demolisher-fine-amnesty | owner's call (lean retract) | reorder | y | med |
| nyc-dekalb-lafayette-b38-bus-lanes | keep (flag: not built yet) | none | n | med |
| nyc-delivery-worker-minimum-pay | keep | reorder + add people | y | high |
| nyc-fair-fares-200-percent | keep | reorder | y | high |
| nyc-fare-act-broker-fees | keep | none | n (optional sentence) | med |
| nyc-health-bucks-snap-produce-match-increase | keep (flag: small) | none (optional reorder) | n | med |
| nyc-kids-rise-1000-college-savings | keep | none (role tweak to `proposed`) | n (optional cost line) | high |
| nyc-paid-sick-leave | keep | reorder + add people | y | high |
| nyc-pre-k-for-all | keep + say what it cost | role change (`led` → `proposed`) | y (minor) | med |
| nyc-rent-freeze-2026 | keep | none | n | med-high |
| nyc-right-to-counsel | keep | reorder + add people | y | high |

---

## New York State

### ny-2016-paid-family-leave

1. **Net impact: keep.** Workers fund it through a payroll deduction, and the body already says so. This is social insurance with job protection, and nothing was cut to pay for it.
2. **Credit.**
   - Current: `andrew-cuomo` signed (first); `john-flanagan` negotiated ("his Senate passed the budget bill 61–1").
   - Proposed:
     1. `catherine-nolan` sponsored ("Assembly sponsor of the stand-alone paid family leave bill, A.6289/A.1793/A.3870, 2011–2016; the Assembly passed it repeatedly")
     2. `joseph-addabbo` sponsored ("Prime Senate sponsor for four years, S.4742/S.3004")
     3. `andrew-cuomo` proposed ("Proposed a 12-week plan in his 2016 State of the State and budget and made it a priority")
     4. `jeff-klein` championed, optional ("Independent Democratic Conference leader; pushed paid leave into the Senate majority's budget plan")
   - Missing: Nolan and Addabbo.
     - Bill pages: https://www.nysenate.gov/legislation/bills/2015/A3870 and https://www.nysenate.gov/legislation/bills/2015/S3004.
     - Addabbo: "I have been the prime Senate sponsor of the comprehensive proposal repeatedly approved by the Assembly for four years" (https://nysenate.gov/newsroom/press-releases/2016/joseph-addabbo/statement-senator-joseph-p-addabbo-jr-adoption-paid).
     - Klein's IDC was "inserting issues like paid family leave into the Senate Republican budget proposal" (https://www.gothamgazette.com/state/6454-2016-a-far-different-election-year-for-independent-democrats/).
   - Executive: Cuomo really did propose and push it (NYCLU memo: https://www.nyclu.org/resources/policy/legislations/paid-family-leave). His plan paid 50% of wages at full phase-in, against the two-thirds in the Nolan/Addabbo bill. The final law landed at 67%, so the legislators' version shaped the benefit. He gets `proposed` instead of `signed`, after the two sponsors.
   - **Flanagan: drop (balance-pick risk).** The only support for his credit is that his chamber passed the whole budget. That is the leader-passed-the-budget case the guide excludes. Senate Republicans did put a 6-week, state-funded plan in their 2015 one-house budget, but sources credit "Senate Republicans" generally (City & State, in the entry's sources). **Could not establish** any item-specific role for Flanagan or a Martins bill.
   - NEW ids:
     - `catherine-nolan` (former Assembly Member; `current: false`)
     - `joseph-addabbo` (ocd-person/f3a41618-3c28-4bab-9a56-ef49c9cafcec, SD 15)
     - `jeff-klein`, only if added (former Senator and IDC leader; `current: false`)
3. **Body:** The "how it came about" paragraph credits Flanagan and Labor Chair Jack Martins and never names the sponsors. Rewrite it: Nolan and Addabbo carried the bill; the Assembly passed it again and again while the Republican-led Senate blocked it; Cuomo made it a 2016 priority; the final deal settled on 12 weeks at 67%. Sources conflict on how long the fight took. The Assembly says it has passed a paid family leave bill "since 1997"; City & State says "six or seven times" over about 12 years. Use "more than a decade."
4. **Confidence:** high on the sponsors and Cuomo's role; med on dropping Flanagan.

### ny-2019-tenant-protection-act

1. **Net impact: keep.** It's a tenant protection with no fiscal cost. The cost falls on landlords, which is the worker-versus-owner case the guide decides for tenants.
2. **Credit.**
   - Current: `andrew-cuomo` signed (first); `andrea-stewart-cousins` sponsored; `carl-heastie` sponsored.
   - Proposed:
     1. `andrea-stewart-cousins` sponsored ("Senate sponsor of the final bill, which she negotiated with the Assembly; also sponsored the vacancy-decontrol repeal, S.2591")
     2. `brian-kavanagh` led ("Senate Housing chair; led the Senate's effort")
     3. `carl-heastie` negotiated ("Assembly sponsor; negotiated the deal with the Senate")
     4. `linda-rosenthal` championed ("Assembly sponsor of the vacancy-decontrol repeal, A.1198, and of a 2019 security-deposit cap bill, A.5044")
     5. `andrew-cuomo` signed, last
   - Optional: `steven-cymbrowitz` (Assembly Housing chair; preferential-rent bill A.4349).
   - Sources:
     - Kavanagh "led the Senate's efforts to pass" it (https://nysenate.gov/newsroom/articles/2019/brian-kavanagh/senate-passes-strongest-tenant-protections-state-history).
     - The component bills and their sponsors are on the tenant coalition's list (https://nysenate.gov/node/7781533).
     - Rosenthal's deposit bill: https://www.nysenate.gov/legislation/bills/2019/A5044.
     - **Could not establish** that the final deposit, application-fee, and late-fee language came from a specific bill. The closest precursor is S.3379 (Hoylman) / A.5044 (Rosenthal).
   - Executive: Cuomo signed only. He "left the negotiations to lawmakers," and the houses "agreed on their own… That did not please the governor, but he agreed to sign" (https://www.cbsnews.com/newyork/news/new-nyc-rent-protections-signed-into-law; https://www.wamc.org/post/cuomo-legislative-leaders-say-2019-session-includes-many-accomplishments). He goes last as `signed`.
   - This is the one NY entry where the legislative leaders did item-specific work, so they stay.
   - NEW ids:
     - `brian-kavanagh` (ocd-person/934d4a02-a27c-4682-a31f-5a8372ceaaf9, SD 27)
     - `linda-rosenthal` (ocd-person/2c20fb3d-4c95-4494-ac3b-a1ab93f72439, AD 67)
     - optionally `steven-cymbrowitz` (former; `current: false`)
3. **Body:** The last paragraph only says the leaders sponsored it and Cuomo signed. Add that it came from a nine-bill tenant coalition package; that Kavanagh led in the Senate and Rosenthal carried the vacancy-decontrol repeal and a deposit-cap bill; that the Legislature negotiated it without the governor; and that Good Cause was left out until 2024.
4. **Confidence:** high on Cuomo's role and Kavanagh; med on tying the deposit cap to Rosenthal.

### ny-2023-clean-slate-act

1. **Net impact: keep.** It protects people's rights and job prospects. There's no fiscal offset to weigh.
2. **Credit.**
   - Current: `kathy-hochul` signed (first); `zellnor-myrie` sponsored; `catalina-cruz` sponsored.
   - Proposed: `zellnor-myrie` sponsored ("Carried it since 2020; the Senate passed it in 2022"); `catalina-cruz` sponsored ("Assembly sponsor since 2021"); `kathy-hochul` negotiated, last ("Called for it in her 2022 State of the State and negotiated the final terms").
   - Sources:
     - Senate bills S.8165 (2020), S.1553 (2021–22, passed the Senate 37–26), S.7551 (2023) (https://www.nysenate.gov/legislation/bills/2021/S1553).
     - Cruz's A.6399 (2021–22) stayed in committee.
     - Hochul's 2022 State of the State book, p. 72: "will push to pass the Clean Slate Act" (https://www.governor.ny.gov/sites/default/files/2022-01/2022StateoftheStateBook.pdf).
     - Her signing release: "I negotiated a compromise..." (8 years for felonies against her own earlier 7; Class A and sex-offense exclusions).
   - Executive: Hochul did real work here, a 2022 proposal and the final terms. That work came in the middle of a four-year legislative fight, and her 2022 push failed in the Assembly. So `negotiated`, last. Her role changes and she moves to the end.
3. **Body:** Add that Myrie and Cruz carried it for about four years, that the Senate passed it in 2022 but the Assembly didn't, and that Hochul backed it from 2022 and negotiated the final compromise. **Could not establish** any chapter amendment.
4. **Confidence:** high.

### ny-2023-medical-debt-credit-reports

1. **Net impact: keep.** It's a consumer protection with no fiscal cost.
2. **Credit.**
   - Current: `kathy-hochul` signed (first); `gustavo-rivera` sponsored; `amy-paulin` sponsored.
   - Proposed: `gustavo-rivera` sponsored; `amy-paulin` sponsored; `kathy-hochul` signed, last.
   - Sources: it was a one-year bill (sponsor memo: "PRIOR LEGISLATIVE HISTORY: New bill"; https://www.nysenate.gov/legislation/bills/2023/S4907). I found no other legislator named as a champion and no Hochul proposal; her signing release has no "proposed" language (https://governor.ny.gov/news/governor-hochul-signs-four-new-laws-protect-consumers-price-gouging-medical-debt-and-unfair).
   - Executive: signed only. She moves to the end.
3. **Body:** none. The body already names the sponsors before the signer.
4. **Confidence:** high.

### ny-2023-minimum-wage

1. **Net impact: keep.** It's a wage floor with no fiscal offset to weigh. One worker cost belongs in the body: the economic off-ramps, which were the governor's design, have already cancelled the 2027 inflation raise (the entry's status note already says it was triggered).
2. **Credit.**
   - Current: `kathy-hochul` signed (only credit).
   - Proposed: `jessica-ramos` championed ("Senate Labor chair; sponsored the Raise the Wage Act, S.1978-A, to reach $21.25 downstate"); `latoya-joyner` championed ("Assembly Labor chair; Assembly sponsor, A.2204-A"); `kathy-hochul` negotiated, last ("Proposed indexing to inflation, with off-ramps, but no step raises; agreed to the $17/$16 steps in the budget deal").
   - Missing: Ramos and Joyner. Sponsors: https://www.businessforafairminimumwage.org/news/001952/growing-new-york-business-coalition-supports-raising-and-indexing-minimum-wage-state. Hochul's proposal (indexing "beginning the year after the rate hits $15 per hour upstate," with off-ramps and a 3% cap) and Ramos's $21.25 bill: https://spectrumlocalnews.com/nys/central-ny/news/2023/02/03/minimum-wage-debate-heats-up-as-state-budget-talks-begin. The step raises in the final law weren't in the governor's proposal. That they came from the legislative push is my inference from comparing the two proposals with the enacted schedule; no single source says it outright.
   - Executive: drop from sole credit to `negotiated`, last.
   - NEW ids: `jessica-ramos` (openstates ocd-person/a0b3e01c-d323-4624-a0da-6a1e2b0dfb31, Senate District 13). `latoya-joyner` is not in the current roster, so set `current: false` and confirm her district before creating the file.
3. **Body:** Replace "Hochul signed the increase into law" with the real history: Ramos and Joyner pushed for $21.25, Hochul proposed only indexing with off-ramps, and the final deal added the step raises to $17/$16 plus her indexing. Say that one of her off-ramps paused the 2027 raise.
4. **Confidence:** high on the sponsors and Hochul's proposal; med on the split of credit within the final deal.

### ny-2024-good-cause-eviction

1. **Net impact: keep.** It's a tenant protection with no service cut. It was traded in the same housing deal for the new 485-x developer tax break (https://www.cityandstateny.com/policy/2024/04/all-details-albanys-final-housing-deal/395953/), but that's a separate part of a budget that didn't cut services, so the test isn't triggered. The body could mention the trade as context.
2. **Credit.**
   - Current: `kathy-hochul` signed; `julia-salazar` championed.
   - Proposed: `julia-salazar` sponsored ("Senate sponsor of the stand-alone bill since 2019"); `pamela-hunter` sponsored ("Assembly sponsor since 2019"); `kathy-hochul` signed, last.
   - Missing: Pamela Hunter. City Limits says Salazar and Hunter "sponsored the original comprehensive bill since 2019," and that Hochul negotiated a narrower version (https://citylimits.org/2024/04/20/nys-housing-deal-is-here-what-does-it-mean-for-tenant-stability/).
   - Executive: Hochul didn't propose it. What she negotiated were the carve-outs (small landlords, post-2009 buildings, high-rent units) and a looser rent threshold (10% or CPI+5%, against the bill's 3% or 1.5×CPI, per City & State above). I recommend `signed`, last. A defensible alternative is `negotiated`, last, with a note saying she narrowed it.
   - NEW: `pamela-hunter` (openstates ocd-person/10fb37a0-e41f-4129-9ed2-7c5b674807da, AD 128).
3. **Body:** Name Hunter. Say Salazar and Hunter carried the bill for five years with tenant groups, and that the enacted version is narrower than theirs (the exemptions list is already in the body). Move Hochul's signature to the end.
4. **Confidence:** high.

### ny-2024-paid-prenatal-leave

1. **Net impact: keep.** Employers pay for the leave; nothing was cut.
2. **Credit.**
   - Current: `kathy-hochul` signed (only credit).
   - Proposed: `kathy-hochul` proposed ("Proposed it in her 2024 State of the State; she asked for 40 hours and the final law gave 20").
   - Missing: none found. I found no legislator with an earlier stand-alone prenatal-leave bill, and no legislator named as its champion. The governor's office says she "proposed this nation-leading policy in her 2024 State of the State" (https://www.governor.ny.gov/news/money-your-pockets-ahead-january-1-2025-start-date-first-nation-paid-prenatal-leave-governor). The 40-hour original is in https://news.bloomberglaw.com/in-house-counsel/hochul-aims-for-nations-first-paid-prenatal-leave-benefit-in-ny.
   - Executive: this one really was hers. `proposed`, first and only.
3. **Body:** Change "was added ... in the state budget Gov. Kathy Hochul signed" to "Gov. Kathy Hochul proposed it in January 2024 ..." Optionally note that it was cut from 40 hours to 20 in the final deal.
4. **Confidence:** high.

### ny-2025-empire-state-child-credit

1. **Net impact: keep + say what it cost.** It's a refundable credit aimed at low- and middle-income families, so it passes. The cost should still be stated, because the same bill also cut income-tax rates. Fiscal cost: about $825M a year for three years (Fiscal Policy Institute). The same budget extended the higher tax rates on incomes above about $1.08M (single) and $2.15M (joint) from 2027 through 2032, raising about $3.6B a year, and didn't cut services (FPI enacted-budget briefing, slides 18 and 22: https://fiscalpolicy.org/wp-content/uploads/2025/05/2026.05.12-FY-2026-Budget-Briefing-Enacted.pdf).
2. **Credit.**
   - Current: `kathy-hochul` signed (only credit).
   - Proposed: `kathy-hochul` proposed ("Proposed these amounts in her FY2026 executive budget").
   - Evidence: the State Comptroller's report on the Executive Budget shows her proposal had exactly the enacted amounts: $1,000 under 4, and $500 for ages 4–16 from 2026, temporary for three years (https://www.osc.ny.gov/files/reports/budget/pdf/executive-budget-report-2025-26.pdf, p. 20).
   - Not missing, but context: Sen. Andrew Gounardes and Assemblymember Andrew Hevesi pushed a larger Working Families Tax Credit (S.2082/A.3474, up to $1,600 per child). Both one-house budgets included it, but the final deal used the governor's design (https://www.nysenate.gov/newsroom/press-releases/2025/andrew-gounardes/sen-gounardes-working-families-tax-credit-included). Their bill didn't pass, so I would put them in the body, not the credit list. This is the owner's call if you'd rather credit the pressure.
   - Executive: `proposed`, first.
   - NEW ids: only if the owner chooses to credit them: `andrew-gounardes` (ocd-person/ae1f415b-958c-4a4c-805b-626e6eca5fe3) and `andrew-hevesi` (ocd-person/2a9aad09-337f-4fd0-8e87-70afd78ac8cc).
3. **Body:** Lead "how it came about" with Hochul's January 2025 proposal. Add a sentence that legislators wanted a larger credit. Add one cost sentence: "It costs the state about $825 million a year; the same budget extended higher income-tax rates on millionaires through 2032." Also say the expansion is temporary (through tax year 2027). That's already in the status note but missing from the body.
4. **Confidence:** high.

### ny-2025-inflation-refund-checks

1. **Net impact: keep + say what it cost.** It's a one-time rebate from a real surplus, so it passes the guide's test. FPI: "Current year surplus used for inflation refund (now $2 billion)," and the state ended FY2025 $6B above forecast with $34B in reserves (FPI briefing, slides 13–14, URL above). The governor's office framed it as returning inflation-driven sales-tax revenue (https://www.governor.ny.gov/news/governor-hochul-announces-inflation-refund-checks-are-now-being-sent-82-million-new-york).
   - **Flag:** FPI listed the refund checks among its "serious fiscal concerns," given projected gaps of $6.4–11B in 2027–29. It also estimated that a $100K family of four gets about $400 from the check over five years, against about $10,000 from free school meals. The checks went to joint filers up to $300K. It isn't filler, but it is the thinnest per-household benefit among the NY entries.
2. **Credit.**
   - Current: `kathy-hochul` signed; `andrea-stewart-cousins` negotiated; `carl-heastie` negotiated.
   - Proposed: `kathy-hochul` proposed ("Proposed an inflation refund credit in her FY2026 executive budget").
   - Evidence: the Comptroller's report shows the executive proposal as a $3B credit, $500 for joint filers and $300 for others (OSC report above, p. 11). The enacted version was smaller.
   - Leaders: I found no source giving Stewart-Cousins or Heastie an item-specific role. The governor's release only quotes them as supporters. The guide says to credit legislators who won the item, "not just the leaders who passed the whole budget." I recommend dropping them. **Could not confirm** who shrank the checks from $3B to about $2B.
   - Executive: `proposed`, first and only.
3. **Body:** Say Hochul proposed it. Add the funding sentence: "The state paid for the checks from a one-year budget surplus." Drop "after negotiations with ..." unless a source ties the leaders to this item.
4. **Confidence:** med-high.

### ny-2025-school-phone-ban

1. **Net impact: owner's call (possible filler).**
   - For: the teachers' unions, NYSUT and the UFT, backed the bell-to-bell rule as better for classrooms and youth mental health, and it came with $13.5M for storage (https://gothamist.com/news/bell-to-bell-smartphone-ban-in-ny-schools-is-on-track-to-become-law, as summarized in search results).
   - Against: it puts no money in pockets, lowers no costs, and creates no service or right for working families. It's a restriction on students whose benefit is still debated, and school administrators didn't back it (https://gothamist.com/news/hochul-school-phone-ban-budget-ny). It fits the guide's "direct, tangible effect" list poorly.
2. **Credit.**
   - Current: `kathy-hochul` signed, with the note "Proposed the statewide bell-to-bell restriction."
   - Proposed: `kathy-hochul` proposed.
   - Evidence: the Comptroller's report lists it as an Executive Budget proposal (OSC report above). Hochul pushed it in January 2025 (https://ny1.com/nyc/all-boroughs/education/2025/01/21/hochul-proposes-banning-cellphones-during-the-school-day), and the Senate initially wanted a looser version.
   - Missing: no legislator champion found.
   - Executive: `proposed` (the role is currently wrong).
3. **Body:** Minimal changes. The text already says she proposed it.
4. **Confidence:** med.

### ny-2025-universal-school-meals

1. **Net impact: keep.** The program costs $340M ($180M of it new state cost) in a budget that didn't cut services (FPI slide 18). It isn't a judgment call.
2. **Credit.**
   - Current: `kathy-hochul` signed ("Included universal school meals in her FY 2026 budget"); `michelle-hinchey` championed; `jessica-gonzalez-rojas` championed.
   - Proposed: `michelle-hinchey` championed ("Prime Senate sponsor of the Universal School Meals Act, S.594, pushed since 2022"); `jessica-gonzalez-rojas` championed ("Prime Assembly sponsor, A.282"); `kathy-hochul` proposed, last ("Put it in her FY2026 executive budget after leaving it out in earlier years").
   - Sources: the governor pledged to fund Hinchey's bill in the FY2026 budget (https://www.nysenate.gov/newsroom/press-releases/2025/michelle-hinchey/hinchey-advocates-and-governor-unite-universal-school). Universal meals were left out of Hochul's 2023 budget (https://spectrumlocalnews.com/nys/central-ny/politics/2023/02/03/pols--disappointed--universal-school-meals-not-in-hochul-s-budget). The executive proposal is in the OSC report above.
   - Executive: Hochul did put it in her budget, so `proposed` replaces `signed`. She goes after the two sponsors who carried it for three years, because she adopted their bill.
3. **Body:** Rewrite "how it came about": Hinchey and González-Rojas introduced the bill in 2022 and pushed it with advocates for three years; Hochul, who had left it out before, included it in her 2025 budget; then the vote.
4. **Confidence:** high.

### ny-2026-universal-pre-k

1. **Net impact: owner's call (lean keep + say what it cost).**
   - For: $563M a year in new pre-K money and real free seats. The FY2027 budget added a pied-à-terre surcharge on NYC second homes worth $5M+ (about $500M a year; https://www.governor.ny.gov/news/governor-hochul-signs-budget-makes-new-york-more-affordable-keeps-new-yorkers-safe-and-expands) and extended the corporate franchise tax rates through 2029 (https://taxnews.ey.com/news/2026-1238-new-york-budget-bill-extends-corporate-franchise-tax-rates-addresses-certain-obbba-provisions-and-creates-a-pied-a-terre-tax-among-other-changes). No service cut is tied to pre-K.
   - Against: the same budget didn't backfill the Essential Plan. About 450,000–470,000 New Yorkers between 200% and 250% of the poverty line, mostly low-wage workers, were set to lose that coverage starting July 2026 after Hochul asked Washington to shrink the plan. Both sources were written before July; I didn't confirm the actual disenrollment count. FPI said a $2.5B set-aside freed up by federal approval could have covered them (https://fiscalpolicy.org/wp-content/uploads/2026/03/2026.03.23-MK-Statement-on-EP-Approval.pdf; "notably absent," https://www.cityandstateny.com/policy/2026/05/heres-whats-fy-27-new-york-state-budget/413729/). The cut started with federal law, so it fails the "same action" reading but it does weigh on the budget as a whole.
   - My lean: keep, and add a cost sentence on how pre-K was paid for. Record the Essential Plan loss as a future harms entry, not as a reason to retract pre-K. The same question applies to the state money in `nyc-2k-free-child-care`.
2. **Credit.**
   - Current: `kathy-hochul` signed ("Secured the pre-K funding increase in her FY 2027 budget").
   - Proposed: `kathy-hochul` proposed ("Proposed universal pre-K by 2028–29 in her 2026 State of the State").
   - Evidence: https://www.governor.ny.gov/news/governor-hochul-announces-investments-deliver-universal-child-care-new-york-children-under (Jan. 8, 2026; she proposed $470M and $563M was enacted).
   - Legislators: Sen. Pete Harckham and Assemblymember Dana Levenberg pushed to move the deadline up to 2027 (https://westchester.news12.com/2026/03/02/legislators-call-for-increased-universal-pre-k-funding-and-capacity/3PMugigP4BQJXEIAdv3jVt). That push wasn't adopted, so they don't get credit. Sen. Jabari Brisport pushed for universal child care in general, not this item.
   - Executive: `proposed`, first and only.
3. **Body:** Say she proposed it in January 2026. Add the cost sentence. The entry has no bill identifier or votes, so add the budget bill number and floor votes if they can be found. **Could not confirm** the bill part number.
4. **Confidence:** med on net impact; high on credit.

---

## New York City

### nyc-2k-free-child-care

1. **Net impact: keep + say what it cost.** The state put up $73M in FY2027 and $425M in FY2028 (https://cccnewyork.org/data-publications/fy27-nyc-budget/). The city's FY2027 budget dropped its proposed 9.5% property-tax rate increase and closed its gap with state aid and the new pied-à-terre surcharge (https://www.rosenbergestis.com/media/blog/nyc-property-tax/nyc-executive-budget-update-the-last-resort-property-tax-rate-increase-is-gone-but-property-tax-bills-are-still-projected-to-rise). The state money raises the same Essential Plan question as `ny-2026-universal-pre-k`.
2. **Credit.**
   - Current: `zohran-mamdani` led; `kathy-hochul` secured-funding.
   - Proposed: no change in order. Optionally change Mamdani to `proposed`; the governor's release calls it "the Mayor's signature 2-Care program." Hochul's `secured-funding` is accurate.
   - Missing: no Council role found.
3. **Body:** Add the second-year state figure ($425M for about 12,000 seats). Note the program's name in state documents ("2-Care") so readers can match sources.
4. **Confidence:** med-high.

### nyc-child-care-copays-eliminated

1. **Net impact: keep.** The city spends $5.2M a year to remove copays for 22,000 low-income families (CCC confirms the $5.2M). It's modest, but direct, and nothing was cut.
2. **Credit.** Current and proposed: `zohran-mamdani` led. It's a mayoral program. No Council bill found.
3. **Body:** none.
4. **Confidence:** high.

### nyc-click-to-cancel

1. **Net impact: keep.** It's a consumer protection with no fiscal cost to workers.
2. **Credit.**
   - Current and proposed: `nyc-dcwp` issued; `zohran-mamdani` led ("Executive Order 10").
   - Source: the DCWP release credits EO 10 and Commissioner Sam Levine, and names no Council bill (https://www.nyc.gov/site/dca/news/048-26/mamdani-administration-landmark-consumer-protection-rules-ban-subscription-traps-and). Mamdani's role could be `issued` (for the EO). Either works.
3. **Body:** none.
4. **Confidence:** high.

### nyc-curbside-composting

1. **Net impact: keep.** It's a new free city service. Fines fall on building owners. The direct benefit to workers is modest (mainly environmental), but it qualifies as a service created.
2. **Credit.**
   - Current: `shahana-hanif` sponsored; `nyc-city-council` voted-yes.
   - Proposed: `shahana-hanif` sponsored; `antonio-reynoso` championed ("Brooklyn Borough President; the bill was introduced at his request"); `eric-adams` implemented ("His Sanitation Department rolled out curbside composting borough by borough on a roadmap he announced Feb. 1, 2023, before the Council acted; the law took effect without his signature"); `nyc-city-council` voted-yes.
   - Sources: Local Law 85 of 2023 text: "Introduced by Council Members Hanif, the Speaker (Council Member Adams) ... (by request of the Brooklyn Borough President)"; "returned unsigned by the Mayor on July 13, 2023" (https://intro.nyc/local-laws/2023-85). Adams's roadmap: https://www.nyc.gov/office-of-the-mayor/news/084-23/mayor-adams-roadmap-nation-s-largest-compost-collection-program-including-achieving (cited in Wikipedia; I didn't open it directly).
   - Executive: Adams didn't sign, so he gets no `signed` credit. His administration did build the service, so `implemented` is fair, placed after the legislators. An alternative is a NEW body, `nyc-dsny`, as the implementer.
   - NEW: `antonio-reynoso` (Brooklyn Borough President); optionally `nyc-dsny` (kind: body).
   - The law itself sets the separation mandate and the owner penalties from April 1, 2025, so the entry's description is correct.
3. **Body:** Add that the Adams administration's Sanitation Department ran the rollout (Queens 2022, Brooklyn October 2023, Bronx and Staten Island March 2024, Manhattan October 2024) and announced the citywide goal in February 2023. Add that the bill came at the Brooklyn Borough President's request.
4. **Confidence:** med-high (I didn't open the Adams release myself).

### nyc-debt-demolisher-fine-amnesty

1. **Net impact: owner's call (lean retract).**
   - For: it's revenue-positive, projected to bring in $25M "that would have otherwise gone uncollected," and costs no services. Homeowners and small businesses can clear old fines.
   - Against: eligibility isn't limited to homeowners or small businesses. The mayor's release says any "eligible New Yorkers" with Environmental Control Board judgments, with no size limit (https://www.nyc.gov/mayors-office/news/2026/10/mamdani-administration-announces-debt-demolisher--relief-program). Those judgments come from building, sanitation, and similar code violations, so the relief goes mostly to property and business owners, large landlords included. That is the guide's "relief that mostly goes to owners" case. It's also a collections tool more than a benefit for workers.
   - **Could not confirm** who holds most ECB debt by dollar value, or whether street-vendor violations are eligible. That would change the picture if they are.
   - If kept, the dek's "homeowners and small businesses" overstates the targeting.
2. **Credit.**
   - Current: `linda-lee` sponsored; `zohran-mamdani` proposed.
   - Proposed: `zohran-mamdani` proposed, first; `linda-lee` sponsored ("Finance chair; introduced at the mayor's request").
   - Source: LL 147 of 2026 text: "Introduced by Council Member Lee (by request of the Mayor)"; "returned unsigned by the Mayor on September 14, 2026" (https://intro.nyc/local-laws/2026-147). This was the mayor's program, which is exactly the case where an executive leads.
3. **Body/dek:** If kept, the dek and who_benefits should say "people and businesses with eligible unpaid ECB judgments" and drop the implied small-owner limit. Add the $25M projection.
4. **Confidence:** med.

### nyc-dekalb-lafayette-b38-bus-lanes

1. **Net impact: keep (flag).** Bus lanes are a transit service for workers, and there is no financing issue. **Flag:** the action is a groundbreaking (Nov. 5, 2026), and the lanes aren't built yet, so it sits close to the guide's "announcement" line. One corridor is a thin entry. Consider holding it until the lanes open, or keeping it as `phasing-in` as now.
2. **Credit.**
   - Current and proposed: `zohran-mamdani` led; `nyc-dot` implemented.
   - Source: Streetsblog calls it "the Mamdani administration's decision"; Council Members Crystal Hudson and Chi Ossé publicly supported DOT's proposal (https://nyc.streetsblog.org/2026/10/06/desperately-needed-bus-and-bike-lanes-are-coming-to-brownstone-brooklyn). Support alone doesn't earn credit.
3. **Body:** none.
4. **Confidence:** med.

### nyc-delivery-worker-minimum-pay

1. **Net impact: keep.** Workers' pay went up by more than $2B (DCWP). The apps carry the cost.
2. **Credit.**
   - Current: `brad-lander` sponsored; `eric-adams` issued; `nyc-dcwp` issued.
   - Proposed: `brad-lander` sponsored ("Prime sponsor of Local Law 115 of 2021, which required the minimum rate"); `sandy-nurse` sponsored ("Prime sponsor of Local Law 124 of 2025, which extended the minimum to grocery apps; passed over Mayor Adams's veto"); `nyc-dcwp` issued; `eric-adams` issued, last ("His administration adopted the 2023 rule and defended it in court; he vetoed the 2025 grocery extension").
   - Optional: `jennifer-gutierrez` (LL 123 of 2025, payment timing and pay statements) and `shaun-abreu` (LL 107/108 tipping, LL 113 pay transparency). Otherwise name them in the body.
   - Sources: law texts at https://intro.nyc/local-laws/2021-115 (Lander first; "returned unsigned by the Mayor on October 25, 2021", meaning de Blasio didn't sign it), https://intro.nyc/local-laws/2025-124 (Nurse first; "disapproved by the Mayor on August 13, 2025 and repassed by the Council on September 10, 2025"), https://intro.nyc/local-laws/2025-123 (Gutiérrez first), https://intro.nyc/local-laws/2025-107 (Abreu first). DCWP also says "the City Council overrode Eric Adams' initial veto" (https://www.nyc.gov/site/dca/news/009-26/major-victory-nyc-delivery-workers-landmark-protections-take-effect-today).
   - Executive: Adams keeps `issued` for the 2023 rule, but goes after the legislators. There's no signer to add, because LL 115 became law unsigned.
   - NEW: `jennifer-gutierrez` and `shaun-abreu`, only if added.
3. **Body:** Add that the 2025 grocery extension passed over Adams's veto (Sept. 10, 2025), and name Nurse. Add that LL 115 became law without de Blasio's signature.
4. **Confidence:** high.

### nyc-fair-fares-200-percent

1. **Net impact: keep.** The cost is $54M, baselined, in a budget with no property-tax rate increase (CCC; Rosenberg & Estis, above).
2. **Credit.**
   - Current: `zohran-mamdani` negotiated (first); `julie-menin` negotiated.
   - Proposed: `julie-menin` secured-funding ("Speaker; the Council's budget response demanded the expansion to 200% of the poverty line"); `zohran-mamdani` negotiated, last ("Left it out of his preliminary budget; agreed in the final deal").
   - Sources: Menin: "The Council secured the largest expansion of Fair Fares in the program's history" (https://nyc.streetsblog.org/2026/06/30/mamdani-and-city-council-agree-to-expand-fair-fares-half-priced-transit-program). The Council's own release calls it a Council win (https://council.nyc.gov/press/2026/06/30/3151/). Coverage reports that the preliminary budget omitted it and that the Council's April response proposed it (https://www.amny.com/news/nyc-budget-fair-fares-expands-2026/, from a search summary; I didn't open it).
   - Executive: the mayor goes last.
3. **Body:** Lead with the Council's push, then the mayor's agreement.
4. **Confidence:** high.

### nyc-fare-act-broker-fees

1. **Net impact: keep.** The risk to check was cost-shifting onto tenants through higher rents. The only 2026 reporting I could open treats that as "hotly contested." A Corcoran executive speculated about an effect but pointed mainly to housing shortage, and gave no numbers (https://www.amny.com/housing/rent-prices-brooklyn-manhattan-records-july-2026/). **Could not confirm** any quantified pass-through study. StreetEasy blocks automated access, and the search quota ran out.
2. **Credit.**
   - Current and proposed: `chi-osse` sponsored; `nyc-city-council` voted-yes.
   - Source: LL 119 of 2024 confirms Ossé as prime sponsor and "returned unsigned by the Mayor on December 16, 2024" (https://intro.nyc/local-laws/2024-119).
3. **Body:** Optional: one sentence noting the landlord argument and the lack of clear evidence, once a quantified source is found.
4. **Confidence:** med (high on credit).

### nyc-health-bucks-snap-produce-match-increase

1. **Net impact: keep (flag: small).** About $2.3M a year in coupons, at $4 more per day. It's real but low-impact. It's funded by city money plus a $5.7M federal GusNIP grant (https://www.nyc.gov/mayors-office/news/2026/10/mayor-mamdani-announces-snap-users-to-receive-40--more-money-for). Nothing was cut.
2. **Credit.**
   - Current: `zohran-mamdani` led; `nyc-health-department` implemented.
   - The release credits the mayor, the Deputy Mayor for Health and Human Services, and the Health Commissioner, with no Council role. **Could not confirm** the city's dollar share or who applied for the federal grant.
   - Optional: put the Health Department first if the owner reads an announcement as not being work.
3. **Body:** none.
4. **Confidence:** med.

### nyc-kids-rise-1000-college-savings

1. **Net impact: keep.** It's a universal $1,000 seed, costing about $53M (https://cccnewyork.org/data-publications/fy27-nyc-budget/; the Speaker cited $64M). Nothing was cut.
2. **Credit.**
   - Current: `julie-menin` championed; `zohran-mamdani` negotiated.
   - Proposed: same order, with Menin's role changed to `proposed`.
   - Source: Menin proposed "$1,000 for every public-school kindergartener" in her Feb. 11, 2026 budget testimony (https://council.nyc.gov/press/2026/02/11/3071/). She had also helped start Kids RISE as consumer affairs commissioner (https://www.chalkbeat.org/newyork/2026/06/30/nyc-budget-gives-kindergartners-1000-for-college-restores-school-programs/).
3. **Body:** Optional cost line (about $53M a year).
4. **Confidence:** high.

### nyc-paid-sick-leave

1. **Net impact: keep.** Employers pay. Nothing was cut.
2. **Credit.**
   - Current: `bill-de-blasio` signed (first); `margaret-chin` sponsored; `gale-brewer` sponsored.
   - Proposed: `gale-brewer` sponsored ("Lead sponsor of the original 2013 law, enacted over Mayor Bloomberg's veto"); `margaret-chin` sponsored ("Prime sponsor of Local Law 7 of 2014"); `sandy-nurse` sponsored ("Prime sponsor of Local Law 145 of 2025, which added 32 hours of unpaid protected time"); `bill-de-blasio` proposed, last ("Proposed the 2014 expansion with Speaker Mark-Viverito; the bill was introduced at his request").
   - Sources: Int. 0001-2014 on Legistar lists the Mayor's request and shows it was signed March 20, 2014 (https://legistar.council.nyc.gov/LegislationDetail.aspx?ID=1636850&GUID=FD23CC16-F69E-4F06-B448-251F1CFC922D). The Speaker "joined Mayor Bill de Blasio to announce" the plan (http://council.nyc.gov/press/2014/01/17/425/). LL 145 of 2025 lists "Council Members Nurse, Cabán, ..." and was "returned unsigned by the Mayor on October 27, 2025" (https://intro.nyc/local-laws/2025-145).
   - Missing: Nurse. The entry's third impact figure (32 hours) comes from her law.
   - Executive: de Blasio really did propose the 2014 expansion, so `proposed` replaces `signed`. He goes after the legislators, because the 2013 law, fought for over several years, is the base of the right.
3. **Body:** Add Nurse's 2025 law alongside the 32-hour sentence, and note it took effect without Adams's signature.
4. **Confidence:** high.

### nyc-pre-k-for-all

1. **Net impact: keep + say what it cost.** De Blasio wanted to pay for it with a tax on city incomes above $500K. Albany rejected the tax and paid from the state budget instead. The same deal gave charter schools guaranteed space or rent aid (https://www.chalkbeat.org/newyork/2014/3/29/21101795/pre-k-funds-charter-school-protections-and-common-core-changes-in-state-budget-deal/). No service was cut.
2. **Credit.**
   - Current: `bill-de-blasio` led.
   - Proposed: `bill-de-blasio` proposed.
   - Optional: `andrew-cuomo` secured-funding. **Could not confirm** with a source I opened that Cuomo's own executive budget proposed the statewide pre-K money. Chalkbeat only says the governor and the Legislature agreed on it.
3. **Body:** Add one sentence: "De Blasio proposed paying for it with a tax on city residents earning over $500,000; instead, the state covered it from its budget."
4. **Confidence:** med.

### nyc-rent-freeze-2026

1. **Net impact: keep.** It's a direct win for tenants. The cost falls on landlords. From where workers stand, that passes.
2. **Credit.** Current and proposed: `nyc-rent-guidelines-board` issued; `zohran-mamdani` championed (he appointed board members). No new research was needed. The entry was verified on 2026-11-05.
3. **Body:** none.
4. **Confidence:** med-high.

### nyc-right-to-counsel

1. **Net impact: keep.** It's city-funded legal services with no offsetting cut.
2. **Credit.**
   - Current: `bill-de-blasio` signed (first); `mark-levine` sponsored; `vanessa-gibson` sponsored.
   - Proposed: `mark-levine` sponsored ("Prime sponsor; introduced it in 2014 and pushed it for three years"); `vanessa-gibson` sponsored; `crystal-hudson` sponsored ("Prime sponsor of Local Law 20 of 2023, which made every tenant 60 or older eligible"); `bill-de-blasio` secured-funding, last ("Backed the bill and committed the funding in February 2017").
   - Sources: LL 136 of 2017 text, "Introduced by Council Members Levine, Gibson, ...", "approved by the Mayor on August 11, 2017" (https://intro.nyc/local-laws/2017-136). Levine and Gibson "have consistently advocated for the bill since introducing it three years ago," and the funding deal came in February 2017 (https://www.gothamgazette.com/city/7076-city-council-passes-right-to-counsel-for-low-income-tenants-in-housing-court). Int. 0673-2022 / LL 20 of 2023, prime sponsor Crystal Hudson, "returned unsigned by the Mayor on February 21, 2023" (https://legistar.council.nyc.gov/LegislationDetail.aspx?ID=5778360&GUID=5A495DE0-C3B3-4E91-B56B-5066C7B7E14A).
   - Missing: Hudson. The entry's dek and body rely on the 60+ expansion from her law.
   - Executive: de Blasio's funding commitment was real work, so `secured-funding` replaces `signed`. He goes last.
   - NEW: `crystal-hudson` (NYC Council District 35).
3. **Body:** Name Hudson in the 2023 amendment sentence. Note it took effect without Adams's signature.
4. **Confidence:** high.

---

## Patterns

1. **Every NY entry lists the governor first as `signed`.** That's all 12; two NYC entries (paid sick leave, Right to Counsel) do the same with de Blasio. Under the new rule, none of the 14 can stay as is.
2. **The NY budget items split cleanly, and the split is sourced.**
   - **Hochul's own initiatives** (she should be `proposed`, first): paid prenatal leave, the child credit expansion, the inflation refund, the phone rule, and universal pre-K. For the four FY2026 items, the Comptroller's report on her Executive Budget shows each one.
   - **Legislator-driven items she adopted or negotiated** (she should come last): universal school meals (Hinchey and González-Rojas since 2022; she left it out in 2023), the minimum wage step raises (Ramos and Joyner; she proposed only indexing), Good Cause (Salazar and Hunter since 2019; she narrowed it), and Clean Slate (Myrie and Cruz since 2020; she proposed it in 2022 and negotiated the final terms).
   - **Cuomo** really did propose paid family leave in 2016, but Nolan and Addabbo had carried it for years, and the final benefit matched their 67%, not his 50%.
3. **Leaders credited for passing a whole budget.** Two entries credit leaders for that alone: Flanagan on paid family leave, and Stewart-Cousins and Heastie on the inflation refund. Neither has an item-specific source, so I recommend dropping them. The tenant protection act is the exception: there the leaders really did sponsor and negotiate the bill.
4. **Balance pick.** Flanagan is the only Republican credited anywhere in the NY/NYC set, and his credit is the weakest-sourced. Drop it, and don't replace it to keep the parties even. If the owner wants the Republican history told accurately, Sen. Roy McDonald (R) sponsored the 2012 Senate paid-leave companion (S.7547). That belongs in the body, not the credits, since he didn't carry it to passage.
5. **NYC: Council laws rarely have a signer at all.** In this set, Adams returned every Council law unsigned (LL 85/2023, LL 20/2023, LL 119/2024, LL 145/2025) or vetoed it (the grocery delivery laws, LL 123 and 124 of 2025, overridden Sept. 10, 2025). LL 115/2021 was unsigned by de Blasio, and LL 147/2026 by Mamdani. So the NYC problem isn't signer order. It's **missing sponsors of later amendments that the entries' own figures rely on**: Sandy Nurse (the 32 unpaid hours; grocery minimum pay) and Crystal Hudson (Right to Counsel for tenants 60+).
6. **NYC: mayoral programs versus Council wins.** The mayoral programs are correctly led by Mamdani: 2-K, copays, click-to-cancel, B38, Health Bucks, and Debt Demolisher (which should be reordered to put him first, since it was introduced "by request of the Mayor"). The Council-driven budget items (Fair Fares, Kids RISE) should lead with Speaker Menin. Fair Fares currently lists the mayor first even though his preliminary budget left it out.
7. **Net impact: nothing clearly fails, but five entries need a cost sentence:** the child credit, the inflation refund, universal pre-K, 2-K, and Pre-K for All.
   - The FY2026 state budget paid for its tax relief partly by extending higher millionaire tax rates through 2032 (about $3.6B a year) and cut no services.
   - The FY2027 state budget is harder. It funded pre-K and 2-K but didn't backfill federal Essential Plan cuts, which were set to cost about 450,000 low-wage New Yorkers their coverage from July 2026. That one decision (an owner's call) affects two entries.
   - The NYC FY2027 budget dropped its proposed property-tax rate increase and leaned on state aid and the new pied-à-terre surcharge.
8. **Fit and filler flags:**
   - Debt Demolisher: relief mostly to property and business owners, with no size limit (lean retract).
   - Phone rule: no money, service, or right.
   - Health Bucks: about $2.3M a year.
   - B38: groundbreaking only.
   - Inflation refund: about $400 per family; FPI flagged it as a fiscal concern.
   - None of these looks like a party-balance pick. They're low-impact or owner-tilted.
9. **NEW official files the proposals would need:**
   - Required:
     - `jessica-ramos`, `latoya-joyner` (former; not in the current roster)
     - `pamela-hunter`, `catherine-nolan` (former), `joseph-addabbo`
     - `brian-kavanagh`, `linda-rosenthal`, `antonio-reynoso`, `crystal-hudson`
   - Optional: `jeff-klein`, `steven-cymbrowitz`, `andrew-gounardes`, `andrew-hevesi`, `jennifer-gutierrez`, `shaun-abreu`, `nyc-dsny` (body).
   - Roster openstates ids are given in each section where the roster has them.
10. **Still open (could not confirm):**
    - quantified evidence that FARE Act fees moved into rents
    - who holds most ECB debt, and whether vendor violations qualify
    - who cut the inflation refund from $3B to about $2B
    - Cuomo's own executive-budget proposal for 2014 pre-K money
    - the FY2027 pre-K bill part number
    - the city's dollar share of the Health Bucks increase

---

## Applied 2026-11-11 (after owner approval)

**Owner decisions:**
- `nyc-debt-demolisher-fine-amnesty` and `ny-2025-school-phone-ban` were retracted. That was done separately.
- Budget-only credits were dropped: Flanagan, and Stewart-Cousins and Heastie on the refund. Flanagan was not replaced.
- Appointees get credit by name when a source ties them to the action.
- Pre-K, Health Bucks, B38, and the inflation refund stay.

**Entries changed (21):** every remaining `ny-*` entry, plus these NYC entries: `nyc-2k-free-child-care`, `nyc-click-to-cancel`, `nyc-curbside-composting`, `nyc-dekalb-lafayette-b38-bus-lanes`, `nyc-delivery-worker-minimum-pay`, `nyc-fair-fares-200-percent`, `nyc-kids-rise-1000-college-savings`, `nyc-paid-sick-leave`, `nyc-pre-k-for-all`, `nyc-right-to-counsel`. Each got the credit changes proposed above and the body and cost-sentence edits, and its verification was reset to pending.

**Changes from the proposal at apply time:**
- `nyc-click-to-cancel`: under the new appointee rule, Commissioner Sam Levine (`sam-levine`, `issued`) replaces the `nyc-dcwp` body credit, after Mamdani.
- `nyc-curbside-composting`: Sanitation Commissioner Jessica Tisch (`jessica-tisch`, `implemented`) was added. The Feb. 1, 2023 Adams roadmap release, now opened and cited, ties her to the rollout.
- `nyc-dekalb-lafayette-b38-bus-lanes`: the title now says riders "are getting" the lanes, and the impact label says "being built." The status note says no segment is finished and no completion date has been announced (as of 2026-11-11; the mayor's release has none).
- `nyc-2k-free-child-care`: the Jan. 8, 2026 governor release commits the state to "fully fund the first two years" but gives no dollar figures. The $73M and $425M figures are cited to the CCC budget overview.

**Skipped, and why:**
- `jeff-klein` on paid family leave. It was optional; his IDC role is only broadly sourced, and the entry's sources were already long. No official file was created.
- Gounardes and Hevesi on the child credit. Their larger credit didn't pass, so they're named in the body only.
- Optional Gutiérrez and Abreu on delivery pay, optional Cymbrowitz on the tenant act, and Cuomo `secured-funding` on Pre-K for All (could not confirm).
- Named commissioners for the 2023 delivery-pay rule (the rule notice names no commissioner), B38 (DOT's Mike Flynn is only quoted), and Health Bucks (the commissioner is only quoted).
- Prenatal leave's "40 hours originally": the governor's release doesn't say it, so it's left out.
- The $500,000 threshold in de Blasio's 2014 pre-K tax: the Chalkbeat text I opened says only "local income tax increase," so the body says that.
- No changes to `nyc-child-care-copays-eliminated`, `nyc-fare-act-broker-fees`, `nyc-health-bucks-snap-produce-match-increase`, or `nyc-rent-freeze-2026`.

**Officials created (11):** `catherine-nolan`, `joseph-addabbo`, `brian-kavanagh`, `linda-rosenthal`, `jessica-ramos`, `latoya-joyner`, `pamela-hunter`, `antonio-reynoso`, `crystal-hudson`, `jessica-tisch`, `sam-levine`. `john-flanagan.yaml` is now unreferenced; I left it in place.

## Future harms list (out of scope for v1)

- **Essential Plan shrink, New York, 2026.** Gov. Kathy Hochul asked Washington to lower Essential Plan eligibility from 250% to 200% of the poverty line, and federal approval came March 20, 2026. That left about 450,000–470,000 New Yorkers, mostly low-wage workers, set to lose coverage starting July 2026. The FY2027 budget did not backfill them, although FPI said a freed-up $2.5B set-aside could have. The cut originates in the 2025 federal reconciliation law (Pub. L. 119-21).
  - Sources: https://fiscalpolicy.org/wp-content/uploads/2026/03/2026.03.23-MK-Statement-on-EP-Approval.pdf and https://www.cityandstateny.com/policy/2026/05/heres-whats-fy-27-new-york-state-budget/413729/.
  - Needs a check on the actual disenrollment count before it's written up. Per the owner, this is recorded here and not in `ny-2026-universal-pre-k`.
