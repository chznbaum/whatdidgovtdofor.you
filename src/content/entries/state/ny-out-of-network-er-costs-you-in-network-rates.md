---
title: An out-of-network ER can't charge you more than an in-network one
dek: Since October 2019, New Yorkers with state-regulated health plans pay only their in-network share when they get emergency care at an out-of-network hospital. That includes a hospital stay that follows the ER visit.
level: state
jurisdiction: ny
action:
  type: law
  name: Chapter 375 of the Laws of 2019
  identifier: A264B / S3171A
  date: 2019-10-17
topics:
  - health
  - costs
who_benefits: New Yorkers with fully insured, state-regulated health plans, including the state's Empire Plan, who get emergency care at an out-of-network hospital.
impact:
  - figure: In-network share
    label: the most you pay for ER care and a follow-up stay at an out-of-network hospital
  - figure: 62–0
    label: Senate vote to pass the protection in June 2019
status:
  state: in-effect
  as_of: 2026-11-11
credit:
  - official: kevin-cahill
    role: sponsored
    note: Carried the bill in the Assembly; the Assembly passed an earlier version in 2018
  - official: liz-krueger
    role: sponsored
    note: Carried the Senate version, S3171
  - official: andrew-cuomo
    role: signed
votes:
  - chamber: New York State Senate
    date: 2019-06-18
    yes: 62
    no: 0
    source: https://www.nysenate.gov/legislation/bills/2019/A264
sources:
  - title: Assembly Bill A264B (2019–2020), text, actions, and Senate vote
    publisher: New York State Senate
    url: https://www.nysenate.gov/legislation/bills/2019/A264
    date: 2019-10-17
  - title: Senate Bill S3171 (2019–2020), sponsor memo
    publisher: New York State Senate
    url: https://www.nysenate.gov/legislation/bills/2019/S3171
  - title: Surprise medical bills
    publisher: New York State Department of Financial Services
    url: https://www.dfs.ny.gov/consumers/health_insurance/surprise_medical_bills
  - title: 32BJ congratulates Gov. Cuomo on signing into law protections for New Yorkers from excess hospital charges
    publisher: 32BJ SEIU
    url: https://www.seiu32bj.org/press-release/32bj-congratulates-gov-cuomo-on-signing-into-law-protections-for-new-yorkers-from-excess-hospital-charges/
    date: 2019-10-22
  - title: NYS implements protections for ER overcharging
    publisher: CNY News
    url: https://cnynews.com/nys-implements-protections-for-er-overcharging/
    date: 2019-10-18
verification:
  writer:
    model: claude-opus-5-5
    via: claude-code
    date: 2026-11-11
  verifier:
    model: gpt-5.6-sol
    via: codex-cli
    date: 2026-11-12
  verdict: fail
  notes: The protection is currently in effect, and the sponsors, signer, and 62–0 Senate vote check out. However, the entry attributes the patient protection to the wrong action, so it cannot be repaired without replacing its underlying action and source key. The core attribution is false. The [S3171A sponsor memo](https://www.nysenate.gov/legislation/bills/2019/S3171) says Insurance Law §3241 already required insurers to limit patients’ out-of-pocket costs for out-of-network emergency services; Chapter 375 principally added hospital charges to the independent dispute-resolution process. It did not originate the benefit claimed by the title, dek, who_benefits, and body. The body incorrectly says the 2014 law protected patients from out-of-network doctors but not hospitals’ emergency charges. The 2019 sponsor memo expressly says the existing §3241 protection covered emergency services received from a nonparticipating provider and required insurers to pay nonparticipating hospitals so members were not balance billed. The direct rule that a nonparticipating hospital may not bill an insured beyond in-network cost sharing was added later through Part YY of Chapter 56 of the Laws of 2020, which amended Financial Services Law §606. The [current §606](https://www.nysenate.gov/legislation/laws/FIS/606) contains that prohibition; Chapter 375 did not amend §606. The effective-date claim is wrong. Although Chapter 375 initially said “immediately,” the same-day Chapter 377 amendment set January 1, 2020 as the operative date. DFS likewise describes Chapters 375 and 377 as effective January 1, 2020, not October 2019. The Empire Plan is not properly attributable to this 2019 action. Part BB of New York’s enacted 2026–27 budget added Civil Service Law article 11 health plans to Financial Services Law §603’s definition of a health care plan; the entry therefore credits Chapter 375 for a beneficiary added by a later law. The claim that hospitals and insurers automatically “take the fight to an independent reviewer” is too strong. Chapter 375 says either party “may” submit a payment dispute to independent review. The present-tense safety-net-hospital exemption is outdated and misleading. DFS stated that hospital-bill disputes involving safety-net hospitals could enter New York’s IDR process beginning January 1, 2022, alongside federal hold-harmless protections. Once accurately described as a law governing payment disputes between hospitals and insurers, the cited evidence does not establish the direct, tangible working-person benefit required by the content guide. The entry therefore does not qualify under its stated action.
source_key: ny-2019-a264
---

In an emergency, you go to the closest hospital, whether or not your plan has a contract with it. In New York, if your plan is state-regulated, an out-of-network hospital can bill you only the copay, coinsurance, or deductible you'd owe at an in-network hospital. That also covers your stay if the hospital admits you after the ER visit. If you get a bill for more, tell your health plan or contact the state Department of Financial Services.

You don't have to apply. The protection covers plans marked "fully insured" on your ID card, along with the state's Empire Plan. When a hospital and an insurer disagree about the price, they take the fight to an independent reviewer, and the patient stays out of it. Hospitals that mainly serve Medicaid and uninsured patients are exempt from these hospital rules.

New York's 2014 surprise-bill law protected patients from out-of-network doctors but not from hospitals' emergency charges. Assembly Member Kevin Cahill and Sen. Liz Krueger carried this bill to close that gap. Versions of it had been introduced since 2015, and the Assembly passed one in 2018 before it died in the Senate. In 2019 it passed the Assembly in June, and the Senate passed it 62–0. Gov. Andrew Cuomo signed it on October 17, 2019.
