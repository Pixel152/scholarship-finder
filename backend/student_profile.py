from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class StudentProfile:
    name: str = ""
    year: str = ""
    university: str = ""
    major: str = ""
    gpa: Optional[float] = None
    intended_profession: str = ""

    hometown_city: str = ""
    hometown_state: str = ""
    hometown_county: str = ""
    state_of_residence: str = ""
    high_school: str = ""
    high_school_state: str = ""

    citizenship: str = ""
    heritage: str = ""
    religion: str = ""
    languages: List[str] = field(default_factory=list)

    first_gen: bool = False
    financial_need: bool = False
    income_bracket: str = ""
    military_family: bool = False
    disability: str = ""

    activities: List[str] = field(default_factory=list)
    national_club_orgs: List[str] = field(default_factory=list)
    honors: List[str] = field(default_factory=list)

    parent_employer: str = ""
    parent_industry: str = ""
    parent_union: str = ""

    career_goal: str = ""
    already_applied: List[str] = field(default_factory=list)

    extra_context: str = ""
    linkedin_url: str = ""
    website_url: str = ""
    portfolio_url: str = ""

    def to_prompt_text(self) -> str:
        lines = [
            f"Name: {self.name}",
            f"Year: {self.year}",
            f"University: {self.university}",
            f"Major: {self.major}",
        ]
        if self.gpa:
            lines.append(f"GPA: {self.gpa}")
        if self.intended_profession:
            lines.append(f"Intended profession: {self.intended_profession}")

        lines.append(f"Hometown: {self.hometown_city}, {self.hometown_state}")
        if self.hometown_county:
            lines.append(f"Hometown county: {self.hometown_county}")
        if self.state_of_residence and self.state_of_residence != self.hometown_state:
            lines.append(f"Current state of residence: {self.state_of_residence}")
        if self.high_school:
            hs = self.high_school
            if self.high_school_state:
                hs += f", {self.high_school_state}"
            lines.append(f"High school: {hs}")

        lines.append(f"Citizenship: {self.citizenship}")
        if self.heritage:
            lines.append(f"Heritage/Ethnicity: {self.heritage}")
        if self.religion:
            lines.append(f"Religious affiliation: {self.religion}")
        if self.languages:
            lines.append(f"Languages: {', '.join(self.languages)}")

        if self.first_gen:
            lines.append("First-generation college student: Yes")
        if self.financial_need:
            lines.append("Demonstrated financial need: Yes")
        if self.income_bracket:
            lines.append(f"Household income bracket: {self.income_bracket}")
        if self.military_family:
            lines.append("Military family: Yes")
        if self.disability:
            lines.append(f"Disability: {self.disability}")

        if self.activities:
            lines.append(f"Activities/clubs: {', '.join(self.activities)}")
        if self.national_club_orgs:
            lines.append(f"National club organizations: {', '.join(self.national_club_orgs)}")
        if self.honors:
            lines.append(f"Academic honors/awards: {', '.join(self.honors)}")

        if self.parent_employer:
            lines.append(f"Parent's employer: {self.parent_employer}")
        if self.parent_industry:
            lines.append(f"Parent's industry: {self.parent_industry}")
        if self.parent_union:
            lines.append(f"Parent's union: {self.parent_union}")

        if self.career_goal:
            lines.append(f"Career goal: {self.career_goal}")

        if self.already_applied:
            lines.append(f"\nALREADY APPLIED — exclude from results: {', '.join(self.already_applied)}")

        if self.extra_context:
            lines.append(f"\nADDITIONAL BACKGROUND (use this to find more targeted scholarships):\n{self.extra_context}")

        return "\n".join(lines)
