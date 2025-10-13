// Golf Clubs Configuration Data

export const golfClubs = {
  hindhead: {
    id: 'hindhead',
    name: 'Hindhead Golf Club',
    logo: 'club-logo-nobg.png',
    favicon: '/favicon-hindhead.ico',

    // Tee configuration
    tees: {
      navy: {
        name: 'Navy',
        color: '#000080',
        men: {
          '18': { slope: 125, cr: 71.3, par: 70 },
          '9f': { slope: 126, cr: 35.6, par: 35 },
          '9b': { slope: 125, cr: 35.6, par: 35 }
        },
        ladies: {
          '18': { slope: 137, cr: 77.0, par: 72 },
          '9f': { slope: 136, cr: 38.4, par: 36 },
          '9b': { slope: 139, cr: 38.6, par: 36 }
        }
      },
      silver: {
        name: 'Silver',
        color: '#C0C0C0',
        men: {
          '18': { slope: 121, cr: 69.9, par: 70 },
          '9f': { slope: 119, cr: 34.7, par: 35 },
          '9b': { slope: 123, cr: 35.2, par: 35 }
        },
        ladies: {
          '18': { slope: 142, cr: 75.3, par: 72 },
          '9f': { slope: 137, cr: 37.6, par: 36 },
          '9b': { slope: 146, cr: 37.7, par: 36 }
        }
      },
      heather: {
        name: 'Heather',
        color: '#967BB6',
        men: {
          '18': { slope: 127, cr: 72.2, par: 72 },
          '9f': { slope: 124, cr: 34.0, par: 36 },
          '9b': { slope: 116, cr: 34.4, par: 36 }
        },
        ladies: {
          '18': { slope: 130, cr: 73.9, par: 72 },
          '9f': { slope: 129, cr: 37.1, par: 36 },
          '9b': { slope: 131, cr: 36.8, par: 36 }
        }
      }
    },

    // Default tee for new players
    defaultTee: 'navy'
  },

  // Example club - you can add more clubs here
  example: {
    id: 'example',
    name: 'Example Golf Club',
    logo: 'club-logo-nobg.png', // Using same logo for demo - replace with your own
    favicon: '/favicon.ico',

    tees: {
      white: {
        name: 'White',
        color: '#FFFFFF',
        men: {
          '18': { slope: 130, cr: 72.0, par: 72 },
          '9f': { slope: 128, cr: 36.0, par: 36 },
          '9b': { slope: 132, cr: 36.0, par: 36 }
        },
        ladies: {
          '18': { slope: 140, cr: 75.0, par: 72 },
          '9f': { slope: 138, cr: 37.5, par: 36 },
          '9b': { slope: 142, cr: 37.5, par: 36 }
        }
      },
      yellow: {
        name: 'Yellow',
        color: '#FFD700',
        men: {
          '18': { slope: 125, cr: 70.0, par: 72 },
          '9f': { slope: 123, cr: 35.0, par: 36 },
          '9b': { slope: 127, cr: 35.0, par: 36 }
        },
        ladies: {
          '18': { slope: 135, cr: 73.0, par: 72 },
          '9f': { slope: 133, cr: 36.5, par: 36 },
          '9b': { slope: 137, cr: 36.5, par: 36 }
        }
      },
      red: {
        name: 'Red',
        color: '#DC143C',
        men: {
          '18': { slope: 120, cr: 68.0, par: 72 },
          '9f': { slope: 118, cr: 34.0, par: 36 },
          '9b': { slope: 122, cr: 34.0, par: 36 }
        },
        ladies: {
          '18': { slope: 128, cr: 70.0, par: 72 },
          '9f': { slope: 126, cr: 35.0, par: 36 },
          '9b': { slope: 130, cr: 35.0, par: 36 }
        }
      }
    },

    defaultTee: 'white'
  }
}

// Default club if none selected
export const DEFAULT_CLUB_ID = 'hindhead'

// Helper function to get club data
export function getClubData(clubId) {
  return golfClubs[clubId] || golfClubs[DEFAULT_CLUB_ID]
}

// Helper function to get all club options for select dropdown
export function getClubOptions() {
  return Object.values(golfClubs).map(club => ({
    id: club.id,
    name: club.name
  }))
}
