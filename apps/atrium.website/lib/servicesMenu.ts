// The Services menu (desktop mega menu and phone menu), organized by the Atrium platform's six engines.
// Engine names match app.atriumad.com (Discoverability, Attention, Growth, Reputation, Retention, Reporting).
// Each service pairs a plain word with the professional term, and its line says what the owner gets.

export type MenuIcon =
  | 'MapPin' | 'Globe' | 'Clapperboard' | 'Sparkles' | 'Users' | 'Compass' | 'Target' | 'PartyPopper'
  | 'Star' | 'ClipboardCheck' | 'Mail' | 'HeartHandshake' | 'LineChart' | 'Map' | 'Swords' | 'Activity' | 'HeartPulse'

export type MenuService = { name: string; line: string; href: string; icon: MenuIcon; external?: boolean }
export type MenuEngine = { name: string; services: MenuService[] }
export type MenuColumn = { pillClass: string; engines: MenuEngine[] }

// Column colours follow the old Generate / Convert / Retain pills: lime, amber, green.
export const SERVICE_MENU: MenuColumn[] = [
  {
    pillClass: 'bg-lime text-charcoal',
    engines: [
      {
        name: 'Discoverability',
        services: [
          { name: 'Google, Maps and Local SEO', line: 'Show up when they search “near me”', href: '/services/google-seo', icon: 'MapPin' },
          { name: 'Website and Tracking', line: 'A site that takes orders and bookings', href: '/services/analytics', icon: 'Globe' },
        ],
      },
      {
        name: 'Attention',
        services: [
          { name: 'Photo and Video Production', line: 'Shot on location, in your kitchen', href: '/services/film-photo', icon: 'Clapperboard' },
          { name: 'Social Media and Content', line: 'Posts that make people hungry', href: '/services/social-media', icon: 'Sparkles' },
          { name: 'Local Creators and UGC', line: 'Food creators who visit and post', href: 'https://forkandfilm.com', icon: 'Users', external: true },
          { name: 'Branding and Creative', line: 'How you look and sound', href: '/services/brand-strategy', icon: 'Compass' },
        ],
      },
    ],
  },
  {
    pillClass: 'bg-amber text-charcoal',
    engines: [
      {
        name: 'Growth',
        services: [
          { name: 'Ads and Paid Media', line: 'Campaigns for events, catering and reservations', href: '/services/paid-media', icon: 'Target' },
          { name: 'Events and Collabs', line: 'Launches, pop-ups and partnerships', href: '/services/experiential', icon: 'PartyPopper' },
        ],
      },
      {
        name: 'Reputation',
        services: [
          { name: 'Reviews and Reputation', line: 'More 5 stars, every review answered', href: '/services/reputation', icon: 'Star' },
          { name: 'Guest Surveys and NPS', line: 'Know what guests really think', href: '/services/reputation', icon: 'ClipboardCheck' },
        ],
      },
    ],
  },
  {
    pillClass: 'bg-green text-cream',
    engines: [
      {
        name: 'Retention',
        services: [
          { name: 'Email and SMS Marketing', line: 'Fill slow nights with one message', href: '/services/email-sms', icon: 'Mail' },
          { name: 'Loyalty and CRM', line: 'Turn first-timers into regulars', href: '/services/crm-loyalty', icon: 'HeartHandshake' },
        ],
      },
      {
        name: 'Reporting',
        services: [
          { name: 'Reports and Dashboard', line: 'Monthly reports, wins and one live view', href: '/services/analytics', icon: 'LineChart' },
          { name: 'Market Analysis', line: 'Your audience within 5 miles', href: '/services/analytics', icon: 'Map' },
          { name: 'Competitor Analysis', line: 'How you compare, week by week', href: '/services/analytics', icon: 'Swords' },
          { name: 'Customer Signals', line: 'From seen, to visited, to booked', href: '/services/analytics', icon: 'Activity' },
          { name: 'Brand Health Check', line: 'What guests see before they come', href: '/services/analytics', icon: 'HeartPulse' },
        ],
      },
    ],
  },
]

export const SERVICE_MENU_FOOTER = [
  { name: 'Free marketing score', line: 'See where you stand in minutes', href: 'https://grader.atriumad.com', external: true },
  { name: 'Case studies', line: 'Restaurants we’ve grown', href: '/work', external: false },
] as const
