import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Couple, Memory, LoveLetter, MoodLog, BucketItem, Countdown, MoodType, IQDuelAnswer, LiveGameRoom, QuizCategoryId } from '@/types';

interface LDRState {
  currentUser: User;
  partner: User;
  couple: Couple;
  memories: Memory[];
  loveLetters: LoveLetter[];
  moods: Record<string, MoodLog>; // user_id -> latest MoodLog
  bucketList: BucketItem[];
  countdowns: Countdown[];
  activePartnerId: string; // allows toggling between viewing as Partner 1 or Partner 2

  // Games State
  quizAnswers: Record<string, Record<string, number>>; // questionId -> { [userId]: optionIndex }
  iqDuelAnswers: Record<string, Record<string, IQDuelAnswer>>; // matchId -> { [userId_questionId]: IQDuelAnswer }
  riddlesSolved: Record<string, boolean>; // `${riddleId}_${userId}` -> boolean
  activeGameRoom: LiveGameRoom | null;

  // Actions
  setAuthenticatedUser: (user: User, partner: User | null, couple: Couple) => void;
  logoutUser: () => void;
  switchActiveUser: (userId: string) => void;
  updateCoupleStartDate: (date: string) => void;
  addMemory: (memory: Omit<Memory, 'id' | 'created_at' | 'couple_id'>) => void;
  deleteMemory: (id: string) => void;
  addLoveLetter: (letter: Omit<LoveLetter, 'id' | 'created_at' | 'couple_id'>) => void;
  deleteLoveLetter: (id: string) => void;
  markLetterRead: (id: string) => void;
  setMood: (mood: MoodType, note?: string) => void;
  toggleBucketItem: (id: string) => void;
  addBucketItem: (item: Omit<BucketItem, 'id' | 'created_at' | 'couple_id' | 'completed'>) => void;
  deleteBucketItem: (id: string) => void;
  addCountdown: (countdown: Omit<Countdown, 'id' | 'created_at' | 'couple_id'>) => void;
  deleteCountdown: (id: string) => void;
  pairWithCode: (code: string) => boolean;

  // Games Actions
  answerQuizQuestion: (questionId: string, optionIndex: number) => void;
  saveIQDuelAnswer: (matchId: string, questionId: string, selectedIndex: number, timeTaken: number) => void;
  solveRiddle: (riddleId: string) => void;
  resetIQDuelMatch: (matchId: string) => void;
  createGameRoom: (gameType: 'know-me' | 'iq-duel' | 'riddle-night', category?: QuizCategoryId) => LiveGameRoom;
  joinGameRoom: (roomCode: string) => boolean;
  leaveGameRoom: () => void;
}

const ALEX: User = {
  id: 'user-alex-101',
  name: 'Alex Rivera',
  email: 'alex@ldr-love.com',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  created_at: '2025-11-20T00:00:00.000Z',
};

const TAYLOR: User = {
  id: 'user-taylor-102',
  name: 'Taylor Vance',
  email: 'taylor@ldr-love.com',
  avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  created_at: '2025-11-20T00:00:00.000Z',
};

// Calculate relationship start date ~ 245 days ago
const defaultStartDate = new Date(Date.now() - 245 * 24 * 60 * 60 * 1000).toISOString();

const INITIAL_COUPLE: Couple = {
  id: 'couple-alex-taylor-88',
  partner_one: ALEX,
  partner_two: TAYLOR,
  relationship_start_date: defaultStartDate,
  invite_code: 'LDR-892',
  is_connected: true,
};

const INITIAL_MEMORIES: Memory[] = [];

const INITIAL_LOVE_LETTERS: LoveLetter[] = [];

const INITIAL_MOODS: Record<string, MoodLog> = {};

const INITIAL_BUCKET_LIST: BucketItem[] = [];

const INITIAL_COUNTDOWNS: Countdown[] = [
  {
    id: 'cd-1',
    couple_id: INITIAL_COUPLE.id,
    title: 'Next Airport Visit ✈️',
    target_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'visit',
    icon: 'Plane',
    created_by: ALEX.id,
    created_at: '2026-07-01T00:00:00.000Z',
  },
  {
    id: 'cd-2',
    couple_id: INITIAL_COUPLE.id,
    title: 'Relationship Anniversary ❤️',
    target_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'anniversary',
    icon: 'Heart',
    created_by: TAYLOR.id,
    created_at: '2026-07-01T00:00:00.000Z',
  },
  {
    id: 'cd-3',
    couple_id: INITIAL_COUPLE.id,
    title: "Taylor's Birthday 🎉",
    target_date: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'birthday',
    icon: 'Cake',
    created_by: ALEX.id,
    created_at: '2026-07-10T00:00:00.000Z',
  },
];

export const useLDRStore = create<LDRState>()(
  persist(
    (set, get) => ({
      currentUser: ALEX,
      partner: TAYLOR,
      couple: INITIAL_COUPLE,
      memories: INITIAL_MEMORIES,
      loveLetters: INITIAL_LOVE_LETTERS,
      moods: INITIAL_MOODS,
      bucketList: INITIAL_BUCKET_LIST,
      countdowns: INITIAL_COUNTDOWNS,
      activePartnerId: ALEX.id,

      // Games Initial State
      quizAnswers: {
        'km-ld-1': { [ALEX.id]: 0, [TAYLOR.id]: 0 },
        'km-pc-1': { [ALEX.id]: 1 },
      },
      iqDuelAnswers: {},
      riddlesSolved: {
        [`rd-1_${ALEX.id}`]: true,
      },
      activeGameRoom: null,

      setAuthenticatedUser: (user: User, partnerUser: User | null, coupleData: Couple) => {
        set({
          currentUser: user,
          partner: partnerUser || {
            id: 'waiting-partner',
            name: 'Waiting for Partner...',
            email: '',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
            created_at: new Date().toISOString(),
          },
          couple: coupleData,
          activePartnerId: user.id,
        });
      },

      logoutUser: () => {
        set({
          currentUser: ALEX,
          partner: TAYLOR,
          couple: INITIAL_COUPLE,
          activePartnerId: ALEX.id,
          activeGameRoom: null,
        });
      },

      switchActiveUser: (userId: string) => {
        if (userId === ALEX.id) {
          set({ currentUser: ALEX, partner: TAYLOR, activePartnerId: ALEX.id });
        } else {
          set({ currentUser: TAYLOR, partner: ALEX, activePartnerId: TAYLOR.id });
        }
      },

      updateCoupleStartDate: (date: string) => {
        set((state) => ({
          couple: { ...state.couple, relationship_start_date: date },
        }));
      },

      addMemory: (memoryData) => {
        const newMemory: Memory = {
          ...memoryData,
          id: `mem-${Date.now()}`,
          couple_id: get().couple.id,
          created_at: new Date().toISOString(),
        };
        set((state) => ({ memories: [newMemory, ...state.memories] }));
      },

      deleteMemory: (id: string) => {
        set((state) => ({ memories: state.memories.filter((m) => m.id !== id) }));
      },

      addLoveLetter: (letterData) => {
        const newLetter: LoveLetter = {
          ...letterData,
          id: `letter-${Date.now()}`,
          couple_id: get().couple.id,
          created_at: new Date().toISOString(),
          is_read: false,
        };
        set((state) => ({ loveLetters: [newLetter, ...state.loveLetters] }));
      },

      deleteLoveLetter: (id: string) => {
        set((state) => ({ loveLetters: state.loveLetters.filter((l) => l.id !== id) }));
      },

      markLetterRead: (id: string) => {
        set((state) => ({
          loveLetters: state.loveLetters.map((l) => (l.id === id ? { ...l, is_read: true } : l)),
        }));
      },

      setMood: (mood: MoodType, note?: string) => {
        const userId = get().currentUser.id;
        const newMoodLog: MoodLog = {
          id: `mood-${Date.now()}`,
          user_id: userId,
          mood,
          note,
          created_at: new Date().toISOString(),
        };

        set((state) => ({
          moods: {
            ...state.moods,
            [userId]: newMoodLog,
          },
        }));
      },

      toggleBucketItem: (id: string) => {
        set((state) => ({
          bucketList: state.bucketList.map((item) => {
            if (item.id === id) {
              const nextCompleted = !item.completed;
              return {
                ...item,
                completed: nextCompleted,
                completed_at: nextCompleted ? new Date().toISOString() : undefined,
              };
            }
            return item;
          }),
        }));
      },

      addBucketItem: (itemData) => {
        const newItem: BucketItem = {
          ...itemData,
          id: `b-${Date.now()}`,
          couple_id: get().couple.id,
          completed: false,
          created_at: new Date().toISOString(),
        };
        set((state) => ({ bucketList: [...state.bucketList, newItem] }));
      },

      deleteBucketItem: (id: string) => {
        set((state) => ({ bucketList: state.bucketList.filter((b) => b.id !== id) }));
      },

      addCountdown: (countdownData) => {
        const newCountdown: Countdown = {
          ...countdownData,
          id: `cd-${Date.now()}`,
          couple_id: get().couple.id,
          created_at: new Date().toISOString(),
        };
        set((state) => ({ countdowns: [...state.countdowns, newCountdown] }));
      },

      deleteCountdown: (id: string) => {
        set((state) => ({ countdowns: state.countdowns.filter((c) => c.id !== id) }));
      },

      pairWithCode: (code: string) => {
        if (!code || code.trim() === '') return false;
        set((state) => ({
          couple: {
            ...state.couple,
            invite_code: code.toUpperCase(),
            is_connected: true,
          },
        }));
        return true;
      },

      // Games Actions Implementation
      answerQuizQuestion: (questionId: string, optionIndex: number) => {
        const userId = get().currentUser.id;
        set((state) => ({
          quizAnswers: {
            ...state.quizAnswers,
            [questionId]: {
              ...(state.quizAnswers[questionId] || {}),
              [userId]: optionIndex,
            },
          },
        }));
      },

      saveIQDuelAnswer: (matchId: string, questionId: string, selectedIndex: number, timeTaken: number) => {
        const userId = get().currentUser.id;
        const key = `${userId}_${questionId}`;
        const answerObj: IQDuelAnswer = {
          user_id: userId,
          question_id: questionId,
          selected_index: selectedIndex,
          time_taken: timeTaken,
          is_locked: true,
        };

        set((state) => ({
          iqDuelAnswers: {
            ...state.iqDuelAnswers,
            [matchId]: {
              ...(state.iqDuelAnswers[matchId] || {}),
              [key]: answerObj,
            },
          },
        }));
      },

      solveRiddle: (riddleId: string) => {
        const userId = get().currentUser.id;
        const key = `${riddleId}_${userId}`;
        set((state) => ({
          riddlesSolved: {
            ...state.riddlesSolved,
            [key]: true,
          },
        }));
      },

      resetIQDuelMatch: (matchId: string) => {
        set((state) => ({
          iqDuelAnswers: {
            ...state.iqDuelAnswers,
            [matchId]: {},
          },
        }));
      },

      createGameRoom: (gameType, category) => {
        const userId = get().currentUser.id;
        const coupleId = get().couple.id;
        const inviteCode = get().couple.invite_code;
        const roomCode = `ROOM-${inviteCode}`;

        const newRoom: LiveGameRoom = {
          roomCode,
          couple_id: coupleId,
          gameType,
          category,
          hostUserId: userId,
          status: 'waiting',
          created_at: new Date().toISOString(),
        };

        set({ activeGameRoom: newRoom });
        return newRoom;
      },

      joinGameRoom: (code: string) => {
        const coupleInvite = get().couple.invite_code;
        const validCode = `ROOM-${coupleInvite}`;

        if (code.toUpperCase().trim() === validCode || code.toUpperCase().trim() === coupleInvite) {
          const currentRoom = get().activeGameRoom;
          if (currentRoom) {
            set({ activeGameRoom: { ...currentRoom, status: 'in_progress' } });
          } else {
            const newRoom: LiveGameRoom = {
              roomCode: validCode,
              couple_id: get().couple.id,
              gameType: 'know-me',
              hostUserId: get().partner.id,
              status: 'in_progress',
              created_at: new Date().toISOString(),
            };
            set({ activeGameRoom: newRoom });
          }
          return true;
        }
        return false;
      },

      leaveGameRoom: () => {
        set({ activeGameRoom: null });
      },
    }),
    {
      name: 'ldr-app-storage-v3',
    }
  )
);
