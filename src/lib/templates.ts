import type { Industry, ModuleType, PrimaryAction } from "./domain";
import { industries, parseModuleConfig } from "./domain";
import type { QuoteModuleConfig } from "./quote-config";

export type TemplateModule = {
  type: ModuleType;
  enabled: boolean;
  config: unknown;
};
export type IndustryTemplate = {
  industry: Industry;
  name: string;
  defaultPrimaryAction: PrimaryAction;
  modules: TemplateModule[];
};

const faq = (questions: string[]) =>
  questions.map((question) => ({
    question,
    answer: "Contact us and we’ll confirm the details for your job.",
  }));

const contactFields = (): QuoteModuleConfig["fields"] => [
  {
    id: "customer_name",
    type: "CONTACT",
    contactKind: "NAME",
    label: "Your name",
    required: true,
    helperText: "",
  },
  {
    id: "customer_phone",
    type: "CONTACT",
    contactKind: "PHONE",
    label: "Phone number",
    required: true,
    helperText: "Best number for a quick reply.",
  },
  {
    id: "customer_email",
    type: "CONTACT",
    contactKind: "EMAIL",
    label: "Email address",
    required: false,
    helperText: "Optional backup contact.",
  },
];

const genericQuote = (specialty: string): QuoteModuleConfig => ({
  label: `Get a ${specialty} Quote`,
  intro: "Share a few job details and we’ll get back to you.",
  fields: [
    {
      id: "job_details",
      type: "TEXT",
      label: "What do you need help with?",
      required: true,
      helperText: "A short description is enough.",
      multiline: true,
      minLength: 5,
      maxLength: 800,
    },
    {
      id: "job_address",
      type: "ADDRESS",
      label: "Job postcode or address",
      required: true,
      helperText: "Used only to understand the service location.",
      maxLength: 160,
    },
    {
      id: "job_photos",
      type: "PHOTO",
      label: "Job photos",
      required: false,
      helperText: "Optional. Up to 3 JPG, PNG or WebP photos.",
    },
    ...contactFields(),
  ],
});
const base = (specialty: string, emergency = false): TemplateModule[] => [
  {
    type: "QUOTE_REQUEST",
    enabled: false,
    config: genericQuote(specialty),
  },
  {
    type: "CALL_WHATSAPP",
    enabled: true,
    config: {
      callLabel: emergency ? "Call now" : "Call us",
      whatsappLabel: "Message on WhatsApp",
      whatsappMessage: "Hi, I’d like to request a quote.",
      ...(emergency ? { emergencyLabel: "Emergency call" } : {}),
    },
  },
  {
    type: "PRICING",
    enabled: false,
    config: {
      mode: "PRICE_LIST",
      label: "Typical pricing",
      currency: "RON",
      categories: [
        {
          id: "category_services",
          name: "Services",
          items: [
            {
              id: "standard_visit",
              name: "Standard visit",
              amountMinor: 15000,
              pricePrefix: "FROM",
              description: "Final price depends on the job.",
            },
          ],
        },
      ],
    },
  },
  {
    type: "SERVICE_AREA",
    enabled: false,
    config: { label: "Check our service area", areas: [], postalCodes: [] },
  },
  {
    type: "TRUST",
    enabled: false,
    config: {
      label: "Why customers trust us",
      entries: [
        {
          id: "insured",
          name: "Insured",
          description: "Business-provided insurance information.",
        },
        { id: "experienced_team", name: "Experienced local team" },
      ],
    },
  },
  {
    type: "FAQ",
    enabled: false,
    config: {
      label: "Common questions",
      suggestedFaqs: faq([
        "How quickly can you attend?",
        "Do you provide a written quote?",
      ]),
    },
  },
  {
    type: "REVIEW",
    enabled: false,
    config: { label: "Read or leave a Google review" },
  },
  {
    type: "SAVE_CONTACT",
    enabled: true,
    config: { label: "Save our contact" },
  },
];

const names: Record<Industry, string> = {
  PLUMBING: "Plumbing",
  HVAC: "HVAC",
  ELECTRICAL: "Electrical",
  ROOFING: "Roofing",
  CLEANING: "Cleaning",
  LANDSCAPING: "Landscaping",
  PRESSURE_WASHING: "Pressure Washing",
  PEST_CONTROL: "Pest Control",
  HANDYMAN: "Handyman",
  PAINTING: "Painting",
  MOBILE_DETAILING: "Mobile Detailing",
  APPLIANCE_REPAIR: "Appliance Repair",
  POOL_SERVICES: "Pool Services",
  GARAGE_DOOR: "Garage Door Services",
  OTHER: "Local Service Business",
};

export const templates = Object.fromEntries(
  industries.map((industry) => {
    const specialty = names[industry];
    const modules = base(
      specialty,
      ["PLUMBING", "HVAC", "ELECTRICAL", "GARAGE_DOOR"].includes(industry),
    );
    if (industry === "PLUMBING") {
      modules[0] = {
        type: "QUOTE_REQUEST",
        enabled: false,
        config: {
          label: "Get a Plumbing Quote",
          intro: "Tell us what is happening and whether the job is urgent.",
          fields: [
            {
              id: "issue_type",
              type: "DROPDOWN",
              label: "What plumbing issue do you have?",
              required: true,
              helperText: "",
              choices: [
                "Leak",
                "Blocked drain",
                "No hot water",
                "Installation",
                "Other",
              ],
            },
            {
              id: "urgency",
              type: "DROPDOWN",
              label: "How urgent is it?",
              required: true,
              helperText:
                "For immediate danger, contact emergency services first.",
              choices: ["Emergency call-out", "Normal service"],
            },
            {
              id: "property_postcode",
              type: "ADDRESS",
              label: "Property postcode",
              required: true,
              helperText: "",
              maxLength: 80,
            },
            {
              id: "issue_description",
              type: "TEXT",
              label: "Short description",
              required: true,
              helperText: "Include what you can see and when it started.",
              multiline: true,
              minLength: 5,
              maxLength: 800,
            },
            {
              id: "job_photos",
              type: "PHOTO",
              label: "Photos of the issue",
              required: false,
              helperText: "Optional. Up to 3 JPG, PNG or WebP photos.",
            },
            ...contactFields(),
          ],
        },
      };
      modules[4].config = {
        label: "Qualified & insured",
        entries: [
          { id: "insured", name: "Insured" },
          { id: "qualified_plumber", name: "Qualified plumber" },
          { id: "workmanship_warranty", name: "Workmanship warranty" },
        ],
      };
      modules[5].config = {
        label: "Plumbing questions",
        suggestedFaqs: faq([
          "Do you offer emergency call-outs?",
          "Can you isolate an active leak?",
          "Do you provide a written quote?",
        ]),
      };
    }
    if (industry === "HVAC") {
      modules[0] = {
        type: "QUOTE_REQUEST",
        enabled: false,
        config: {
          label: "Get an HVAC Quote",
          intro:
            "Share the system and service details for a useful first response.",
          fields: [
            {
              id: "service_type",
              type: "DROPDOWN",
              label: "What service do you need?",
              required: true,
              helperText: "",
              choices: ["Repair", "Maintenance", "Installation", "Other"],
            },
            {
              id: "system_details",
              type: "TEXT",
              label: "System type or model",
              required: false,
              helperText: "Share the model if it is easy to find.",
              multiline: false,
              maxLength: 160,
            },
            {
              id: "job_details",
              type: "TEXT",
              label: "What is the problem?",
              required: true,
              helperText: "",
              multiline: true,
              minLength: 5,
              maxLength: 800,
            },
            {
              id: "job_address",
              type: "ADDRESS",
              label: "Job postcode or address",
              required: true,
              helperText: "",
              maxLength: 160,
            },
            {
              id: "job_photos",
              type: "PHOTO",
              label: "System photos",
              required: false,
              helperText:
                "Optional. Include the unit or model plate if useful.",
            },
            ...contactFields(),
          ],
        },
      };
      modules[4].config = {
        label: "HVAC credentials",
        entries: [
          { id: "insured", name: "Insured" },
          { id: "qualified_hvac", name: "Qualified HVAC technician" },
          { id: "installation_warranty", name: "Installation warranty" },
        ],
      };
      modules[5].config = {
        label: "Heating & cooling questions",
        suggestedFaqs: faq([
          "Do you repair my system type?",
          "Do you offer seasonal maintenance?",
          "Do you provide installation quotes?",
        ]),
      };
    }
    if (industry === "CLEANING") {
      modules[0] = {
        type: "QUOTE_REQUEST",
        enabled: false,
        config: {
          label: "Get a Cleaning Quote",
          intro: "Describe the space and preferred cleaning frequency.",
          fields: [
            {
              id: "cleaning_type",
              type: "MULTIPLE_CHOICE",
              label: "What needs cleaning?",
              required: true,
              helperText: "Choose all that apply.",
              choices: [
                "Home",
                "Office",
                "End of tenancy",
                "Deep clean",
                "Other",
              ],
              maxSelections: 5,
            },
            {
              id: "approximate_size",
              type: "NUMBER",
              label: "Approximate size in square metres",
              required: false,
              helperText: "A rough estimate is fine.",
              min: 1,
              max: 100000,
              step: 1,
            },
            {
              id: "frequency",
              type: "DROPDOWN",
              label: "Preferred frequency",
              required: true,
              helperText: "",
              choices: ["One-off", "Weekly", "Fortnightly", "Monthly"],
            },
            {
              id: "job_address",
              type: "ADDRESS",
              label: "Job postcode or address",
              required: true,
              helperText: "",
              maxLength: 160,
            },
            {
              id: "job_photos",
              type: "PHOTO",
              label: "Space photos",
              required: false,
              helperText: "Optional. Up to 3 photos.",
            },
            ...contactFields(),
          ],
        },
      };
      modules[2].config = {
        mode: "SIMPLE_ESTIMATE",
        label: "Get a cleaning estimate",
        currency: "RON",
        base: { label: "Call-out and supplies", amountMinor: 12000 },
        addOns: [
          { id: "deep_clean", label: "Deep clean", amountMinor: 10000 },
          { id: "oven", label: "Oven cleaning", amountMinor: 8000 },
        ],
        quantity: {
          id: "rooms",
          label: "Rooms",
          unitLabel: "room",
          unitAmountMinor: 3500,
          min: 1,
          max: 10,
          step: 1,
        },
      };
      modules[5].config = {
        label: "Cleaning questions",
        suggestedFaqs: faq([
          "Do you bring cleaning supplies?",
          "Can you work around pets?",
          "Do you offer recurring cleaning?",
        ]),
      };
    }
    if (industry === "PRESSURE_WASHING") {
      modules[0] = {
        type: "QUOTE_REQUEST",
        enabled: false,
        config: {
          label: "Get a Pressure Washing Quote",
          intro:
            "Share the surface, approximate size and photos for a faster quote.",
          fields: [
            {
              id: "surface_type",
              type: "DROPDOWN",
              label: "What needs cleaning?",
              required: true,
              helperText: "",
              choices: ["Driveway", "Patio", "House", "Roof", "Other"],
            },
            {
              id: "approximate_size",
              type: "NUMBER",
              label: "Approximate size in square metres",
              required: false,
              helperText: "A rough estimate is fine.",
              min: 1,
              max: 100000,
              step: 1,
            },
            {
              id: "job_address",
              type: "ADDRESS",
              label: "Job postcode or address",
              required: true,
              helperText: "",
              maxLength: 160,
            },
            {
              id: "job_photos",
              type: "PHOTO",
              label: "Surface photos",
              required: false,
              helperText: "Optional. Up to 3 JPG, PNG or WebP photos.",
            },
            ...contactFields(),
          ],
        },
      };
      modules[2].config = {
        mode: "SIMPLE_ESTIMATE",
        label: "Estimate by surface and area",
        currency: "RON",
        base: { label: "Setup", amountMinor: 10000 },
        addOns: [
          {
            id: "stain_treatment",
            label: "Stain treatment",
            amountMinor: 6000,
          },
        ],
        quantity: {
          id: "area",
          label: "Approximate area",
          unitLabel: "m²",
          unitAmountMinor: 150,
          min: 10,
          max: 1000,
          step: 10,
        },
      };
      modules[5].config = {
        label: "Pressure washing questions",
        suggestedFaqs: faq([
          "Which surfaces can you safely clean?",
          "Do you need access to an outdoor tap?",
          "How long before the area can be used?",
        ]),
      };
    }
    modules.forEach((m) => parseModuleConfig(m.type, m.config));
    return [
      industry,
      {
        industry,
        name: specialty,
        defaultPrimaryAction: "CALL",
        modules,
      },
    ];
  }),
) as Record<Industry, IndustryTemplate>;

export function getTemplate(value: string): IndustryTemplate {
  if (!industries.includes(value as Industry))
    throw new Error("Unsupported industry");
  return templates[value as Industry];
}
