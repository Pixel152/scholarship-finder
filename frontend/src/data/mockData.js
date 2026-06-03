export const MOCK_PROFILE = {
  name: 'Alex Rivera',
  year: 'junior',
  university: 'Columbia University',
  major: 'Computer Science',
  gpa: 3.7,
  intended_profession: 'Software Engineer',
  hometown_city: 'New York',
  hometown_state: 'NY',
  hometown_county: 'New York County',
  state_of_residence: '',
  high_school: 'Stuyvesant High School',
  high_school_state: 'NY',
  citizenship: 'us_citizen',
  heritage: 'Latino',
  religion: '',
  languages: ['Spanish'],
  first_gen: true,
  financial_need: true,
  income_bracket: '$50-100K',
  military_family: false,
  disability: '',
  activities: ['Hackathon organizer', 'Startup club president', 'Debate team'],
  national_club_orgs: ['DECA', 'HOSA'],
  honors: ['AP Scholar', 'National Merit Commended'],
  parent_employer: 'NYC Department of Education',
  parent_industry: 'Education',
  parent_union: 'UFT',
  career_goal: 'Tech entrepreneurship / venture capital',
  already_applied: ['Gates Scholarship'],
}

export const MOCK_OUTPUT = `ALREADY APPLIED (excluded): Gates Scholarship

#1. Columbia University John Jay Scholars Program — Columbia University
   Amount:      $19,310/yr | renewable (4 years)
   Status:      OPEN — deadline February 1, 2026
   Eligibility: Enrolled Columbia undergraduate, demonstrated academic excellence, any major
   Awards/yr:   ~500 — large program, automatic consideration for qualifying students
   Apply:       https://cc-seas.financialaid.columbia.edu | finaid@columbia.edu
   Effort:      Automatic consideration — no separate application required
   Past winners:High-achieving students across all majors, avg 3.8+ GPA, diverse backgrounds
   Match:       Columbia junior in CS — already enrolled, zero extra steps required
   Ease of win: 9/10 — no separate application; eligible by virtue of enrollment and academic record

#2. Thurgood Marshall College Fund HBCU Scholarship — TMCF
   Amount:      $3,200/yr | renewable (up to 4 years)
   Status:      OPEN — deadline March 15, 2026
   Eligibility: First-generation college student, financial need, GPA 3.0+, US citizen
   Awards/yr:   ~300 — moderate pool, need-based gating keeps competition low
   Apply:       https://tmcf.org/our-scholarships | scholarships@tmcf.org
   Effort:      Online application, 1 essay (750 words), FAFSA, 1 recommendation
   Past winners:First-gen students from families earning under $75K, STEM majors well represented
   Match:       First-generation + financial need + GPA 3.7 + US citizen — all core criteria met
   Ease of win: 8/10 — not widely indexed, financial need + first-gen combination filters most applicants out

#3. Society of Hispanic Professional Engineers (SHPE) Scholarship — SHPE Foundation
   Amount:      $3,000 | renewable
   Status:      OPEN — deadline April 1, 2026
   Eligibility: Latino/Hispanic, engineering or CS major, GPA 3.0+, SHPE member
   Awards/yr:   ~200 — moderate applicant pool, membership-gated
   Apply:       https://shpe.org/scholarships | scholarships@shpe.org
   Effort:      Online application, 2 essays, 1 recommendation, SHPE membership required
   Past winners:Latino CS and engineering students nationwide, first-gen common, avg GPA 3.5
   Match:       Latino + Computer Science + first-gen + GPA 3.7 — strong match; SHPE membership needed
   Ease of win: 8/10 — not on major aggregators, gated by Latino identity + CS major combination

#4. UFT Scholarship Program — United Federation of Teachers
   Amount:      $2,000 | one-time
   Status:      OPEN — deadline March 31, 2026
   Eligibility: Dependent of active UFT member (NYC teacher), undergraduate, any major
   Awards/yr:   ~150 — small applicant pool, union-gated access
   Apply:       https://www.uft.org/scholarships | scholarships@uft.org
   Effort:      Short form, 1 essay (500 words), proof of UFT parent membership
   Past winners:NYC students with UFT parent, diverse majors, first-gen students well represented
   Match:       Parent is NYC DOE employee in UFT — direct eligibility, highly specific qualifier
   Ease of win: 8/10 — invisible to most students, unlocked only by UFT parent membership

#5. Hispanic Scholarship Fund — Hispanic Scholarship Fund
   Amount:      $500–$5,000 | renewable
   Status:      OPEN — deadline February 15, 2026
   Eligibility: Hispanic/Latino, US citizen or permanent resident, 3.0+ GPA, financial need
   Awards/yr:   ~10,000 — large program but strong match criteria
   Apply:       https://www.hsf.net/scholarship | scholar@hsf.net
   Effort:      Online application, 1 essay, 1 recommendation, FAFSA required
   Past winners:Latino students across all majors and universities, first-gen heavily represented
   Match:       Latino + first-gen + financial need + GPA 3.7 — all core criteria met
   Ease of win: 7/10 — appears on some aggregators but first-gen + financial need combo boosts odds

#6. New York Community Trust College Scholarship — NYCT Foundation
   Amount:      $2,500/yr | renewable (2 years)
   Status:      OPEN — deadline March 1, 2026
   Eligibility: NYC resident, undergraduate enrolled in NY college, financial need, GPA 3.0+
   Awards/yr:   ~75 — geographically constrained, moderate competition
   Apply:       https://www.nycommunitytrust.org/scholarships | grants@nyct.org
   Effort:      Online form, 1 short essay, financial aid documentation
   Past winners:NYC undergrads from all 5 boroughs, community-engaged students, diverse majors
   Match:       New York City resident + Columbia + financial need — exact geographic and need profile
   Ease of win: 7/10 — city-level constraint significantly reduces competition pool

#7. DECA Emerging Leader Scholarship — DECA Inc.
   Amount:      $1,000 | one-time
   Status:      UPCOMING — deadline January 15, 2027
   Eligibility: Current or former DECA member, undergraduate, demonstrated leadership
   Awards/yr:   10 — very small award pool nationally
   Apply:       https://www.deca.org/scholarships | scholarships@deca.org
   Effort:      Short application, 1 essay on leadership experience, DECA membership documentation
   Past winners:Former DECA chapter officers and state competitors, entrepreneurship focus common
   Match:       DECA member + startup club president + entrepreneurship career goal — strong narrative fit
   Ease of win: 8/10 — only 10 awards nationally, but DECA membership gates 95% of applicants out

#8. America-Israel Cultural Foundation Scholarship — AICF
   Amount:      $5,000 | renewable
   Status:      OPEN — deadline May 1, 2026
   Eligibility: Connection to Israel or Israeli-American community, undergraduate, arts or STEM focus
   Awards/yr:   ~50 — small culturally-specific pool
   Apply:       https://www.aicf.org/scholarships | info@aicf.org
   Effort:      Application + personal statement + 1 recommendation
   Past winners:Students with Israeli family background or strong Israel connection, diverse fields
   Match:       Spanish-speaking + NYC + Columbia STEM — cultural crossover scholarships available
   Ease of win: 7/10 — small culturally-gated pool, connection to Israel community required

⚠️ VERIFY note: Deadlines confirmed via extract as of today. Award amounts subject to annual revision.

TOTAL ESTIMATED VALUE: $33,310–$52,810
QUICK WINS THIS WEEK:
1. UFT Scholarship (deadline Mar 31) — short form, parent is UFT member. 30 minutes max.
2. SHPE Scholarship (deadline Apr 1) — join SHPE online ($25), then apply. Latino + CS = strong match.
3. Columbia John Jay — no application needed. Confirm GPA qualifies with financial aid office.`

export const MOCK_DATE = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
export const MOCK_COUNT = 8
