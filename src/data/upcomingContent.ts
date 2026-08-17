export type ContentCategory =
  | 'fasting_program'
  | 'devotional'
  | 'book'
  | 'sermon'
  | 'bible_study'
  | 'church_program'
  | 'publication';

export type ContentStatus = 'upcoming' | 'available' | 'completed';

export interface UpcomingContent {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  image?: string;
  category: ContentCategory;
  startDate?: string;
  endDate?: string;
  releaseDate: string;
  status: ContentStatus;
  isAvailable: boolean;
}

function computeStatus(item: UpcomingContent): UpcomingContent {
  const now = new Date();
  const release = new Date(item.releaseDate);
  const end = item.endDate ? new Date(item.endDate) : null;

  let status: ContentStatus;
  let isAvailable: boolean;

  if (now < release) {
    status = 'upcoming';
    isAvailable = false;
  } else if (end && now > end) {
    status = 'completed';
    isAvailable = true;
  } else {
    status = 'available';
    isAvailable = true;
  }

  return { ...item, status, isAvailable };
}

const upcomingItems: UpcomingContent[] = [
  {
    id: 'fasting-2027',
    title: '40 Days Fasting & Prayer',
    subtitle: '2027 Edition',
    description: '40 Days of Fasting, Prayer and Spiritual Renewal.',
    category: 'fasting_program',
    startDate: '2027-02-01',
    endDate: '2027-03-12',
    releaseDate: '2027-02-01',
    status: 'upcoming',
    isAvailable: false,
  },
  {
    id: 'books-akinboye',
    title: 'Books by Prophet D.K. Akinboye',
    description: 'A collection of books and Christian resources by Prophet D.K. Akinboye.',
    category: 'book',
    releaseDate: '2027-01-01',
    status: 'upcoming',
    isAvailable: false,
  },
];

export function getUpcomingContent(): UpcomingContent[] {
  return upcomingItems.map(computeStatus);
}
