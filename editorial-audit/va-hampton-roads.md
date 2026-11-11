# Editorial audit: Virginia and Hampton Roads entries

Scope: the 15 state entries in `src/content/entries/state/` whose names start `va-` or `hampton-roads-`, and the 3 Hampton Roads local entries in `src/content/entries/local/` (all three are Virginia Beach; no other Hampton Roads locality has an entry yet). That's 18 entries. The standard is the 2026-11-11 `docs/content-guide.md`: the net-impact test, and the credit order of the people who did the work first, executives only for real work, `signed` last.

This is a proposal; no entry files were changed. "Not established" means I looked and couldn't confirm it. A source marked (excerpt) is one I could read only as a search excerpt, because the site blocked a direct fetch.

## Summary

| slug | net impact | credit change | body change | confidence |
|---|---|---|---|---|
| va-2018-medicaid-expansion | keep | reorder (Northam signed→negotiated) | y | med |
| va-2020-license-suspension-unpaid-fines | keep | reorder + add people | y | high |
| va-2020-minimum-wage | keep | reorder | n | high |
| va-2020-no-excuse-absentee-voting | keep | reorder | n | high |
| va-2020-virginia-values-act | keep | reorder | n | high |
| va-2021-death-penalty-abolished | keep | reorder | n | high |
| va-2021-g3-community-college | keep | reorder (Northam signed→proposed, first) | y | high |
| va-2022-grocery-tax-cut | keep + say what it cost | reorder + add people (Northam proposed) | y | med |
| va-2026-farmworkers-minimum-wage | keep | reorder + notes | y | high |
| va-2026-insulin-35-cap | keep | reorder | n | high |
| va-2026-minimum-wage-15 | keep | reorder + notes | y | high |
| va-2026-paid-family-medical-leave | keep | reorder + notes | y | high |
| hampton-roads-coleman-bridge-tolls-end | keep + say what it cost | replace (one Youngkin credit, `proposed`) | y | high |
| hampton-roads-elizabeth-river-tunnels-toll-relief | keep | add people (Don Scott), drop budget patron | y | med |
| hampton-roads-transportation-fund-hrbt | owner's call | reorder (Howell first; fix McDonnell note) | y | med |
| virginia-beach-flood-protection-bond | keep + say what it cost | none | y | med |
| virginia-beach-real-estate-tax-cut-2024 | **retract** | n/a | n/a | high |
| virginia-beach-vehicle-tax-credit-2026 | keep + say what it cost (low impact) | add people (city manager), change council role | y | med |

---

## State: Virginia

### va-2018-medicaid-expansion
- **Net impact: keep.** The state's share is paid by a provider assessment on private hospitals, which by law may be used only for the non-federal share of expansion. Nothing was cut to pay for it. https://budget.lis.virginia.gov/item/2018/2/HB5002/Chapter/3/3-5.15/PDF/
- **Credit now:** ralph-northam `signed` · emmett-hanger `negotiated` · chris-jones `sponsored`
- **Proposed:**
  1. chris-jones `negotiated`: "House Appropriations chair; wrote the House budget with expansion and brokered the final deal."
  2. emmett-hanger `negotiated`: "Republican senator who brokered the Senate compromise."
  3. ralph-northam `negotiated` (instead of `signed`): "Helped broker the compromise with Hanger and Jones."
  - Source: AP, June 7, 2018: the compromise was "brokered by Republican Senator Emmett Hanger … Republican Delegate Chris Jones … and Governor Northam." https://www.washingtontimes.com/news/2018/jun/7/northam-to-sign-budget-medicaid-expansion/ (excerpt)
  - Jones is also chief patron of the whole budget bill, which alone wouldn't earn credit under the new rule. His named role in the deal does.
- **Missing, optional:** Gov. Terry McAuliffe put expansion in his December 2017 introduced budget after four years of trying (AP, same URL). Speaker Kirk Cox moved the House Republicans. Both would be NEW ids (`terry-mcauliffe`, `kirk-cox`). Neither is required.
- **Body:** name Jones and Hanger before Northam in "how it came about," and say the three brokered it. Optionally add McAuliffe's four-year push.
- **Confidence:** med (Northam's negotiating role rests on an AP excerpt).

### va-2020-license-suspension-unpaid-fines
- **Net impact: keep.** It ends a penalty that fell hardest on people who couldn't pay. The lost revenue was about $10M a year in reinstatement fees, and Northam's 2019 amendment used general funds to replace the lost DMV and Trauma Center Fund money, so no service was cut. https://wtvr.com/2019/03/26/northam-budget-amendment-would-end-drivers-license-suspension-over-unpaid-fees/
- **Credit now:** ralph-northam `signed` · bill-stanley `sponsored`
- **Proposed:**
  1. bill-stanley `sponsored`: "Chief patron of SB 1. His 2019 bill (SB 1013) passed the Senate but died in a House subcommittee." Sources: https://legacylis.virginia.gov/cgi-bin/legp604.exe?191+sum+SB1013. A Virginia Mercury column says 2020 was his third straight year carrying it: https://virginiamercury.com/2019/12/16/va-law-that-seizes-licenses-for-unpaid-court-debt-appears-doomed-good-riddance/ (excerpt; medium).
  2. **alfonso-lopez (NEW)** `sponsored`: "Chief patron of HB 1196, the identical House bill (Ch. 964)." https://legacylis.virginia.gov/cgi-bin/legp604.exe?201+sum+HB1196. Bolts names Stanley and Lopez as the two lead sponsors: https://boltsmag.org/virginia-drivers-license-suspensions-court-debt/
  3. ralph-northam `proposed` (instead of `signed`): "Proposed the 2019 budget amendment that first halted these suspensions; signed SB 1." Source: WTVR, above. Stanley thanked Northam "for making my legislation a part of his amendments."
- **Body:** add Lopez. Say Stanley carried it for three sessions, that Northam's 2019 amendment turned Stanley's dead bill into the first halt, and that the state replaced the lost fee money.
- **Confidence:** high (medium only on the "three sessions" count).

### va-2020-minimum-wage
- **Net impact: keep.** It's a wage floor with no fiscal offset, so the net-impact test isn't in play.
- **Credit now:** ralph-northam `signed` · jeion-ward `sponsored` · dick-saslaw `sponsored` · justin-fairfax `tie-breaker`
- **Proposed:**
  1. jeion-ward `sponsored`
  2. dick-saslaw `sponsored`
  3. justin-fairfax `tie-breaker`
  4. ralph-northam `signed`, with an optional note: "His amendments delayed the first raise from Jan. 1 to May 1, 2021." https://vaco.org/county-connections/governor-proposes-amendments-to-legislation-in-advance-of-april-22-reconvened-session/
  - Northam amended the bill. He did not propose it. https://legacylis.virginia.gov/cgi-bin/legp604.exe?201+sum+HB395
- **Missing:** whether Ward or others carried minimum-wage bills before 2020 is not established.
- **Body:** fine as is; it already names Ward and Saslaw first. Optionally say Northam's changes delayed the first step.
- **Confidence:** high.

### va-2020-no-excuse-absentee-voting
- **Net impact: keep.** No fiscal question.
- **Credit now:** ralph-northam `signed` · charniele-herring `sponsored` · janet-howell `sponsored`
- **Proposed:**
  1. charniele-herring `sponsored`
  2. janet-howell `sponsored`
  3. ralph-northam `signed`
  - I found no source that Northam proposed it.
- **Missing:** HB 1 incorporated HB 25, HB 208 and HB 209 (https://legacylis.virginia.gov/cgi-bin/legp604.exe?201+sum+HB1). Those patrons aren't established; check them if you want co-credit.
- **Body:** no change.
- **Confidence:** high.

### va-2020-virginia-values-act
- **Net impact: keep.**
- **Credit now:** ralph-northam `signed` · adam-ebbin `sponsored`
- **Proposed:**
  1. adam-ebbin `sponsored`
  2. ralph-northam `signed`
  - The House bill, HB 1663 (Sickles), died in conference and was not enacted, so it earns no companion credit: https://legacylis.virginia.gov/cgi-bin/legp604.exe?201+sum+HB1663
  - How many years Ebbin carried it is not established; sources say only "years-long."
- **Body:** no change.
- **Confidence:** high.

### va-2021-death-penalty-abolished
- **Net impact: keep.**
- **Credit now:** ralph-northam `signed` (note: called for abolition) · mike-mullin `sponsored` · scott-surovell `sponsored`
- **Proposed:**
  1. mike-mullin `sponsored`
  2. scott-surovell `sponsored`
  3. ralph-northam `signed` (keep the note)
  - The Washington Post says Northam made abolition "a priority," but I found no source that his office drafted or introduced the bills. A speech isn't `proposed` under the new rule.
- **Body:** no change; it already names the patrons first.
- **Confidence:** high.

### va-2021-g3-community-college
- **Net impact: keep.** It's a general-fund program, and I found no offsetting cut. Its 2026–28 funding level is not established; Spanberger proposed expanding it (https://virginiamercury.com/2026/02/24/what-do-the-va-senate-house-proposed-spending-plans-mean-for-higher-education/, excerpt).
- **Credit now:** ralph-northam `signed` · eileen-filler-corn `sponsored` · dick-saslaw `sponsored`
- **Proposed:**
  1. ralph-northam `proposed` (instead of `signed`): "Proposed G3 and funded it in his budget ($145 million, announced Dec. 12, 2019)." https://wtkr.com/2019/12/12/gov-northam-announces-proposal-for-free-community-college/
  2. eileen-filler-corn `sponsored`
  3. dick-saslaw `sponsored`
  - Northam leads because this was his own budget initiative, which the guide lists as an exception.
- **Body:** say G3 was Northam's proposal and that Filler-Corn and Saslaw carried it into law.
- **Confidence:** high.

### va-2022-grocery-tax-cut
- **Net impact: keep + say what it cost.** It's close.
  - **Paid from a record surplus.** Virginia ended FY2021 with "the largest budget surplus in history," and reserves still rose to about $3.8B. https://cardinalnews.org/2022/06/01/general-assembly-approves-budget/
  - **Schools were made whole, permanently.** HB 90 and SB 451 require the state to replace the school money localities lost (https://legacylis.virginia.gov/cgi-bin/legp604.exe?222+sum+HB90). The current budget pays $275.0M in FY2027 and $276.1M in FY2028, split by school-age population: https://budget.lis.virginia.gov/item/2026/2/HB30/Chapter/1/125/
  - **Transportation was not replaced.** Before the cut, the state's 1.5% was 1% for schools and 0.5% for roads and transit. Senate Finance's transportation subcommittee chose not to "backfill any revenues forgone" and cut Commonwealth Transportation Fund revenue by $190.1M over 2022–24: https://budget.lis.virginia.gov/sessionreport/2022/1/2370. The Virginia Mercury reported the final budget did the same, about $189M (excerpt): https://virginiamercury.com/2022/06/01/after-months-of-wrangling-virginia-has-a-budget-deal-whats-in-it/
  - **Who benefits.** A flat grocery-tax cut saves bigger grocery spenders more dollars, and SNAP purchases were already tax-free. But the tax takes a larger share of low earners' income. The Commonwealth Institute favored Northam's package (repeal only the state share, plus a partly refundable EITC) as the targeted option, over Youngkin's broader cuts that left out about 80% of filers earning under $24,000. https://itep.org/the-commonwealth-institute-youngkin-administrations-proposals-would-sharply-reduce-state-resources-largely-exclude-working-families-with-the-lowest-incomes/. The same deal created Virginia's first refundable EITC (15% of the federal credit): https://thecommonwealthinstitute.org/tci_blog/mixed-bag-state-budget-for-upcoming-two-years-has-important-improvements-setbacks-for-racial-justice/
  - **Why it passes.** It's regressive-tax relief from a surplus, with school money replaced by law. The roads-and-transit loss is real and permanent, so the body has to say so. If you weigh bus and road money as heavily as your note suggests, this becomes **owner's call**.
- **Credit now:** glenn-youngkin `signed` (note: "day-one agenda") · joe-mcnamara `sponsored` · jennifer-boysko `sponsored`
- **Proposed:**
  1. joe-mcnamara `sponsored`
  2. jennifer-boysko `sponsored`
  3. ralph-northam `proposed`: "His December 2021 budget proposed repealing the state's 1.5% while keeping the local 1% and replacing school money, the version that passed." The Senate Finance staff summary of his introduced budget lists "Eliminate State Sales Tax on Groceries (368.5)" and "K-12: Hold Harmless Due to Elimination of Grocery Tax 158.0": https://budget.lis.virginia.gov/sessionreport/2022/1/2352. See also https://www.nbcwashington.com/news/politics/first-read-dmv/northam-calls-for-eliminating-states-share-of-grocery-tax/2909631/
  4. glenn-youngkin `signed`, with the "day-one agenda" note dropped (campaigning doesn't count). Optional note: "Sought repeal of the full 2.5% tax, including the local 1%." Per Cardinal News, "Republicans had pushed to repeal the entire tax, but Democrats committed to slashing only the state's 1.5% portion."
  - Whether HB 90 was formally in Youngkin's legislative package is not established. If a source shows it was, he could be `proposed` third, but the enacted design was Northam's, not his.
  - Repeal bills from earlier sessions are not established.
- **Body:** replace the Youngkin-first paragraph. Lead with McNamara and Boysko, say Northam proposed this version, and add the cost: "The state paid for it out of a record surplus, and by law replaces the school money localities lost, about $275 million a year now. It did not replace the share that paid for roads and transit, about $190 million over the first two years."
- **Confidence:** med.

### va-2026-farmworkers-minimum-wage
- **Net impact: keep.**
- **Credit now:** abigail-spanberger `signed` · adele-mcclure `sponsored` · jennifer-carroll-foy `sponsored`
- **Proposed:**
  1. adele-mcclure `sponsored`: "Carried the 2024 (HB 157) and 2025 (HB 1625) versions; Youngkin vetoed both."
     - HB 157: https://legacylis.virginia.gov/cgi-bin/legp604.exe?241+sum+HB157
     - HB 1625, vetoed Mar. 24, 2025: https://open.pluralpolicy.com/va/bills/2025/HB1625
  2. jennifer-carroll-foy `sponsored`
  3. abigail-spanberger `signed`
  - Spanberger's office "worked with the Virginia Farm Bureau to strike a balance" (https://www.whro.org/virginia-government/2026-04-10/virginia-to-raise-minimum-wage-to-15-by-2028-under-new-law). The 2025 bill would also have covered temporary foreign workers; the 2026 law keeps them excluded. That reads as narrowing, not proposing, so she stays `signed`.
- **Body:** say McClure carried it three years running through two vetoes, and that the 2025 version would also have covered guest workers.
- **Data gap:** the entry has no `votes`. The HB 20 and SB 121 roll calls are not established; the new LIS site didn't render for me.
- **Confidence:** high (medium on the HB 1625 patron).

### va-2026-insulin-35-cap
- **Net impact: keep.**
- **Credit now:** abigail-spanberger `signed` · karrie-delaney `sponsored`
- **Proposed:**
  1. karrie-delaney `sponsored`
  2. abigail-spanberger `signed`
  - The governor's release shows signing only: https://www.governor.virginia.gov/newsroom/news-releases/2026/may-releases/name-1117715-en.html
  - A Senate companion is not established. Lee Carter's 2020 $50 cap (HB 66) is background, not credit for this law.
- **Body:** no change.
- **Confidence:** high.

### va-2026-minimum-wage-15
- **Net impact: keep.**
- **Credit now:** abigail-spanberger `signed` · jeion-ward `sponsored` · louise-lucas `sponsored`
- **Proposed:**
  1. jeion-ward `sponsored`: "Carried the 2024 (HB 1) and 2025 (HB 1928) bills Youngkin vetoed."
     - HB 1 (2024), vetoed Mar. 28, 2024: https://legacylis.virginia.gov/cgi-bin/legp604.exe?241+sum+HB1
     - HB 1928 (2025), vetoed Mar. 24, 2025: https://www.whro.org/virginia-government/2025-03-25/youngkin-vetoes-minimum-wage-hike-prescription-affordability-board-bills
  2. louise-lucas `sponsored`: "Carried the 2024 bill (SB 1) Youngkin vetoed." https://legacylis.virginia.gov/cgi-bin/legp604.exe?241+sum+SB1
  3. abigail-spanberger `signed`
  - A 2025 Senate companion is not established.
- **Body:** change "Democrats passed bills … in 2024 and 2025" to name Ward and Lucas as the legislators who carried them, making 2026 Ward's third try.
- **Confidence:** high.

### va-2026-paid-family-medical-leave
- **Net impact: keep.** It's financed by a shared payroll contribution in which small employers pay no employer share. No service is cut.
- **Credit now:** abigail-spanberger `signed` · jennifer-boysko `sponsored` · briana-sewell `sponsored`
- **Proposed:**
  1. jennifer-boysko `sponsored`: "Carried the 2024 bill (SB 373) Youngkin vetoed." https://www.hrdive.com/news/youngkin-virginia-veto-paid-family-medical-leave-bill/712614/ and https://news.bloomberglaw.com/daily-labor-report/youngkin-vetoes-paid-family-medical-leave-mandate-for-virginia
  2. briana-sewell `sponsored`: "Carried the 2025 bill (HB 2531) Youngkin vetoed." https://vadogwood.com/2025/03/25/virginia-is-not-for-workers-youngkin-vetoes-minimum-wage-increase-paid-leave/
  3. abigail-spanberger `signed`
  - Her amendments were accepted Apr. 22, 2026 and were described as largely technical: https://cardinalnews.org/2026/04/22/general-assembly-rejects-more-than-a-dozen-of-spanbergers-amendments/. Campaign support doesn't count.
  - I confirmed SB 373 as Boysko's bill only through news coverage (LIS didn't load); medium confidence on that.
- **Body:** the veto history is already there. Name Boysko and Sewell as the legislators who carried the vetoed bills.
- **Confidence:** high.

---

## State: Hampton Roads

### hampton-roads-coleman-bridge-tolls-end
- **Net impact: keep + say what it cost.**
  - The bond debt was repaid, but the bridge still owed $29.6M to the state's Toll Facility Revolving Account, which would have taken tolls through 2034 to repay. https://www.yahoo.com/news/articles/gov-youngkin-announces-removal-toll-154435669.html
  - The budget wrote that off ("shall not require reimbursement," Item 441 D.2): https://budget.lis.virginia.gov/item/2025/1/HB1600/Introduced/1/441/
  - The same article says officials cited the budget surplus and collection costs (about $3M of roughly $6M a year).
  - No service cut was found. The effect is real but modest: commuters across the York River.
- **Credit now:** glenn-youngkin `signed` · glenn-youngkin `proposed` (a duplicate; the guide forbids both)
- **Proposed:**
  1. glenn-youngkin `proposed` only: "Proposed ending the toll in his December 2024 budget amendments." Youngkin's introduced HB 1600, Item 441 D.1 ("No later than January 1, 2026 … shall cease to be collected"), same URL as above. WHRO confirms: https://www.whro.org/business-growth/2025-08-06/toll-free-at-last-coleman-bridge-to-end-toll-collection-early
  - This is the one entry in scope where Youngkin's `proposed` role is properly sourced.
  - Sen. Danny Diggs, Del. Chad Green, Del. Keith Hodges and Sen. Ryan McDougle only praised it afterward, so none are added. Bills to end the toll in 2024 or 2025 are not established.
- **Body:** change "The state had already paid off the bonds" to add "and the budget forgave about $29.6 million the bridge still owed a state toll fund." Keep Diggs's quote as context.
- **Confidence:** high.

### hampton-roads-elizabeth-river-tunnels-toll-relief
- **Net impact: keep.**
  - It's general-fund spending aimed at drivers earning under $50,000, not a tax cut. I found no offsetting cut.
  - The $36.2M debt payoff went to the private tunnel operator, but the relief went to residents.
  - **Separate status flag:** the 2026–28 budget (Item 441 C.1) has $0 in FY2027 and $24M in FY2028, carries unspent balances forward, and orders VDOT to report by Dec. 1, 2026 on whether ongoing funding is needed (https://budget.lis.virginia.gov/item/2026/2/HB30/Chapter/1/441/). Recheck the status note's "through fiscal year 2036" claim against that.
- **Credit now:** louise-lucas `championed` · luke-torian `sponsored` · glenn-youngkin `signed`
- **Proposed:**
  1. louise-lucas `championed` (keep the note)
  2. don-scott `championed`: "Portsmouth delegate and Speaker; announced the $36 million toll-debt payoff with Lucas." https://www.wtkr.com/transportation/vdot-elizabeth-river-crossings-to-erase-36m-in-toll-debt (medium; he is credited publicly, but his role in winning the money is less documented than Lucas's)
  3. glenn-youngkin `signed`. Move "his 2025 amendments limited the extra rebate … to Norfolk and Portsmouth" out of the credit note and into the body; that narrowing was his amendment (https://budget.lis.virginia.gov/item/2025/1/HB1600/Introduced/1/441/).
  - **Drop luke-torian**, or move him after Scott. He is chief patron of the whole budget bill, and the new rule says to credit the people who won the item, "not just the leaders who passed the whole budget." No source names him on toll relief.
  - No source shows Youngkin proposed any of it.
- **Body:** add Scott. Say the money comes from the state general fund.
- **Confidence:** med.

### hampton-roads-transportation-fund-hrbt
- **Net impact: owner's call.**
  - **For:** the region taxed itself to build the crossing about 100,000 vehicles a day use, much of it commuter traffic. Your own standard says taxes that fund highways are good for workers.
  - **Against:** it's paid with a 0.7% sales tax and a fuel tax, which take a bigger share of low-wage pay. It buys highway lanes, some tolled for solo drivers, and no buses (transit got a separate 2020 fund). The entry's own WHRO source notes that widening often doesn't ease traffic.
  - The headline also names the tax rather than the benefit, and the benefit is still under construction.
- **Credit now:** bob-mcdonnell `proposed` (note: "the version … he sent back with amendments became law") · bill-howell `sponsored`
- **Proposed:**
  1. bill-howell `sponsored`
  2. bob-mcdonnell `proposed`. Fix the note to "Proposed the 2013 statewide transportation funding overhaul; the Hampton Roads regional taxes were added by legislators in conference." Amending a bill isn't proposing it.
  - Whether HB 2313 was formally the governor's bill isn't marked on LIS; medium confidence.
- **Missing:** who wrote the Hampton Roads piece is not established. The Hampton Roads conferees were Del. Chris Jones (exists) and Sen. Frank Wagner (**NEW** `frank-wagner`): https://legacylis.virginia.gov/cgi-bin/legp604.exe?131+sum+HB2313. Add them as `negotiated` only if a source ties them to the regional fund.
- **Body:** if kept, say plainly that everyone who shops or buys gas in the region pays for it. Consider retitling to the benefit (the crossing), not the tax.
- **Confidence:** med.

---

## Local: Virginia Beach

### virginia-beach-flood-protection-bond
- **Net impact: keep + say what it cost.**
  - It's voter-approved flood protection for neighborhoods like Windsor Woods, paid from property tax.
  - **Correction:** the body says repayment would come from "higher real estate taxes … $10 to $14 a month." The city instead "opted to dedicate 4.1¢ of the existing real estate tax rate in lieu of raising taxes" (FY2026-27 Adopted Executive Summary, p. 53): https://s3.us-east-1.amazonaws.com/virginia-beach-departments-docs/budget/Budget/Adopted/FY27/FY27-Adopted-Executive-Summary.pdf
  - The program's estimated cost has nearly doubled, to more than $1B: https://www.yahoo.com/news/cost-build-virginia-beach-flood-213500815.html (Virginian-Pilot syndication, Apr. 2024)
- **Credit now:** virginia-beach-city-council `proposed` · bobby-dyer `championed`
- **Proposed:** no change. Which council members led putting it on the ballot is not established.
- **Body:** replace the pre-vote tax estimate with how it's actually paid (4.1¢ of the existing rate) and note the cost growth.
- **Confidence:** med.

### virginia-beach-real-estate-tax-cut-2024
- **Net impact: retract.** It fails both "these fail" tests: "relief that mostly goes to owners," and "a property-tax rate cut paired with higher flat fees."
  - **The cut.** The City Manager's proposed budget set the rate at 97¢, "a reduction of 2¢." Each cent is worth about $7.8M, so about $15.7M a year. The cut goes to every owner of real estate, including landlords and commercial owners, in proportion to value.
  - **The fee.** The same budget raised the waste collection fee from $27.50 to $30.55 a month, +$36.60 a year. The ordinance charges it "to each occupied dwelling unit eligible for … City trash collection," billed with water and sewer on the City Services Bill.
    - Source for both: FY2024-25 Proposed Operating Budget, rate text and amended City Code § 31-39: https://interactive.13newsnow.com/pdfs/virginia-beach-FY25-Proposed-City-Operating-Budget.pdf
    - Current fee: https://pw.virginiabeach.gov/trash-recycling/customer-service
  - **Who pays the fee.** It's charged per occupied household with city pickup, owner or renter. State law lets tenants hold the water/sewer account the fee rides on (Va. Code § 15.2-2119.4, https://law.lis.virginia.gov/vacode/15.2-2119.4). So a renter in a city-served house or townhouse pays it directly or through rent. Apartment complexes with private haulers generally aren't city-served: https://wydaily.com/latest/local/2017/06/26/why-is-it-so-hard-for-southside-apartment-dwellers-to-recycle-news/ (2017; medium).
  - **Typical household.** The median assessment was $347,700, up 6.4%. The cut saves that owner $69.54 a year, but the bill still rose about $138 because the assessment rose. A renter household with city pickup gets no direct cut and pays $36.60 more. The cut only covers the fee on homes assessed above about $183,000, and a $1M property saves $200.
  - **Fairness note.** The fee increase paid for a recycling contract whose cost doubled; it didn't fund the tax cut. But the test looks at what the action did as a whole. The city's own FY2026-27 summary says rate cuts "only directly benefit homeowners and business owners, not individuals who rent," and that 53.3% of Virginia Beach renters are cost-burdened against 24.2% of homeowners (Executive Summary, p. 57).
- **Credit:** moot if retracted. If kept, the proposer was the City Manager (see `patrick-duhaney` below), not the council.
- **Confidence:** high on the numbers. Medium on how many renters hold the City Services Bill in their own name.

### virginia-beach-vehicle-tax-credit-2026
- **Net impact: keep + say what it cost.** Flag as low impact.
  - **Cost and funding.** The one-time credit costs $12.8M. It's paid from better-than-expected real estate revenue: the city kept the rate at 97¢ while assessments rose about 6%, "especially in multifamily properties," and that extra revenue "is offset largely by the Personal Property Tax credit." (FY2026-27 Adopted Executive Summary, pp. 53, 57, 60; URL above)
  - **No offsetting cuts.** I found no service cut tied to it. The 52.75 school positions cut came "primarily from the conclusion of federal grants." The monthly trash fee was unchanged, though small fees rose: bin replacement from $75 to $100, plus yard-debris rentals and parks fees.
  - **Who benefits.** It reaches renters, which is why the city chose it. Households without a car get nothing.
  - **Size.** The average credit is **$48 per vehicle** at the city's average car value of $11,913 (p. 57), not the $80 on the sign. It's real, but small and one-time.
- **Credit now:** virginia-beach-city-council `voted-yes`
- **Proposed:**
  1. virginia-beach-city-council `led`: "At its 2026 retreat, directed staff to find relief reaching the most residents; adopted 11–0." The Executive Summary says retreat guidance preferred relief "afforded to the highest number of residents."
  2. **patrick-duhaney (NEW, NP, City Manager)** `proposed`: "Put the credit in his proposed budget." https://virginiabeach.gov/connect/blog/city-managers-proposed-budget-presented-to-city-council
  - Councilman Joash Schulman spoke for it but isn't documented as its originator.
  - He is an appointed executive, so whether the site credits city managers is a policy call; see Patterns.
- **Body/dek:** add the funding sentence, "Paid for with higher-than-expected real estate revenue as assessments rose, with the tax rate held at 97 cents." Give the typical credit ($48 a car), not only the maximum.
- **Confidence:** med.

---

## Patterns

1. **The signer comes first in all 12 `va-` entries.** Every Virginia legislation entry lists the governor's `signed` credit first, making him the byline. Moving `signed` last fixes most of them mechanically. Only `hampton-roads-elizabeth-river-tunnels-toll-relief` already leads with the legislator.
2. **Executive credit is wrong in both directions.**
   - Under-credited real work: Northam proposed G3, the enacted version of the grocery-tax cut, and the 2019 license-suspension halt, and he helped broker Medicaid expansion. Youngkin proposed the Coleman toll repeal.
   - Over-credited campaigning: Youngkin's "day-one agenda" note on the grocery tax.
   - Fix these in both directions with the sources above, so the site isn't open to a charge of partisan credit.
3. **The vetoed-before-passing history is missing from credit notes.** Ward and Lucas (minimum wage), Boysko and Sewell (paid leave), and McClure (farmworkers) each carried bills Youngkin vetoed in 2024 and/or 2025. The bodies mention the vetoes but not who kept bringing the bills back, which is exactly the work the new rule wants credited.
4. **Whole-budget patrons get item credit.** Torian (HB 6001) and Jones (HB 5002) appear as `sponsored` because they carried the whole budget. Keep only those a source ties to the specific item; Jones qualifies, Torian doesn't.
5. **Tax relief is framed against rising assessments.** Both Virginia Beach tax entries present "relief" in years when the median owner's bill still rose. Real estate rate cuts mostly reach owners, and in 2024 a flat fee rose on renters' households too. The city's own 2026 analysis makes the renter point. Use it as the standard for future local tax entries: name who pays, who gets it, and what the typical household nets.
6. **"How it was paid for" was missing everywhere it mattered.** Grocery tax, Coleman Bridge, the flood bond and the vehicle credit all need a financing sentence. In two cases the current text is incomplete or out of date: the Coleman "bonds paid off" line, and the flood bond's tax-increase estimate.
7. **Local credit rests on bodies or appointed managers.** Virginia Beach entries credit "City Council" with `voted-yes`, while the documented proposer is often the appointed City Manager. The guide has no rule for appointed executives. Decide whether a city manager gets an official file (NP, no seat), or whether the council's direction is credited as `led`.
8. **Filler and balance check.** None of these entries looks added to balance the parties; the Republican-credited ones (Stanley's license law, Hanger and Jones on Medicaid, McNamara on groceries, Youngkin on Coleman) are real work. The low-impact ones are the two Virginia Beach tax items: one fails, and one is about $48 a car once. A stronger worker-facing Hampton Roads candidate, if wanted, is the 2020 Hampton Roads Regional Transit Fund (HB 1726, chief patron Del. Alex Askew): https://legacylis.virginia.gov/cgi-bin/legp604.exe?201+sum+HB1726

### NEW official ids this audit would need
- `alfonso-lopez`: Virginia delegate in 2020; he is in `src/data/roster/state-va.json`, so his openstates id is available.
- `patrick-duhaney`: Virginia Beach City Manager, NP, appointed.
- Optional: `terry-mcauliffe`, `kirk-cox`, `frank-wagner`.
