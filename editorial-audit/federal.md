# Editorial audit: federal entries (22)

Proposal only. No entry or official file has been edited. This audit checks the entries against `docs/content-guide.md` as updated 2026-11-11: the worker point of view, the net-impact test, and the new credit order.

**Sourcing.**
- Every claim below has a URL, or says it comes from the entry's own cited sources, or is marked **could not confirm** with what was tried.
- cbo.gov and congress.gov block automated fetching. Where CBO is the authority, I cite CRS, CRFB, or an SSA or agency page that reports the CBO number.
- "NEW" means the official id doesn't exist yet in `src/content/officials/`.

## Summary

| slug | net impact | credit change | body change | confidence |
|---|---|---|---|---|
| 988-suicide-crisis-lifeline | keep | reorder + add people | y | high |
| aca-enhanced-premium-tax-credits | keep + say what it cost | reorder + add people | y | high |
| airline-automatic-refunds | keep | add people + change Biden's role | n | high |
| cares-act-relief-payments | keep + say what it cost | add people (only credit is the signer) | y | high |
| expanded-child-tax-credit-2021 | keep + say what it cost | reorder + add people | y | high |
| first-step-act | keep | reorder + add people | y | high |
| hampton-fort-monroe-national-monument | owner's call (low direct worker impact) | add people | y | high |
| medicare-drug-price-negotiation | keep | reorder + add people | y | high |
| medicare-insulin-35-cap | keep | reorder + add people | y | high |
| medicare-part-d-out-of-pocket-cap | keep | reorder + add people | y | high |
| medicare-telehealth-through-2027 | keep | reorder + add people | y | med-high |
| newport-news-marshall-ridley-choice-neighborhoods | keep | reorder | y | med |
| no-surprises-act-medical-bills | keep | reorder | n | high |
| no-tax-on-tips-and-overtime | **retract** | n/a | n/a | high |
| norfolk-coastal-storm-risk-management | keep | reorder | y (minor) | high |
| norfolk-st-pauls-choice-neighborhoods | owner's call (lean keep only with full disclosure) | reorder | y (major) | high on facts, owner on verdict |
| over-the-counter-hearing-aids | keep | reorder + add people | y (minor) | high |
| pact-act-veterans-toxic-exposure | keep | reorder (+ optional adds) | n (optional) | high |
| respect-for-marriage-act | keep | reorder + add people | y (minor) | high |
| social-security-fairness-act | keep + say what it cost | reorder | y | high |
| take-it-down-act | keep | reorder | n | high |
| trump-accounts-1000-for-newborns | **retract** | n/a | n/a | high |

---

## 988-suicide-crisis-lifeline

1. **Net impact: keep.**
   - The law creates a public crisis service.
   - The only financing piece is optional state 988 fees on phone bills, which can only be spent on 988 services (see the law text in the entry's sources).
   - Nothing was cut to pay for it.
2. **Credit.**
   - Current: donald-trump (signed), cory-gardner (sponsored), tammy-baldwin, jerry-moran, jack-reed (cosponsored).
   - Proposed:
     1. cory-gardner, sponsored
     2. chris-stewart **NEW**, championed. Started the push with Sen. Orrin Hatch in 2017. His 2018 National Suicide Hotline Improvement Act, which ordered the FCC study that led to 988, became law (https://kutv.com/news/local/rep-chris-stewarts-national-suicide-hotline-bill-heads-to-presidents-desk). He also introduced the House companion, H.R. 4194.
     3. seth-moulton **NEW**, cosponsored. Lead Democrat on H.R. 4194 (https://moulton.house.gov/news/press-releases/moulton-stewart-introduce-bill-designate-9-8-8-suicide-hotline-dialing-code).
   - H.R. 4194 never passed the House; the law is Gardner's S. 2661 (https://www.govinfo.gov/bulkdata/BILLSTATUS/116/hr/BILLSTATUS-116hr4194.xml). So Stewart is credited for the 2018 law and the push, Moulton for the House co-lead.
     4. tammy-baldwin, cosponsored
     5. jerry-moran, cosponsored
     6. jack-reed, cosponsored
     7. donald-trump, signed
   - Stewart arguably did more of the work than Gardner, over 2017–2020. Owner's call whether he goes first.
   - The full FCC adopted 988 by a unanimous vote in July 2020 (Report and Order FCC 20-100), three months before the law. Since that was a Commission vote, not one official's order, I don't recommend adding `ajit-pai`. Mention the FCC in the body instead.
3. **Body:** Add Stewart and Moulton, and say it took three years from the 2017 start and the 2018 law that ordered the FCC study.
4. **Confidence:** high.

## aca-enhanced-premium-tax-credits

1. **Net impact: keep + say what it cost.**
   - These are income-based credits, not paid for with service cuts.
   - The American Rescue Plan (ARPA) was emergency relief that added about $1.856T to deficits over FY2021–2030, with no offsets (CBO, as reported by CRS: https://www.everycrsreport.com/files/2025-06-12_IN12564_6c78b3123624337582c2473c137fbbb358008079.html).
   - The Inflation Reduction Act's (IRA) three-year extension cost about $64B. The IRA paid for it, and more, with a 15% corporate minimum tax ($222B), IRS enforcement (about $101B net), a 1% stock-buyback tax ($74B) and Medicare drug savings ($281B). CBO via CRFB: https://www.crfb.org/blogs/cbo-scores-ira-238-billion-deficit-reduction
   - Suggested sentence: "The 2021 law was emergency relief paid for by borrowing; the 2022 extension was paid for mainly by new taxes on large corporations and lower Medicare drug prices."
2. **Credit.**
   - Current: joe-biden (signed), john-yarmuth (sponsored).
   - Proposed:
     1. lauren-underwood **NEW**, championed. Her Health Care Affordability Act was "included in President Biden's American Rescue Plan" (https://underwood.house.gov/media/press-releases/underwoods-health-care-affordability-act-included-president-bidens-american). In May 2022 she led 26 swing-district Democrats asking leadership to extend it (https://underwood.house.gov/media/press-releases/underwood-leads-swing-district-democratic-members-letter-leadership-advocating).
     2. jeanne-shaheen **NEW**, championed. Her own Improving Health Insurance Affordability Act fed ARPA (https://www.shaheen.senate.gov/news/press/shaheen-helps-secure-biggest-improvement-to-aca-in-a-decade-as-covid-19-relief-legislation-becomes-law). She called the IRA extension "my provisions" (https://www.shaheen.senate.gov/news/press/breaking-shaheen-helps-senate-pass-historic-legislation-to-reduce-inflation-and-prioritize-middle-class-families).
     3. joe-biden, **proposed** (replaces `signed`). His American Rescue Plan proposal said it would "expand and increase the value of the Premium Tax Credit" so enrollees "will not pay more than 8.5 percent of their income" (https://bidenwhitehouse.archives.gov/briefing-room/legislation/2021/01/20/president-biden-announces-american-rescue-plan).
     4. john-yarmuth, sponsored. Note: "Sponsored H.R. 1319 as Budget Committee chair." He carried the vehicle, not this policy.
   - Correction to my first draft: Shaheen's 2021 bill was her own, not a Senate version of Underwood's. The two co-introduced a joint bill only in 2024.
3. **Body:** The last paragraph currently says "Democrats passed... Biden signed." Lead it with Underwood and Shaheen, then Biden's proposal, and add the financing sentence.
4. **Confidence:** high.

## airline-automatic-refunds

1. **Net impact: keep.**
   - Airlines bear the cost: consumer protection against owners.
   - Status check: the Trump DOT opened a "Refund III" rulemaking (RIN 2105-AF36, Sept. 2025 Unified Agenda) to narrow what counts as a cancellation. As of July 2026 no proposed rule had been published (https://www.cozen.com/news-resources/publications/2026/dot-signals-deregulatory-shift-for-aviation-consumer-protection).
   - That's not yet a "specific, active effort" under the guide's `under-threat` test. If a proposed rule appears, switch the status to `under-threat`. For now, add one line to the status note.
2. **Credit.**
   - Current: pete-buttigieg (issued), joe-biden (signed, FAA Reauthorization Act of 2024).
   - Proposed:
     1. pete-buttigieg, issued
     2. maria-cantwell **NEW**, negotiated. As Commerce chair and lead negotiator, she wrote the FAA bill's final refund language in a managers' amendment (https://www.cantwell.senate.gov/news/press-releases/cleared-for-take-off-major-aviation-bill-heads-to-president-bidens-desk ; https://skift.com/2024/05/07/automatic-refunds-makes-it-into-senate-bill-after-much-debate).
     3. joe-biden, **proposed** (replaces `signed`). Executive Order 14036, sec. 5(m), directed DOT to propose rules requiring refunds of bag fees for substantially delayed bags and of fees for paid services not provided (https://www.govinfo.gov/content/pkg/FR-2021-07-14/html/2021-15069.htm). Note: "Ordered the bag-fee and extras refund rule in a 2021 executive order; signed the FAA Reauthorization Act of 2024."
   - Markey, Blumenthal and Warren pushed automatic-refund amendments (https://www.markey.senate.gov/news/press-releases/senators-markey-warren-and-blumenthal-file-amendment-to-faa-bill-requiring-automatic-refunds-for-cancelled-and-delayed-flights). Optional; the work that landed in law was Cantwell's.
3. **Body:** Optional. Name Cantwell in the sentence about the FAA Act.
4. **Confidence:** high.

## cares-act-relief-payments

1. **Net impact: keep + say what it cost.**
   - Flat rebates that phased out at $75k/$150k, aimed at low- and middle-income households.
   - Paid for by borrowing: CBO put the whole act at about $1.8T in added deficits over 2020–2030 (CBO via Legistorm: https://legistorm.com/reports/view/cbo/19187/CARES_Act_Public_Law_116_136.html).
   - No services were cut, and the act also expanded unemployment benefits.
   - Suggested sentence: "Congress paid for it by borrowing, as emergency relief."
2. **Credit.**
   - Current: donald-trump (signed), **only**. Under the new rule the entry "isn't finished."
   - Proposed:
     1. chuck-grassley, led. As Finance chair he wrote the rebate language, released with Sens. Thune, Tim Scott, Portman and Romney (https://www.finance.senate.gov/chairmans-news/senators-recommend-tax-policies-for-phase-3-coronavirus-response ; https://www.finance.senate.gov/chairmans-news/grassley-releases-phase-3-coronavirus-response-legislation).
     2. mitch-mcconnell **NEW**, led. Introduced the CARES Act text, S. 3548, on March 19, 2020 (same Finance links).
     3. steven-mnuchin **NEW**, negotiated. Treasury floated direct checks on March 17–18 (https://www.clickondetroit.com/news/2020/03/18/treasury-wants-to-send-checks-to-americans-starting-april-6/), and he negotiated the final deal.
     4. chuck-schumer, negotiated. He and Mnuchin negotiated the final terms with McConnell (AP via https://www.csmonitor.com/layout/set/amphtml/USA/Politics/2020/0325/White-House-Senate-agree-on-historic-2-trillion-rescue-bill).
     5. Optional: josh-hawley **NEW** and mitt-romney **NEW**, championed. Both pushed to give low-income people the full amount instead of the first draft's $600 floor and $2,500 income minimum (https://www.hawley.senate.gov/sen-hawley-announces-amendment-fix-phase-3-legislation-provide-direct-relief-all-individuals/ ; https://sltrib.com/news/politics/2020/03/16/sen-mitt-romney-proposes). The final law dropped the floor (https://www.everycrsreport.com/files/20200326_IN11270_04aa8783a8e48dd31756711766603497145c5299.html).
     6. donald-trump, signed
   - Removed from my first draft: Nancy Pelosi. I could not confirm a specific role in the payments; the final deal was Senate-negotiated.
   - Could not confirm that Schumer specifically won the full-$1,200 change. Treat that as bipartisan pressure.
   - H.R. 748 (Courtney) was a shell vehicle; don't credit it.
3. **Body:** Name the authors and negotiators before the signer, and add the financing line.
4. **Confidence:** high.

## expanded-child-tax-credit-2021

1. **Net impact: keep + say what it cost.**
   - Fully refundable for 2021 and aimed at low- and middle-income families.
   - Paid for by ARPA's borrowing (see the CRS link in the ACA entry), not service cuts.
   - It's a tax credit, so one financing sentence keeps it consistent with the new test.
2. **Credit.**
   - Current: joe-biden (signed), john-yarmuth (sponsored), rosa-delauro (championed).
   - Proposed:
     1. rosa-delauro, championed. Has pushed the idea since 2003 (https://ctmirror.org/2021/02/08/two-decades-in-the-making-rosa-delauros-plan-to-cut-child-poverty-in-half-is-on-the-brink-of-passing/). ARPA's credit was "modeled after the American Family Act" (https://delauro.house.gov/media-center/press-releases/delauro-delbene-torres-welcome-president-s-support-permanently-expanding).
     2. michael-bennet **NEW**, championed. Co-author of the American Family Act with Sherrod Brown since 2017 (https://www.bennet.senate.gov/child-tax-credit).
     3. sherrod-brown, championed. Same source.
     4. suzan-delbene **NEW**, championed. House co-lead (DeLauro release above).
     5. Optional: ritchie-torres **NEW** (2021 House co-lead) and cory-booker **NEW** (Senate co-author). Same sources.
     6. joe-biden, **proposed** (replaces `signed`). His plan would "increase the credit to $3,000 per child ($3,600 for a child under age 6)" and make it fully refundable (https://bidenwhitehouse.archives.gov/briefing-room/legislation/2021/01/20/president-biden-announces-american-rescue-plan).
     7. john-yarmuth, sponsored. Vehicle, as Budget chair.
3. **Body:** Lead with DeLauro (nearly two decades), Bennet and Brown, then Biden's proposal, and add the financing line.
4. **Confidence:** high.

## first-step-act

1. **Net impact: keep.**
   - No cost to working people.
   - Shorter sentences and a path home: 69,649 people released, according to BOP (in the entry's sources).
   - A rights entry rather than a pocketbook one, but real. Not filler.
2. **Credit.**
   - Current: donald-trump (signed), chuck-grassley (led), dick-durbin (led), doug-collins (sponsored), hakeem-jeffries (cosponsored).
   - Proposed:
     1. john-cornyn **NEW**, led
     2. sheldon-whitehouse **NEW**, led. "Whitehouse and Cornyn authored First Step provisions establishing recidivism reduction programs to allow qualifying inmates to receive reductions to their sentences through time credits" (https://www.whitehouse.senate.gov/news/release/whitehouse-and-cornyn-applaud-new-bureau-of-prisons-rule-adopting-their-input-on-first-step-act-anti-recidivism-measure). That is the entry's headline benefit.
     3. doug-collins, sponsored. The House FIRST STEP Act, H.R. 5682, passed the House 360-59 in May 2018 (https://www.govinfo.gov/bulkdata/BILLSTATUS/115/hr/BILLSTATUS-115hr5682.xml).
     4. hakeem-jeffries, change to `led`. Co-lead of H.R. 5682.
     5. chuck-grassley, led
     6. dick-durbin, led. Senate deal and sentencing reforms (S. 3747).
     7. Optional: mike-lee **NEW**, cory-booker **NEW** and lindsey-graham **NEW**, negotiated. With Grassley, Durbin and Whitehouse they unveiled the revised Senate bill on Nov. 15, 2018 (https://www.grassley.senate.gov/news/news-releases/senators-unveil-revised-bipartisan-prison-sentencing-legislation).
     8. donald-trump, signed
   - About Cornyn: he was not in that Nov. 2018 group. But Whitehouse and Cornyn first introduced their CORRECTIONS Act in 2013 (https://www.whitehouse.senate.gov/news/release/whitehouse-cornyn-introduce-bipartisan-prison-reform-bill), and Cornyn introduced the Senate companion to H.R. 5682 (S. 2795).
   - About Trump: he endorsed the Senate deal on Nov. 14, 2018, after Jared Kushner's long push (https://www.npr.org/2018/12/17/676771335/how-trump-went-from-tough-on-crime-to-second-chance-for-felons). McConnell then scheduled the vote "at the request of the president" (https://www.pbs.org/newshour/politics/facing-pressure-mitch-mcconnell-agrees-to-criminal-justice-vote). That's more than not blocking it, but it isn't proposing, negotiating or issuing.
   - **Owner's call:** keep Trump as `signed` (my recommendation), or add a note "Pressed the Senate leader to hold a vote." Adding `jared-kushner` **NEW** (`championed`) is also the owner's call; he was an unelected adviser.
3. **Body:** Say the earned-time credits came from Cornyn and Whitehouse's prison-reform bill, first introduced in 2013, and the House bill by Collins and Jeffries. Keep Trump's endorsement, after the legislators.
4. **Confidence:** high.

## hampton-fort-monroe-national-monument

1. **Net impact: owner's call.**
   - For: it keeps former Army land in public hands and open to the public after the base closed, at no cost to workers.
   - Against: the effect on working people's daily lives is small. Its one topic is `education`, and it reads more like Hampton Roads coverage than "government did something for you."
2. **Credit.**
   - Current: barack-obama (issued). Correct, since he issued the proclamation himself.
   - Proposed:
     1. barack-obama, issued
     2. jim-webb **NEW**, sponsored. Introduced S. 1303, the Fort Monroe National Historical Park Establishment Act, with Warner on June 29, 2011 (https://www.warner.senate.gov/public/index.cfm/2011/6/webb-warner-file-legislation-creating-ft-monroe-nat-l-park).
     3. mark-warner, cosponsored. Same source.
     4. scott-rigell **NEW**, sponsored. Sponsored the House companion, H.R. 2456 (https://legiscan.com/US/bill/HB2456/2011). Correction: I first attributed this to Bobby Scott, who was a cosponsor.
     5. bob-mcdonnell, championed. His Sept. 9, 2011 letter is cited in the proclamation (https://www.nps.gov/legal/upload/laws/112th/Proclamations/proc8750_fortmonroe_Redacted.pdf).
     6. Optional: bobby-scott, cosponsored
     7. Optional: ken-salazar **NEW**, championed. As Interior Secretary he backed protection (https://www.doi.gov/news/pressreleases/Salazar-Highlights-Strong-Local-State-Support-for-Historic-Preservation-of-Fort-Monroe-on-the-Occasion-of-its-Deactivation).
3. **Body:** Add one sentence: Webb, Warner and Rigell had bills to make it a park, and Gov. McDonnell asked for the designation.
4. **Confidence:** high.

## medicare-drug-price-negotiation

1. **Net impact: keep.**
   - Drugmakers bear the cost.
   - The IRA's drug provisions save Medicare $281B, about $96B of it from negotiation, and the law raised its other revenue mainly from large corporations (CRFB link above).
   - No benefits were cut. No financing sentence needed.
2. **Credit.**
   - Current: joe-biden (signed), kamala-harris (tie-breaker), chuck-schumer (negotiated). **joe-manchin and john-yarmuth are missing here but credited on the two sibling IRA entries.**
   - Proposed:
     1. amy-klobuchar, championed. The IRA "includes provisions based on a bill that I've led in the Senate for years" (https://www.klobuchar.senate.gov/public/index.cfm/2022/8/klobuchar-statement-on-senate-passage-of-inflation-reduction-act).
     2. peter-welch **NEW**, championed. House lead of the companion bill (https://www.klobuchar.senate.gov/public/index.cfm/2021/3/klobuchar-welch-introduce-legislation-to-cut-prescription-drug-costs-for-seniors).
     3. frank-pallone, championed. Sponsored H.R. 3, which passed the House 230-192 in Dec. 2019 (https://democrats-energycommerce.house.gov/newsroom/press-releases/pallone-praises-house-passage-of-lower-drug-costs-now-act).
     4. ron-wyden **NEW**, championed. Finance chair. His Nov. 2021 statement says Finance's inflation-rebate policy and the Part D redesign were in the deal (https://www.finance.senate.gov/chairmans-news/wyden-statement-on-drug-pricing-agreement). I could not confirm he wrote the negotiation title itself.
     5. chuck-schumer, negotiated
     6. joe-manchin, negotiated
     7. john-yarmuth, sponsored. Vehicle.
     8. kamala-harris, tie-breaker
     9. joe-biden, signed. Manchin said "President Biden was not involved," and White House officials were "intentionally not directly involved" (CNN via https://kvia.com/politics/cnn-us-politics/2022/07/28/how-secret-negotiations-revived-joe-bidens-agenda-and-shocked-washington/). Staff kept channels open (https://www.nbcnews.com/politics/congress/democrats-surprise-climate-health-care-bill-came-together-months-setba-rcna42646), but `proposed` and `negotiated` don't fit, so `signed`, last.
   - Corrections to my first draft:
     - Nancy Pelosi did not sponsor H.R. 3 (Pallone did). She unveiled and promoted it; she's optional as `championed`.
     - Lloyd Doggett pushed negotiation for years (https://doggett.house.gov/media/press-releases/comprehensive-negotiation-bill-stop-prescription-price-gouging), but I could not confirm his bill shaped the IRA. Optional.
   - Sinema narrowed negotiation (https://www.news4jax.com/news/politics/2022/08/05/sinema-gives-her-nod-and-influence-to-democrats-big-bill/). That's not credit for the benefit; leave her out.
3. **Body:** Replace "Democrats passed... Harris broke the tie... Biden signed" with Klobuchar, Welch and Pallone's years of bills, then the Schumer–Manchin deal, then the tie-break and the signature.
4. **Confidence:** high.

## medicare-insulin-35-cap

1. **Net impact: keep.** Same IRA financing; no cuts.
2. **Credit.**
   - Current: joe-biden (signed), john-yarmuth (sponsored), kamala-harris (tie-breaker), chuck-schumer, joe-manchin (negotiated).
   - Proposed:
     1. raphael-warnock **NEW**, championed. Affordable Insulin Now Act, S. 3700; he calls the cap "my provision" (https://www.warnock.senate.gov/newsroom/press-releases/this-measure-will-save-lives-senator-reverend-warnock-celebrates-his-35-medicare-insulin-cost-cap-taking-effect-lowering-insulin-costs-for-over-50000-georgians/).
     2. angie-craig **NEW**, sponsored. H.R. 6833 passed the House 232-193 on March 31, 2022 (https://clerk.house.gov/evs/2022/roll102 ; https://craig.house.gov/media/press-releases/house-passes-representative-angie-craigs-bill-cap-insulin-copays-35-month).
     3. Optional: jeanne-shaheen **NEW** and susan-collins, championed. Their bipartisan INSULIN Act (https://rollcall.com/2022/06/22/senators-release-bill-targeting-insulin-prices/).
     4. chuck-schumer, negotiated
     5. joe-manchin, negotiated
     6. john-yarmuth, sponsored
     7. kamala-harris, tie-breaker
     8. joe-biden, signed
3. **Body:**
   - Name Warnock and Craig first.
   - For accuracy, add that a voluntary Trump-era CMS pilot (Part D Senior Savings Model) offered $35 insulin in participating enhanced plans from 2021, and the IRA made the cap universal in 2023 (https://www.cms.gov/newsroom/press-releases/cms-launches-groundbreaking-model-lower-out-pocket-expenses-insulin). This is history, not balance.
   - Optional: note that the cap for private insurance was dropped in the Senate.
4. **Confidence:** high.

## medicare-part-d-out-of-pocket-cap

1. **Net impact: keep.** Same IRA financing.
   - I dropped my first draft's aside about Part D premiums; I did not check it and it isn't needed for the verdict.
2. **Credit.**
   - Current: joe-biden (signed), john-yarmuth (sponsored), kamala-harris (tie-breaker), chuck-schumer, joe-manchin (negotiated).
   - Proposed:
     1. ron-wyden **NEW**, championed. Co-wrote the bipartisan 2019 Grassley–Wyden bill, which capped out-of-pocket costs at $3,100 (https://www.finance.senate.gov/chairmans-news/grassley-wyden-op-ed-congress-can-act-now-to-lower-drug-prices). His Nov. 2021 statement ties the Finance Committee to the IRA redesign and the $2,000 cap.
     2. frank-pallone, championed. His H.R. 3 (2019) set the $2,000 cap level (https://www.kff.org/medicare/issue-brief/potential-savings-for-medicare-part-d-enrollees-under-proposals-to-add-a-hard-cap-on-out-of-pocket-spending/).
     3. chuck-schumer, negotiated
     4. joe-manchin, negotiated
     5. john-yarmuth, sponsored
     6. kamala-harris, tie-breaker
     7. joe-biden, signed
   - Grassley co-wrote the 2019 cap but voted against the IRA. Mention him in the body, not in the credits (owner's call).
3. **Body:** Add that the cap grew out of a bipartisan 2019 Senate Finance bill (Grassley–Wyden, $3,100) and H.R. 3's $2,000 cap.
4. **Confidence:** high.

## medicare-telehealth-through-2027

1. **Net impact: keep.**
   - A full-year funding law that didn't cut beneficiary services. It also did not revive the ACA credits, but that's a missing benefit, not a cut.
   - Its PBM reforms cut the deficit by about $2.18B over 10 years (CBO via https://paragoninstitute.org/paragon-prognosis/the-2026-health-care-extenders-summary-and-analysis/).
   - Trade press reports the other offsets as an extension of Medicare's provider sequester and use of the Medicare Improvement Fund. **Could not confirm** the amounts: the CBO estimate for H.R. 7148 is blocked to automated fetch.
   - Those offsets fall on providers and middlemen, not enrollees.
2. **Credit.**
   - Current: donald-trump (signed), tom-cole (sponsored).
   - Proposed:
     1. brian-schatz **NEW**, championed. "Authored the telehealth provision"; has led the CONNECT for Health Act since 2016 (https://www.schatz.senate.gov/news/press-releases/senate-passes-schatz-measure-to-extend-medicare-telehealth-coverage-for-additional-two-years).
     2. roger-wicker **NEW**, championed. Republican co-lead of the CONNECT for Health Act (https://www.wicker.senate.gov/2024/12/senators-wicker-schatz-lead-group-of-100-lawmakers-in-calling-for-extension-of-telehealth-expansion).
     3. Optional: mark-warner, cosponsored. A search snippet of a Hyde-Smith release lists him among the bill's bipartisan leads; I did not open the release.
     4. tom-cole, sponsored. Vehicle, as Appropriations chair.
     5. donald-trump, signed
3. **Body:** Name Schatz and Wicker, with their decade-long push, before the vote and the signer.
4. **Confidence:** med-high.

## newport-news-marshall-ridley-choice-neighborhoods

1. **Net impact: keep.** I checked it more closely than St. Paul's after that review.
   - HUD's approved plan replaces **all 259** public housing units one-for-one, inside 487 mixed-income homes (133 moderate-income, 98 market-rate) (https://archives.hud.gov/news/2019/FY18_Grant_Project_Summaries.pdf).
   - **Could not confirm** how many replacement units have actually been delivered so far. Neither the NNRHA board report nor 2025 coverage gives a delivered count.
   - Returns are low:
     - 249 families relocated, and 15 had moved into the 30 units reserved at The Lift & Rise by June 2023 (https://www.whro.org/2023-06-15/ridley-circle-residents-begin-return-to-southeast-newport-news-as-redevelopment-continues).
     - About 35 of roughly 200 former households had signed on for Legacy Landing by June 2025 (https://www.whro.org/local-government/2025-06-05/newport-news-adds-155-mixed-income-housing-units-to-its-southernmost-neighborhood).
   - An unsourced local wiki says a work requirement keeps former residents out. I found no reporting to back it.
   - One-for-one hard replacement passes the test. Low return is a fact readers should see.
2. **Credit.**
   - Current: ben-carson (issued), newport-news-city-council (implemented).
   - Proposed:
     1. newport-news-city-council, implemented. Co-applicant; funds implementation.
     2. Optional: newport-news-redevelopment-and-housing-authority **NEW** (`kind: body`), implemented. Lead applicant.
     3. ben-carson, issued. A competitive award chosen by HUD staff; his note says only that he "announced" it.
   - **Could not confirm** any member of Congress credited with the application; 2019 coverage quotes only Carson.
3. **Body:**
   - The last sentence leads with Carson; lead with the city and NNRHA instead.
   - Add the return numbers, e.g. "About 50 former Ridley households had moved or signed on to return by mid-2025."
4. **Confidence:** med.

## no-surprises-act-medical-bills

1. **Net impact: keep.**
   - Providers, and staffing firms billing out of network, bear the cost.
   - The vehicle, CAA 2021, also carried COVID relief for workers.
   - CBO estimated it lowers private premiums 0.5–1% and cuts deficits by about $17B over 10 years (KFF citing CBO: https://www.kff.org/private-insurance/issue-brief/surprise-medical-bills-new-protections-for-consumers-take-effect-in-2022/).
2. **Credit.**
   - Current: donald-trump (signed) first, then ten negotiators.
   - Proposed:
     1. bill-cassidy, negotiated. Led a bipartisan working group that released draft surprise-billing legislation in Sept. 2018 (https://www.cassidy.senate.gov/newsroom/press-releases/cassidy-bipartisan-colleagues-release-draft-legislation-to-end-surprise-medical-bills/).
     2. maggie-hassan, negotiated. Not in the 2018 group, but she and Cassidy led the Senate effort from 2019 (https://www.cassidy.senate.gov/newsroom/press-releases/senators-cassidy-hassan-secure-end-to-surprise-medical-billing-legislation-in-government-funding-package/).
     3. patty-murray, negotiated. Brokered the final deal (HELP source already in the entry).
     4. lamar-alexander, negotiated
     5. frank-pallone, negotiated
     6. greg-walden, negotiated
     7. richard-neal, negotiated
     8. kevin-brady, negotiated
     9. bobby-scott, negotiated
     10. virginia-foxx, negotiated
     11. donald-trump, signed
3. **Body:** No change. It already leads with the legislators. Optionally add "Sen. Bill Cassidy began the bipartisan push in 2018, and Sen. Maggie Hassan joined him to lead it."
4. **Confidence:** high.

## no-tax-on-tips-and-overtime

1. **Net impact: retract.**
   - The content guide names this exact case as failing: a sweetener in a law paid for in large part by cutting Medicaid and SNAP.
   - CBO projects about 10 million more uninsured in 2034 under the law (https://ccf.georgetown.edu/2025/08/14/new-cbo-health-coverage-estimates-of-budget-reconciliation-law/).
   - CBO's distributional analysis found the bottom tenth of households lose about $1,600 a year and the top tenth gain about $12,000 (https://www.thefiscaltimes.com/2025/06/12/GOP-Bill-Would-Benefit-Wealthy-Households-and-Hurt-Poor-Ones-CBO).
   - It is `featured: true`, so retracting it removes a featured entry.
   - Keep `source_key: us-law-119-21-tips-overtime` on the retraction list so the pipeline doesn't re-add it.
2. **Credit:** n/a.
3. **Body:** n/a.
4. **Confidence:** high.

## norfolk-coastal-storm-risk-management

1. **Net impact: keep.**
   - Infrastructure-law money builds flood protection for whole neighborhoods, with no service cuts.
   - Caveat: the city's share is now over $2B (already in the status note). That's a local financing question, not a federal one.
2. **Credit.**
   - Current: joe-biden (signed), donald-trump (signed), mark-warner, tim-kaine, bobby-scott, elaine-luria (championed), norfolk-city-council (implemented). Two signers lead.
   - Proposed:
     1. bobby-scott, championed. Named the project his top WRDA 2020 priority (https://bobbyscott.house.gov/media-center/press-releases/scott-highlights-priorities-water-resources-development-act-2020).
     2. mark-warner, **negotiated**. One of the 10 senators who negotiated the infrastructure law (https://www.warner.senate.gov/newsroom/press-releases/senators-joint-statement-framework-on-bipartisan-infrastructure-deal/). Also pressed for design money.
     3. tim-kaine, championed
     4. elaine-luria, championed. The joint letters and the Dec. 2021 request for at least $60M (https://www.warner.senate.gov/newsroom/press-releases/warner-kaine-request-federal/).
     5. norfolk-city-council, implemented. Non-federal sponsor; pays 35%.
     6. joe-biden, signed (infrastructure law)
     7. donald-trump, signed (WRDA 2020)
   - The money was allocated by the Army Corps and OMB from the law's lump sums, not earmarked, so nobody should get `secured-funding`.
3. **Body:** Minor. Lead the third paragraph with the delegation's push, then authorization and funding.
4. **Confidence:** high.

## norfolk-st-pauls-choice-neighborhoods

1. **Net impact: owner's call.** Lean keep, but only if the body discloses the facts below. Retract if you judge the loss of hard units decisive.
   - **Demolition and replacement.** All 618 Tidewater Gardens units are being replaced on paper, but only about half as physical homes. Under the settlement, the plan replaces them with:
     - 260 on-site project-based-voucher units
     - 70 off-site project-based-voucher units
     - 288 tenant vouchers for use in the private market
   - So there are **330 hard subsidized units for 618 demolished**. Source: the settlement's definition of the "CNI Housing Plan" (https://www.lawyerscommittee.org/wp-content/uploads/2021/12/2021-11-24-Stipulation-dckt-291_1-1.pdf).
   - **The lawsuit.** *Bryant v. City of Norfolk*, No. 2:20-cv-00026 (E.D. Va.), was filed in **January 2020** (not 2021, as my first draft said). It was brought by residents and New Virginia Majority, represented by the Lawyers' Committee, Legal Aid Society of Eastern Virginia and Hogan Lovells, and alleged Fair Housing Act violations through mass displacement of Black residents.
   - It settled in Nov. 2021:
     - $200,000 to plaintiffs
     - a guaranteed right to return
     - hard replacement units raised to 260 on-site and 330 total
     - a source-of-income anti-discrimination ordinance
     - at least two more developments with rental-assistance units
     - a fair-housing review before Young Terrace and Calvert Square are demolished
   - Sources: https://www.lawyerscommittee.org/norfolk-housing-settlement-will-be-closely-monitored-by-the-plaintiffs/ ; https://whro.org/local-news/2021-11-30/norfolk-settles-lawsuit-over-st-paul-s-redevelopment
   - **Where people went:**
     - About 32% of relocated families reached the city's "opportunity" areas (https://www.whro.org/local-news/2021-04-12/nobody-helped-me-some-tidewater-gardens-public-housing-residents-say-norfolk-exaggerates-impact-of-people-first-support-program).
     - A 2021 Virginian-Pilot analysis found most moved to poorer, more segregated areas (cited in https://www.whro.org/business-growth/2026-03-02/housing-voucher-programs-proclaim-choice-but-analysis-shows-hampton-roads-housing-market-doesnt-leave-many-options).
     - NRHA has since conceded residents weren't properly prepared, and is switching to "build first" for the next two sites (https://www.whro.org/business-growth/2025-02-26/build-first-build-dense-how-norfolk-plans-to-redevelop-two-more-public-housing-communities).
   - **Returns:**
     - 334 families (54%) said they wanted to return (https://www.brinshore.com/news-posts/kindred-selected-as-new-name-for-former-tidewater-gardens-community).
     - 44 families were back in the first two buildings by April 2025 (https://www.norfolk.gov/CivicAlerts.aspx?AID=9136&ARC=16713).
     - The city's undated page says 70 families (https://norfolk.gov/6689).
     - "Over 100 former residents" as of May 2026 (the WTKR source already in the entry).
   - The two sides:
     - **For keeping:** every household kept a rental subsidy. A court-enforced settlement guarantees the right to return. The old site flooded.
     - **Against:** the city ends up with 288 fewer permanently subsidized homes, and displaced families mostly landed in poorer, segregated areas. From a renter's standpoint, that's a real loss.
2. **Credit.**
   - Current: ben-carson (issued), norfolk-city-council (implemented).
   - Proposed:
     1. norfolk-city-council, implemented
     2. Optional: nrha **NEW** (`kind: body`), implemented
     3. ben-carson, issued
   - Mayor Kenny Alexander drove the plan, but I don't have a single citable source for a `led` role, so I'm not proposing it.
   - **Could not confirm** any member of Congress credited with the grant.
3. **Body (major), if kept:**
   - State plainly: 618 units demolished, 330 hard subsidized replacements plus 288 vouchers.
   - Mention the 2020 lawsuit and the 2021 settlement.
   - Use household return counts, not just "100+ residents."
   - **Factual conflict to fix:** the status note says Kinship at Kindred reserves 73 of 191 units for former residents (NRHA). The city says 33. The research found both and did not resolve it.
4. **Confidence:** high on the facts; the verdict is the owner's call.

## over-the-counter-hearing-aids

1. **Net impact: keep.**
   - It lowers prices through competition, and hearing-aid makers and sellers bear the cost.
   - Real savings for older workers and retirees.
2. **Credit.**
   - Current: donald-trump (signed), elizabeth-warren (sponsored), chuck-grassley (cosponsored), joe-biden (implemented).
   - Proposed:
     1. elizabeth-warren, sponsored
     2. chuck-grassley, cosponsored. Note: co-author.
     3. joe-kennedy-iii **NEW**, sponsored. Led the House companion, H.R. 1652.
     4. marsha-blackburn **NEW**, cosponsored. House co-lead. Buddy Carter was also an original cosponsor. Sources for items 3–4: https://www.govinfo.gov/bulkdata/BILLSTATUS/115/hr/BILLSTATUS-115hr1652.xml and https://hearingreview.com/inside-hearing/industry-news/otc-hearing-aid-act-passed-us-house
     5. joe-biden, implemented. FDA missed the Aug. 18, 2020 statutory deadline (https://www.raps.org/resource/statutory-deadline-for-otc-hearing-aid-rule-missed.html). Executive Order 14036, sec. 5(p)(i), then directed FDA to "publish for notice and comment a proposed rule on over-the-counter hearing-aids" (https://www.govinfo.gov/content/pkg/FR-2021-07-14/html/2021-15069.htm). FDA proposed it on Oct. 20, 2021.
     6. Optional: greg-walden, sponsored. As Energy and Commerce chair, he sponsored the FDA Reauthorization vehicle, H.R. 2430.
     7. donald-trump, signed
3. **Body:** Add the House leads. Optionally note that FDA missed its 2020 deadline until Biden's order. The body already leads with Warren and Grassley.
4. **Confidence:** high.

## pact-act-veterans-toxic-exposure

1. **Net impact: keep.**
   - Large new veterans' benefits; no services cut.
   - About $280B in new direct spending over 10 years, with no offsets (CBO, as summarized by CRFB: https://www.crfb.org/blogs/va-bill-will-cost-hundreds-billions-dollars). No services were cut.
   - Optional sentence: "Congress added the cost to the deficit rather than cutting other programs."
2. **Credit.**
   - Current: joe-biden (signed), mark-takano (sponsored), jon-tester (led), jerry-moran (led).
   - Proposed:
     1. mark-takano, sponsored
     2. jon-tester, led
     3. jerry-moran, led. Tester and Moran negotiated the Senate text (https://www.veterans.senate.gov/2022/5/tester-moran-release-text-of-historic-bipartisan-toxic-exposure-legislation).
     4. Optional: raul-ruiz **NEW**, championed. Founded the Burn Pits Caucus in 2019; his presumptive-benefits bill, H.R. 2372, was folded into PACT (https://ruiz.house.gov/media-center/in-the-news/senate-overwhelmingly-passes-burn-pits-bill).
     5. Optional: kirsten-gillibrand, championed. Led the Senate version of that bill (https://www.gillibrand.senate.gov/?p=6280).
     6. Optional: elaine-luria, cosponsored. Original cosponsor of H.R. 3967, and a Hampton Roads tie (https://www.govinfo.gov/bulkdata/BILLSTATUS/117/hr/BILLSTATUS-117hr3967.xml).
     7. joe-biden, signed. He called for it in the 2022 State of the Union, which is advocacy, so `signed`.
   - S. 3373, the enacted vehicle, was a **Tim Kaine** bill on veterans' education grants. It was reused because the House bill had a revenue-origination ("blue slip") problem, so it's a vehicle like H.R. 748. Don't credit Kaine for PACT's content (https://www.govinfo.gov/bulkdata/BILLSTATUS/117/s/BILLSTATUS-117s3373.xml).
3. **Body:** No change required. Optionally add the Ruiz and Gillibrand burn-pit push and the financing line.
4. **Confidence:** high.

## respect-for-marriage-act

1. **Net impact: keep.** A rights protection with no cost to workers.
2. **Credit.**
   - Current: joe-biden (signed), jerrold-nadler (sponsored), tammy-baldwin (led), susan-collins, rob-portman, thom-tillis, kyrsten-sinema (negotiated).
   - Proposed:
     1. tammy-baldwin, led
     2. jerrold-nadler, sponsored. First introduced the bill as H.R. 3567 in Sept. 2009, with Baldwin (then a House member) and Jared Polis (https://nadler.house.gov/press-release/nadler-baldwin-and-polis-introduce-respect-marriage-act-repeal-defense-marriage-act).
     3. dianne-feinstein **NEW** (`current: false`), sponsored. Introduced the Senate bill, S. 4556, with Baldwin and Collins on July 19, 2022 (https://www.collins.senate.gov/newsroom/senators-baldwin-feinstein-collins-introduce-bipartisan-respect-for-marriage-act). She first introduced the Senate bill in 2011, then again in 2013 and 2015 (https://www.govinfo.gov/content/pkg/BILLS-113s1236is/html/BILLS-113s1236is.htm).
     4. susan-collins, negotiated
     5. rob-portman, negotiated
     6. thom-tillis, negotiated
     7. kyrsten-sinema, negotiated
     8. joe-biden, signed
3. **Body:** Minor. Add that it took 13 years: Nadler and Baldwin first introduced it in 2009, and Feinstein carried the Senate version from 2011.
4. **Confidence:** high.

## social-security-fairness-act

1. **Net impact: keep + say what it cost.**
   - Strongly pro-worker: teachers, police, firefighters and other public employees.
   - But it was not paid for. CBO: about **$196B** more direct spending over FY2024–2034, which moves the combined trust funds' depletion date up by **about six months**. Both figures are from CBO, not the SSA actuary (CRS IF12890, already in the entry's sources: https://www.everycrsreport.com/files/2025-01-31_IF12890_8610913762b1c87e9cedc6d2b2a909de0437ad59.html).
   - That cost falls on all beneficiaries, so say it in the body.
2. **Credit.**
   - Current: joe-biden (signed), garret-graves (sponsored), abigail-spanberger (cosponsored), sherrod-brown (sponsored), susan-collins (cosponsored).
   - Proposed:
     1. garret-graves, sponsored. Filed the September 2024 discharge petition that forced the House vote (CRS IN12451: https://www.everycrsreport.com/files/2024-11-13_IN12451_e4209df7c8a7d4d10b21e91ead4f81d9115ee3b3.pdf).
     2. abigail-spanberger, `led` (instead of cosponsored). First original cosponsor in both the 117th and 118th Congresses (https://www.govinfo.gov/bulkdata/BILLSTATUS/118/hr/BILLSTATUS-118hr82.xml). News coverage calls the petition a Graves–Spanberger effort (https://www.govexec.com/pay-benefits/2024/09/lawmakers-file-discharge-petition-repeal-controversial-tax-rule-affecting-federal-retirees/399421/), but CRS names only Graves as the filer.
     3. sherrod-brown, sponsored. Senate companion, S. 597.
     4. susan-collins, `led`. Lead Republican on the Senate bill.
     5. Optional: rodney-davis **NEW** (`current: false`), sponsored. Lead sponsor of H.R. 82 in the 117th Congress (https://www.govinfo.gov/bulkdata/BILLSTATUS/117/hr/BILLSTATUS-117hr82.xml).
     6. joe-biden, signed
3. **Body:** Add, for example: "It wasn't paid for. CBO estimated it adds about $196 billion in benefits over 10 years and brings the date Social Security's trust funds run short about six months closer."
4. **Confidence:** high on the net impact.

## take-it-down-act

1. **Net impact: keep.**
   - A real protection for victims, at no cost to workers.
   - Not a balance pick: it passed the Senate by unanimous consent and the House 409-2.
   - For candor, the owner may want one clause on the critics. EFF says the 48-hour takedown rule "lacks critical safeguards against frivolous or bad-faith takedown requests" and pushes platforms toward automated filters (https://www.eff.org/deeplinks/2025/04/congress-passes-take-it-down-act-despite-major-flaws). **Could not confirm** CDT's position from a primary source.
2. **Credit.**
   - Current: donald-trump (signed), ted-cruz (sponsored), amy-klobuchar (cosponsored), maria-elvira-salazar (sponsored), madeleine-dean (cosponsored).
   - Proposed:
     1. ted-cruz, sponsored
     2. amy-klobuchar, cosponsored. Note: first original cosponsor and co-lead (https://www.govinfo.gov/bulkdata/BILLSTATUS/119/s/BILLSTATUS-119s146.xml).
     3. maria-elvira-salazar, sponsored. House companion, H.R. 633 (https://www.govinfo.gov/bulkdata/BILLSTATUS/119/hr/BILLSTATUS-119hr633.xml).
     4. madeleine-dean, cosponsored. Note: first original cosponsor of H.R. 633.
     5. donald-trump, signed
   - Melania Trump isn't an officeholder. The body can keep the mention, but she doesn't get a credit.
3. **Body:** No change required. It already names the legislators first.
4. **Confidence:** high.

## trump-accounts-1000-for-newborns

1. **Net impact: retract.**
   - Same law and the same reason as tips and overtime: the One Big Beautiful Bill Act was paid for in large part by Medicaid and SNAP cuts, and the guide says the sweetener doesn't become its own entry. Same sources as no-tax-on-tips-and-overtime.
   - Keep `source_key: us-law-119-21-trump-accounts` on the retraction list.
2. **Credit:** n/a.
3. **Body:** n/a.
4. **Confidence:** high.

---

## Patterns

1. **The signer leads almost every entry.**
   - 18 of 22 entries list a signer first, and the Norfolk floodwall lists two signers first.
   - Only four don't: airline refunds (Buttigieg issued), Fort Monroe (Obama issued) and the two Choice Neighborhoods grants (Carson issued, which is arguably wrong; see item 4).
   - Reordering alone fixes most bylines.
2. **One law, several entries, inconsistent credit.**
   - The IRA is three entries (drug negotiation, insulin, Part D cap). Drug negotiation leaves out Manchin and Yarmuth, which the other two include.
   - ARPA is two entries (ACA credits, CTC). OBBBA is two entries, both to be retracted.
   - Recommendation: credit each entry first to the people who championed *that* provision:
     - insulin: Warnock, Craig
     - Part D cap: Wyden, Pallone
     - drug negotiation: Klobuchar, Welch, Pallone
     - CTC: DeLauro, Bennet, Brown
     - ACA credits: Underwood, Shaheen
   - Then list the package negotiators in the same order everywhere: Schumer, Manchin, Yarmuth (vehicle), Harris (tie-breaker), signer last.
3. **Vehicle sponsors are credited as if they did the work.**
   - John Yarmuth on ARPA and the IRA, and Tom Cole on CAA 2026, are formal sponsors of omnibus vehicles.
   - H.R. 748 (CARES) and S. 3373 (PACT) were shell bills, and S. 756 was the vehicle for First Step.
   - Keep the vehicle sponsors where they're already listed, but put them below the provision's champions with the note "vehicle," and don't add new ones.
4. **`issued` is overused for grants.** Ben Carson is `issued` on both Choice Neighborhoods grants for announcing awards chosen by HUD staff. The guide ties `issued` to orders and rules the executive issued themselves. The local applicants did the work.
5. **The Choice Neighborhoods entries need the same scrutiny as tax cuts.** Public housing redevelopment can take homes away from the lowest-income renters.
   - St. Paul's replaces 618 demolished units with 330 physical subsidized units plus 288 vouchers, and it drew a fair-housing lawsuit.
   - Ridley plans one-for-one hard replacement, but few households have returned.
   - Neither entry tells readers this. Any future pipeline entry about public housing redevelopment should be required to state demolished units, replacement units (physical vs. voucher) and return counts.
6. **Tax-based entries need a financing line, for consistency.**
   - CTC, the ACA credits and the CARES rebates pass the test: they were borrowed, not paid for with cuts. But the new guide singles out tax measures, so one sentence each makes the contrast with the retracted OBBBA entries explicit.
   - The Social Security Fairness Act needs one more urgently, because it was unfunded and draws down the trust funds.
   - PACT is also unfunded; a line there is optional.
7. **Bipartisan credit is real, not padded.**
   - With the two OBBBA entries retracted, Republicans still have prominent credits on 988 (Gardner, Stewart), First Step (Collins, Grassley, Cornyn), TAKE IT DOWN (Cruz, Salazar), and the No Surprises (Cassidy, Alexander, Walden, Brady, Foxx), Social Security Fairness (Graves, Collins), PACT (Moran), Respect for Marriage (Collins, Portman, Tillis), telehealth (Wicker) and OTC hearing aids (Grassley, Blackburn) entries.
   - None of these reads as a balance pick.
   - Fort Monroe is the one entry that reads as coverage filler.
8. **Where executives keep a leading role.**
   - `issued`: Buttigieg (refund rule), Obama (Fort Monroe proclamation).
   - `proposed`, replacing `signed`, all sourced:
     - Biden on the ACA credits and CTC (his Jan. 2021 American Rescue Plan spelled out both).
     - Biden on airline refunds (EO 14036 ordered the bag-fee and extras refund rule).
   - `implemented`: Biden on OTC hearing aids (EO 14036 sec. 5(p)).
   - Everywhere else, `signed`, last. That includes Trump on First Step (endorsed it and pressed McConnell; owner's call) and Biden on the IRA (Manchin: "President Biden was not involved").
9. **Factual problems found along the way** (fix regardless of the credit changes):
   - St. Paul's status note says 73 Kinship units are reserved for former residents. The city says 33. The research found both and did not resolve it.
   - Airline refunds: DOT's "Refund III" rulemaking to narrow what counts as a cancellation should be mentioned in the status note. Switch to `under-threat` if a proposed rule is published.
10. **NEW official ids needed** if all non-optional proposals are accepted:
    - lauren-underwood, jeanne-shaheen, michael-bennet, suzan-delbene
    - mitch-mcconnell, steven-mnuchin
    - john-cornyn, sheldon-whitehouse
    - chris-stewart, seth-moulton
    - jim-webb, scott-rigell
    - peter-welch, ron-wyden
    - raphael-warnock, angie-craig
    - brian-schatz, roger-wicker
    - maria-cantwell
    - joe-kennedy-iii, marsha-blackburn
    - dianne-feinstein
    - Optional: ritchie-torres, cory-booker, mike-lee, lindsey-graham, josh-hawley, mitt-romney, jared-kushner, ken-salazar, raul-ruiz, rodney-davis, newport-news-redevelopment-and-housing-authority, nrha.
