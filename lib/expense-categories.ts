export const CAPEX_CATEGORIES = [
  { value: "renovation",  label: "Renovation & Build-up" },
  { value: "vr_sets",     label: "VR Headsets & Equipment" },
  { value: "vr_guns",     label: "VR Gun Controllers" },
  { value: "furniture",   label: "Furniture & Fixtures" },
  { value: "signage",     label: "Signage & Branding" },
  { value: "marketing",   label: "Marketing" },
  { value: "other_capex", label: "Other CapEx" },
]

export const OPEX_CATEGORIES = [
  { value: "rent",        label: "Rent" },
  { value: "salaries",    label: "Staff Salaries" },
  { value: "electricity", label: "Electricity" },
  { value: "internet",    label: "Internet & Connectivity" },
  { value: "maintenance", label: "Equipment Maintenance" },
  { value: "cleaning",    label: "Cleaning Services" },
  { value: "other_opex",  label: "Other OpEx" },
]

export const ALL_CATEGORIES = [...CAPEX_CATEGORIES, ...OPEX_CATEGORIES]
export const CATEGORY_MAP: Record<string, string> = Object.fromEntries(ALL_CATEGORIES.map(c => [c.value, c.label]))

// Forecasted budget per line item. CapEx figures are one-time; OpEx figures are a
// run-rate (see `note` for the period) — variance reads as "this period's plan vs life-to-date actual."
export const PLANNED_BUDGET: Record<string, { amount: number; note: string }> = {
  renovation: { amount: 6220, note: "Build-out, one-time (incl. contingency)" },
  vr_sets:    { amount: 5355, note: "One-time" },
  vr_guns:    { amount: 1500, note: "One-time" },
  furniture:  { amount: 2000, note: "One-time" },
  signage:    { amount: 300,  note: "One-time" },
  marketing:  { amount: 500,  note: "One-time" },
  rent:       { amount: 4200, note: "Per year" },
  salaries:   { amount: 2400, note: "Operator, first 3 months" },
  internet:   { amount: 100,  note: "Per month" },
  cleaning:   { amount: 200,  note: "Per month (incl. sanitization)" },
}

const CAPEX_VALUES = new Set(CAPEX_CATEGORIES.map(c => c.value))
export const PLANNED_CAPEX_TOTAL = Object.entries(PLANNED_BUDGET)
  .filter(([cat]) => CAPEX_VALUES.has(cat))
  .reduce((sum, [, v]) => sum + v.amount, 0)
