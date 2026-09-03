import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";
import { getTemplate } from "../src/lib/templates";

const db = new PrismaClient();
const examples = [
  {
    industry: "PLUMBING",
    name: "RapidFlow Plumbing",
    slug: "rapidflow-plumbing",
    phone: "+40700111222",
    description:
      "Local plumbing repairs, installations and emergency call-outs.",
    color: "#0b6bcb",
    areas: ["Bucharest", "Ilfov", "Otopeni"],
    postalCodes: ["010001", "077190"],
    ownerEmail: "owner@example.test",
  },
  {
    industry: "HVAC",
    name: "Comfort Air HVAC",
    slug: "comfort-air-hvac",
    phone: "+40700222333",
    description:
      "Heating and cooling servicing for homes and small businesses.",
    color: "#c2410c",
    areas: ["Cluj-Napoca", "Florești", "Apahida"],
    postalCodes: ["400001", "407280"],
    ownerEmail: "other-owner@example.test",
  },
  {
    industry: "PRESSURE_WASHING",
    name: "BrightJet Washing",
    slug: "brightjet-washing",
    phone: "+40700333444",
    description: "Professional exterior and surface pressure washing services.",
    color: "#0891b2",
    areas: ["Constanța", "Mamaia", "Năvodari"],
    postalCodes: ["900001", "905700"],
    ownerEmail: "other-owner@example.test",
  },
  {
    industry: "CLEANING",
    name: "FreshNest Cleaning",
    slug: "freshnest-cleaning",
    phone: "+40700444555",
    description:
      "Reliable home and office cleaning with flexible service options.",
    color: "#7c3aed",
    areas: ["Brașov", "Săcele", "Ghimbav"],
    postalCodes: ["500001", "505600"],
    ownerEmail: "owner@example.test",
  },
] as const;

async function main() {
  const passwordHash = await hashPassword("LocalDevOnly!123");
  const users = new Map<string, string>();
  for (const email of ["owner@example.test", "other-owner@example.test"]) {
    const user = await db.user.upsert({
      where: { email },
      update: {},
      create: { email, passwordHash },
    });
    users.set(email, user.id);
  }
  for (const [position, item] of examples.entries()) {
    const template = getTemplate(item.industry);
    const modules = template.modules.map((module, sortOrder) => {
      let config = module.config as Record<string, unknown>;
      if (module.type === "CALL_WHATSAPP") {
        config = {
          ...config,
          whatsappMessage: `Hi, I found ${item.name} and would like a quote.`,
        };
      }
      if (module.type === "SERVICE_AREA") {
        config = {
          ...config,
          areas: item.areas.map((name, index) => ({
            id: `area_${index + 1}`,
            name,
          })),
          postalCodes: item.postalCodes.map((display, index) => ({
            id: `postcode_${index + 1}`,
            display,
            normalized: display.toUpperCase().replace(/[\s-]+/g, ""),
          })),
        };
      }
      if (module.type === "FAQ") {
        const faqs = (config.suggestedFaqs as Array<{ question: string }>).map(
          ({ question }) => ({
            question,
            answer: `Call or message ${item.name} and we’ll confirm the details for your job.`,
          }),
        );
        config = { ...config, suggestedFaqs: faqs };
      }
      return {
        type: module.type,
        enabled: module.enabled,
        sortOrder,
        config: JSON.stringify(config),
      };
    });
    const ownerId = users.get(item.ownerEmail)!;
    const profile = {
      name: item.name,
      industry: item.industry,
      email: item.ownerEmail,
      phone: item.phone,
      whatsapp: item.phone,
      website: "https://example.com",
      googleReviewUrl: "https://www.google.com/maps",
      description: item.description,
      brandColor: item.color,
      primaryAction: template.defaultPrimaryAction,
      published:
        position === 0 ||
        item.industry === "CLEANING" ||
        item.industry === "PRESSURE_WASHING",
      onboardingStep: 7,
    };
    await db.business.upsert({
      where: { slug: item.slug },
      update: {
        ...profile,
        memberships: {
          deleteMany: {},
          create: { userId: ownerId, role: "OWNER" },
        },
        modules: { deleteMany: {}, create: modules },
      },
      create: {
        slug: item.slug,
        ...profile,
        memberships: { create: { userId: ownerId, role: "OWNER" } },
        modules: { create: modules },
      },
    });
  }
}

main().finally(() => db.$disconnect());
