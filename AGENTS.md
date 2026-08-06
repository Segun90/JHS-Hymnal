# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Devotional Visibility Policy

The devotional module must never reveal the total number of devotionals stored in the application.

Do NOT display:

- Day 1 of 157
- Day 45 of 157
- Progress percentages
- Total devotional count
- Collection size

The devotional should feel like a living publication that is released one day at a time.

The user should only know:

- Today's devotional is available.
- Tomorrow's devotional is coming.
- Future devotionals will be available later.

The application may internally track progression using SQLite, but this information must remain hidden from the user.

The Home screen should display:

- Greeting
- Current date
- "Today's Devotional"
- Read button

After the user completes today's devotional, display:

"Today's devotional completed."

"Tomorrow's devotional will be available at your selected reminder time."

Do not display the next devotional's title, scripture, or content until it is unlocked.

The devotional calendar should only show:

- Yesterday (Completed)
- Today (Available or Completed)
- Tomorrow (Locked)
- Optionally one additional future placeholder

Never show a list of all devotionals.

Never reveal how many devotionals exist.

The goal is to create the feeling that the church lovingly prepares and releases one devotional each day, even though the content is stored offline.
