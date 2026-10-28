/**
 * Imported Recology guests for the demo panel.
 * Emails match docs/ai/examples/example.jsonl (Segment + Location extensions).
 * The panel reads this catalog in the browser. It does not call the Profile Import API.
 */
export interface DemoGuest {
  email: string;
  firstName: string;
  lastName: string;
  segment: string;
  location: string;
  primaryInterest: string;
  seasonalCampaign: string;
  engagementLevel: string;
  nextBestAction?: string;
  contentAffinity?: string;
}

/** All five CDP demo guests are pinned in the switcher. */
export const PINNED_DEMO_GUEST_EMAILS = [
  'marco.rios@recology-demo.com',
  'priya.chen@recology-demo.com',
  'elena.morales@recology-demo.com',
  'james.okonkwo@recology-demo.com',
  'diego.santos@recology-demo.com',
] as const;

export const DEMO_GUESTS: DemoGuest[] = [
  {
    email: 'marco.rios@recology-demo.com',
    firstName: 'Marco',
    lastName: 'Rios',
    segment: 'Prospective New Mover',
    location: 'American Canyon',
    primaryInterest: 'Start Service',
    seasonalCampaign: 'New Mover Welcome',
    engagementLevel: 'Low',
    nextBestAction:
      'Show American Canyon start-service hero with cart sizes, residential rates, and contact CTA',
    contentAffinity: 'Start-Service Pages',
  },
  {
    email: 'priya.chen@recology-demo.com',
    firstName: 'Priya',
    lastName: 'Chen',
    segment: 'New Customer First 90 Days',
    location: 'American Canyon',
    primaryInterest: 'Sorting Help',
    seasonalCampaign: 'New Customer Onboarding',
    engagementLevel: 'Medium',
    nextBestAction:
      'Surface What Bin and sorting guides to reduce first-month contamination before day 90',
    contentAffinity: 'What Bin and Sorting Guides',
  },
  {
    email: 'elena.morales@recology-demo.com',
    firstName: 'Elena',
    lastName: 'Morales',
    segment: 'Established Resident',
    location: 'San Bruno',
    primaryInterest: 'Pay My Bill',
    seasonalCampaign: 'Holiday Collection Reminder',
    engagementLevel: 'High',
    nextBestAction: 'Promote Pay My Bill and holiday/bulky FAQ for returning portal visitors',
    contentAffinity: 'Customer Portal Pages',
  },
  {
    email: 'james.okonkwo@recology-demo.com',
    firstName: 'James',
    lastName: 'Okonkwo',
    segment: 'Business Multifamily',
    location: 'American Canyon',
    primaryInterest: 'Commercial Services',
    seasonalCampaign: 'Organics Compliance Reminder',
    engagementLevel: 'High',
    nextBestAction:
      'Swap to Business Multifamily MultiPromo with commercial rates and organics compliance CTAs',
    contentAffinity: 'Business and Commercial Content',
  },
  {
    email: 'diego.santos@recology-demo.com',
    firstName: 'Diego',
    lastName: 'Santos',
    segment: 'Contractor',
    location: 'San Bruno',
    primaryInterest: 'Debris Boxes',
    seasonalCampaign: 'Trade Debris Box Promo',
    engagementLevel: 'Medium',
    nextBestAction:
      'Show Contractor Debris Box hero and MultiPromo with fast order / customer service CTAs',
    contentAffinity: 'Debris Box Pages',
  },
];

const pinnedEmails = new Set<string>(PINNED_DEMO_GUEST_EMAILS);

export const findDemoGuest = (email: string | null | undefined): DemoGuest | undefined => {
  if (!email) return undefined;
  return DEMO_GUESTS.find((guest) => guest.email === email);
};

export const pinnedDemoGuests = (): DemoGuest[] =>
  PINNED_DEMO_GUEST_EMAILS.map((email) => findDemoGuest(email)).filter(
    (guest): guest is DemoGuest => Boolean(guest)
  );

export const moreDemoGuests = (): DemoGuest[] =>
  DEMO_GUESTS.filter((guest) => !pinnedEmails.has(guest.email));

export const guestDisplayName = (guest: DemoGuest): string =>
  `${guest.firstName} ${guest.lastName}`;
