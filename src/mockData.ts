import { Exercise, Meal, Message, WearableStats } from './types';

export const INITIAL_WEARABLES: WearableStats = {
  whoopHrv: 64,
  whoopReadiness: 88,
  ouraSleepScore: 82,
  appleWatchAvgHr: 58,
  lastSynced: 'Just now',
};

export const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    sender: 'coach',
    text: "I've analyzed your WHOOP data from last night. Your HRV is at 64ms, which is slightly lower than your baseline. How are your legs feeling after Tuesday's heavy leg session?",
    timestamp: '09:41 AM',
  },
  {
    id: '2',
    sender: 'user',
    text: 'A bit sore, but ready to move. Should I still push for the 225lb Squat PR today?',
    timestamp: '09:42 AM',
  },
  {
    id: '3',
    sender: 'coach',
    text: "Let's be smart. I've adjusted your intensity. Instead of the PR, we'll do an RPE 7 technique block to reinforce optimal skeletal alignment. I've updated your focus weight inside 'Active Workout'. Let me know if that feels sensible.",
    timestamp: '09:42 AM',
  },
];

export const INITIAL_EXERCISES: Exercise[] = [
  {
    id: 'e1',
    name: 'Barbell Back Squat',
    sets: [
      { setNumber: 1, reps: 10, weight: 135, completed: true },
      { setNumber: 2, reps: 8, weight: 185, completed: true },
      { setNumber: 3, reps: 6, weight: 205, completed: false },
      { setNumber: 4, reps: 6, weight: 205, completed: false },
    ],
    currentSetIndex: 2,
    targetReps: '4 sets × 6-10 reps',
    suggestedWeight: '205 lbs (Adaptive Adjustment)',
    tips: 'Keep chest upright, brace core prior to descent, and push through high-mid foot.',
  },
  {
    id: 'e2',
    name: 'Incline Dumbbell Press',
    sets: [
      { setNumber: 1, reps: 10, weight: 65, completed: false },
      { setNumber: 2, reps: 8, weight: 75, completed: false },
      { setNumber: 3, reps: 8, weight: 75, completed: false },
    ],
    currentSetIndex: 0,
    targetReps: '3 sets × 8-10 reps',
    suggestedWeight: '75 lbs',
    tips: 'Squeeze shoulder blades down and back, control the eccentric contraction to chest level.',
  },
  {
    id: 'e3',
    name: 'Weighted Pull-ups',
    sets: [
      { setNumber: 1, reps: 6, weight: 25, completed: false },
      { setNumber: 2, reps: 6, weight: 25, completed: false },
      { setNumber: 3, reps: 6, weight: 25, completed: false },
    ],
    currentSetIndex: 0,
    targetReps: '3 sets × 6 reps',
    suggestedWeight: '25 lbs (Chained)',
    tips: 'Engage lower traps, pull elbows towards pockets, chest up to bar.',
  }
];

export const INITIAL_MEALS: Meal[] = [
  {
    id: 'm1',
    name: 'Pro-Cardio Post Squat Shake',
    calories: 420,
    protein: 45,
    carbs: 35,
    fat: 6,
    time: '08:15 AM',
  },
  {
    id: 'm2',
    name: 'Grilled Salmon with Quinoa & Asparagus',
    calories: 680,
    protein: 52,
    carbs: 48,
    fat: 22,
    time: '01:30 PM',
  },
];

export const GENERAL_COACH_RESPONSES = [
  "Solid work. Based on your HRV recovery metrics today, we should focus on high movement efficiency with a controller tempo.",
  "That makes perfect sense. Remember to maintain high mechanical tension on the lifting phase. Focus on dynamic power.",
  "My recommendation is to rest 180 seconds between sets here to maximize ATP restoration. Drink some electrolytes.",
  "Excellent attitude. I've updated your daily targets in your timeline. Push hard, but pay close attention to depth feedback!",
  "Make sure to brace against your lifting belt before every eccentric phase. Breathing is your armor under pressure.",
];
