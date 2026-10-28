import {
  DEMO_GUESTS,
  findDemoGuest,
  guestDisplayName,
  pinnedDemoGuests,
} from '@/demo/demo-guests';
import { isDemoGuestPanelEnabled, learningTopic } from '@/demo/guest-session';

describe('Recology demo guests', () => {
  it('pins all five CDP guests with Segment and Location', () => {
    const pinned = pinnedDemoGuests();
    expect(pinned).toHaveLength(5);
    expect(pinned.map((guest) => guest.segment)).toEqual([
      'Prospective New Mover',
      'New Customer First 90 Days',
      'Established Resident',
      'Business Multifamily',
      'Contractor',
    ]);
    expect(pinned.map((guest) => guest.location)).toEqual([
      'American Canyon',
      'American Canyon',
      'San Bruno',
      'American Canyon',
      'San Bruno',
    ]);
  });

  it('finds guests by email used for Sitecore lookup', () => {
    const marco = findDemoGuest('marco.rios@recology-demo.com');
    expect(marco?.segment).toBe('Prospective New Mover');
    expect(guestDisplayName(marco!)).toBe('Marco Rios');
    expect(DEMO_GUESTS).toHaveLength(5);
  });

  it('enables the panel in development by default', () => {
    expect(isDemoGuestPanelEnabled(undefined, 'development', null)).toBe(true);
    expect(isDemoGuestPanelEnabled(undefined, 'production', null)).toBe(false);
    expect(isDemoGuestPanelEnabled('true', 'production', null)).toBe(true);
    expect(isDemoGuestPanelEnabled(undefined, 'development', '0')).toBe(false);
  });

  it('maps Recology paths to visit learning topics', () => {
    expect(learningTopic('/Location/Recology-American-Canyon/Pay-My-Bill')).toBe(
      'billing interest'
    );
    expect(learningTopic('/customer-service/request-debris-box')).toBe('debris box interest');
  });
});
