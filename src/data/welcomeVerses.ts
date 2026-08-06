interface WelcomeVerse {
  text: string;
  reference: string;
  category: string;
}

export const WELCOME_VERSES: WelcomeVerse[] = [
  { text: 'Let every thing that hath breath praise the LORD.', reference: 'Psalm 150:6', category: 'Praise' },
  { text: 'Serve the LORD with gladness: come before his presence with singing.', reference: 'Psalm 100:2', category: 'Praise' },
  { text: 'O sing unto the LORD a new song: sing unto the LORD, all the earth.', reference: 'Psalm 96:1', category: 'Praise' },
  { text: 'O come, let us worship and bow down: let us kneel before the LORD our maker.', reference: 'Psalm 95:6', category: 'Worship' },
  { text: 'God is a Spirit: and they that worship him must worship him in spirit and in truth.', reference: 'John 4:24', category: 'Worship' },
  { text: 'I will bless the LORD at all times: his praise shall continually be in my mouth.', reference: 'Psalm 34:1', category: 'Worship' },
  { text: 'Speaking to yourselves in psalms and hymns and spiritual songs, singing and making melody in your heart to the Lord.', reference: 'Ephesians 5:19', category: 'Hymns & Singing' },
  { text: 'Let the word of Christ dwell in you richly in all wisdom; teaching and admonishing one another in psalms and hymns and spiritual songs, singing with grace in your hearts to the Lord.', reference: 'Colossians 3:16', category: 'Hymns & Singing' },
  { text: 'I will sing unto the LORD as long as I live: I will sing praise to my God while I have my being.', reference: 'Psalm 104:33', category: 'Hymns & Singing' },
  { text: 'I beseech you therefore, brethren, by the mercies of God, that ye present your bodies a living sacrifice, holy, acceptable unto God, which is your reasonable service.', reference: 'Romans 12:1', category: 'Devotion' },
  { text: 'Because thy lovingkindness is better than life, my lips shall praise thee.', reference: 'Psalm 63:3', category: 'Devotion' },
  { text: 'Bless the LORD, O my soul: and all that is within me, bless his holy name.', reference: 'Psalm 103:1', category: 'Thanksgiving' },
  { text: 'By him therefore let us offer the sacrifice of praise to God continually, that is, the fruit of our lips giving thanks to his name.', reference: 'Hebrews 13:15', category: 'Thanksgiving' },
];