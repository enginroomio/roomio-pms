export type GymClass = {
  id: string;
  name: string;
  instructor: string;
  durationMinutes: number;
  maxParticipants: number;
  schedule: string;
  available: boolean;
};

export type GymConfig = {
  enabled: boolean;
  gymName: string;
  openFrom: string;
  openTo: string;
  allowOnlineBooking: boolean;
  classes: GymClass[];
};

export const DEFAULT_GYM_CONFIG: GymConfig = {
  enabled: true,
  gymName: 'Fitness & Spor Salonu',
  openFrom: '06:00',
  openTo: '22:00',
  allowOnlineBooking: true,
  classes: [
    { id: 'yoga', name: 'Sabah Yoga', instructor: 'Ayşe K.', durationMinutes: 60, maxParticipants: 15, schedule: '07:00', available: true },
    { id: 'pilates', name: 'Pilates', instructor: 'Mehmet D.', durationMinutes: 45, maxParticipants: 12, schedule: '10:00', available: true },
    { id: 'spin', name: 'Spinning', instructor: 'Can Y.', durationMinutes: 45, maxParticipants: 20, schedule: '18:00', available: true },
    { id: 'crossfit', name: 'CrossFit', instructor: 'Selin A.', durationMinutes: 50, maxParticipants: 10, schedule: '19:30', available: true },
  ],
};
