# Adding New Golf Clubs

This application supports multiple golf clubs with their own branding and course data.

## How to Add a New Golf Club

1. **Open the golf clubs data file**: [src/golfClubsData.js](src/golfClubsData.js)

2. **Add a new club entry** in the `golfClubs` object:

```javascript
export const golfClubs = {
  // ... existing clubs ...

  yourclub: {
    id: 'yourclub',                    // Unique identifier (lowercase, no spaces)
    name: 'Your Golf Club Name',       // Display name
    logo: 'your-logo.png',             // Logo filename (place in /public folder)
    favicon: '/favicon-yourclub.ico',  // Optional: custom favicon

    tees: {
      // Add as many tees as needed
      blue: {
        name: 'Blue',                  // Display name for this tee
        color: '#0000FF',              // CSS color for visual indicator

        men: {
          '18': { slope: 130, cr: 72.0, par: 72 },    // 18 hole data
          '9f': { slope: 128, cr: 36.0, par: 36 },    // Front 9 data
          '9b': { slope: 132, cr: 36.0, par: 36 }     // Back 9 data
        },
        ladies: {
          '18': { slope: 140, cr: 75.0, par: 72 },
          '9f': { slope: 138, cr: 37.5, par: 36 },
          '9b': { slope: 142, cr: 37.5, par: 36 }
        }
      },

      white: {
        name: 'White',
        color: '#FFFFFF',
        // ... same structure as above
      }
    },

    defaultTee: 'blue'  // The default tee selection for new players
  }
}
```

## Required Course Data

For each tee and gender combination, you need to provide:

- **slope**: Course slope rating
- **cr**: Course rating
- **par**: Course par

This data should be provided for:
- **18 holes** (`'18'`)
- **Front 9** (`'9f'`)
- **Back 9** (`'9b'`)

## Adding Club Logos

1. Place your logo image in the `/public` folder
2. Reference it in the club configuration (e.g., `logo: 'myclub-logo.png'`)
3. Recommended format: PNG with transparent background
4. Recommended size: 200x200 pixels or similar square aspect ratio

## Adding Favicons (Optional)

1. Create a favicon for your club
2. Place it in the `/public` folder
3. Reference it in the club configuration (e.g., `favicon: '/favicon-myclub.ico'`)

## Example: Complete Club Entry

See the 'hindhead' and 'example' clubs in [src/golfClubsData.js](src/golfClubsData.js) for complete working examples.

## Tee Colors

Common tee colors for reference:
- Black: `#000000`
- Blue: `#0000FF`
- White: `#FFFFFF`
- Yellow: `#FFD700`
- Gold: `#FFD700`
- Red: `#DC143C`
- Orange: `#FF8C00`
- Green: `#008000`

You can use any CSS color value (hex, rgb, named colors, etc.)
