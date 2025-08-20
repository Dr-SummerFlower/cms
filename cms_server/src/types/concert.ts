import { Concert } from '../concerts/entities/concert.entity';

export interface ConcertQueryFilter {
  status?: 'upcoming' | 'ongoing' | 'completed';
  name?: {
    $regex: string;
    $options: string;
  };
  date?: Date | { $gte?: Date; $lte?: Date };
  venue?:
    | string
    | {
        $regex: string;
        $options: string;
      };
}

export interface ConcertsReminder {
  concert: Concert;
  userEmails: string[];
}
