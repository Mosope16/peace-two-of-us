import { QuizCategoryInfo, KnowMeQuestion, IQDuelQuestion, Riddle } from '@/types';

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const QUIZ_CATEGORIES: QuizCategoryInfo[] = [
  {
    id: 'long_distance',
    title: 'Long Distance',
    emoji: '✈️',
    description: 'Airport reunions, time zones, screen dates & late night calls',
    color: 'text-sky-400',
    badgeBg: 'bg-sky-500/10 border-sky-500/30',
  },
  {
    id: 'pop_culture',
    title: 'Pop Culture',
    emoji: '🎬',
    description: 'Movies, music taste, viral trends & celebrity crushes',
    color: 'text-purple-400',
    badgeBg: 'bg-purple-500/10 border-border',
  },
  {
    id: 'most_likely_to',
    title: 'Most Likely To',
    emoji: '👉',
    description: 'Who is most likely to do what? Cast your votes!',
    color: 'text-amber-400',
    badgeBg: 'bg-amber-500/10 border-amber-500/30',
  },
  {
    id: 'cute',
    title: 'Cute & Wholesome',
    emoji: '🥰',
    description: 'Sweet moments, cuddle styles & romantic gestures',
    color: 'text-rose-400',
    badgeBg: 'bg-rose-500/10 border-border',
  },
  {
    id: 'after_dark',
    title: 'After Dark',
    emoji: '🌙',
    description: 'Intimate desires, night vibes & pillow talk confessions',
    is18Plus: true,
    color: 'text-indigo-400',
    badgeBg: 'bg-indigo-500/10 border-indigo-500/30',
  },
  {
    id: 'spicy',
    title: 'Spicy',
    emoji: '🔥',
    description: 'Wild questions, secret turn-ons & bold fantasies',
    is18Plus: true,
    color: 'text-red-400',
    badgeBg: 'bg-red-500/10 border-red-500/30',
  },
  {
    id: 'deep',
    title: 'Deep Questions',
    emoji: '🌊',
    description: 'Core values, life philosophies & vulnerabilities',
    color: 'text-blue-400',
    badgeBg: 'bg-blue-500/10 border-blue-500/30',
  },
  {
    id: 'foodies',
    title: 'Foodies',
    emoji: '🍔',
    description: 'Midnight snacks, dream dinner dates & food habits',
    color: 'text-orange-400',
    badgeBg: 'bg-orange-500/10 border-orange-500/30',
  },
  {
    id: 'firsts_memories',
    title: 'Firsts & Memories',
    emoji: '📸',
    description: 'First impressions, early texts & unforgettable moments',
    color: 'text-pink-400',
    badgeBg: 'bg-pink-500/10 border-border',
  },
  {
    id: 'silly_random',
    title: 'Silly & Random',
    emoji: '🤪',
    description: 'Weird habits, alien theories & hilarious hypotheticals',
    color: 'text-yellow-400',
    badgeBg: 'bg-yellow-500/10 border-yellow-500/30',
  },
  {
    id: 'adventure',
    title: 'Adventure & Travel',
    emoji: '🌍',
    description: 'Bucket list trips, thrill seeking & dream destinations',
    color: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10 border-border',
  },
  {
    id: 'red_flags_icks',
    title: 'Red Flags & Icks',
    emoji: '🚩',
    description: 'Dealbreakers, pet peeves & funny relationship icks',
    color: 'text-rose-600',
    badgeBg: 'bg-rose-900/20 border-rose-600/30',
  },
  {
    id: 'throwback',
    title: 'Throwback Nostalgia',
    emoji: '📼',
    description: 'Childhood memories, old school music & growing up',
    color: 'text-teal-400',
    badgeBg: 'bg-teal-500/10 border-teal-500/30',
  },
  {
    id: 'our_future',
    title: 'Our Future',
    emoji: '✨',
    description: 'Closing the distance, dream home & long term plans',
    color: 'text-violet-400',
    badgeBg: 'bg-violet-500/10 border-violet-500/30',
  },
  {
    id: 'secrets_confessions',
    title: 'Secrets & Confessions',
    emoji: '🤫',
    description: 'Little secrets, funny truths & unspoken thoughts',
    color: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/10 border-cyan-500/30',
  },
  {
    id: 'hot_takes',
    title: 'Hot Takes',
    emoji: '🌶️',
    description: 'Controversial opinions on food, romance & life',
    color: 'text-orange-500',
    badgeBg: 'bg-orange-500/20 border-orange-500/40',
  },
  {
    id: 'what_if',
    title: 'What If...?',
    emoji: '🔮',
    description: 'Wild scenarios, apocalypse partners & time travel',
    color: 'text-fuchsia-400',
    badgeBg: 'bg-fuchsia-500/10 border-fuchsia-500/30',
  },
];

export const KNOW_ME_QUESTIONS: KnowMeQuestion[] = [
  // 1. Long Distance
  {
    id: 'km-ld-1',
    category: 'long_distance',
    question: 'What is my favorite thing to do during our long distance video calls?',
    options: ['Falling asleep together', 'Watching movies/shows together', 'Just talking about our day', 'Eating meals together on camera'],
  },
  {
    id: 'km-ld-2',
    category: 'long_distance',
    question: 'How do I handle missing you the most?',
    options: ['Listen to our playlist', 'Reread old messages & letters', 'Look at our photos', 'Text you right away'],
  },
  {
    id: 'km-ld-3',
    category: 'long_distance',
    question: 'What is my biggest long-distance pet peeve?',
    options: ['Bad Wi-Fi connection during a deep call', 'Time zone math confusion', 'Not being able to give you a real hug', 'Flight delays & airport waits'],
  },
  {
    id: 'km-ld-4',
    category: 'long_distance',
    question: 'Which virtual date idea is my absolute favorite?',
    options: ['Virtual museum / Google Earth tour', 'Online multiplayer gaming session', 'Ordering food to each other\'s doorstep', 'Simultaneous movie watch-party'],
  },
  {
    id: 'km-ld-5',
    category: 'long_distance',
    question: 'What is the first thing I want to do the exact moment we meet at the airport?',
    options: ['Give you the longest tightest hug', 'Kiss you like in a movie', 'Look in your eyes and laugh with joy', 'Grab your hand and head to get food'],
  },

  // 2. Pop Culture
  {
    id: 'km-pc-1',
    category: 'pop_culture',
    question: 'If we were stuck in a movie universe, which one would I pick?',
    options: ['Marvel Cinematic Universe', 'Harry Potter Wizarding World', 'Studio Ghibli / Anime', 'Classic Romantic Comedy'],
  },
  {
    id: 'km-pc-2',
    category: 'pop_culture',
    question: 'What is my ultimate go-to music genre when I am happy?',
    options: ['R&B / Soul', 'Pop / Upbeat', 'Indie / Acoustic', 'Afrobeats / Dancehall'],
  },
  {
    id: 'km-pc-3',
    category: 'pop_culture',
    question: 'Who is my secret celebrity crush that I would never stop talking about?',
    options: ['Zendaya / Timothée Chalamet', 'Michael B. Jordan / Rihanna', 'Ryan Gosling / Margot Robbie', 'Pedro Pascal / Ana de Armas'],
  },
  {
    id: 'km-pc-4',
    category: 'pop_culture',
    question: 'How do I behave when watching a suspenseful horror or thriller movie?',
    options: ['Hide under the blanket & peek', 'Predict every plot twist out loud', 'Super calm & unaffected', 'Scream at jump scares'],
  },
  {
    id: 'km-pc-5',
    category: 'pop_culture',
    question: 'If we made a joint couple TikTok or Reel, what type would it be?',
    options: ['A cute LDR reunion video', 'A funny trending audio joke', 'A travel vlog / aesthetic edit', 'A cooking / food tasting review'],
  },

  // 3. Most Likely To
  {
    id: 'km-ml-1',
    category: 'most_likely_to',
    question: 'Who is most likely to cry during an emotional movie scene?',
    options: ['Alex', 'Taylor', 'Both of us equally', 'Neither of us'],
  },
  {
    id: 'km-ml-2',
    category: 'most_likely_to',
    question: 'Who is most likely to splurge on something unneeded but cute?',
    options: ['Alex', 'Taylor', 'Definitely both', 'Neither'],
  },
  {
    id: 'km-ml-3',
    category: 'most_likely_to',
    question: 'Who is most likely to fall asleep first during a movie night?',
    options: ['Alex', 'Taylor', 'Whoever had a longer day', 'We both stay awake all night'],
  },
  {
    id: 'km-ml-4',
    category: 'most_likely_to',
    question: 'Who is most likely to get lost when navigating in a new city?',
    options: ['Alex', 'Taylor', 'Google Maps glitches on both', 'Neither, we are human GPS'],
  },
  {
    id: 'km-ml-5',
    category: 'most_likely_to',
    question: 'Who is most likely to start a playful food fight in the kitchen?',
    options: ['Alex', 'Taylor', 'Both at the same time', 'We respect food too much'],
  },

  // 4. Cute
  {
    id: 'km-ct-1',
    category: 'cute',
    question: 'What is my absolute favorite physical affection when we are together?',
    options: ['Forehead kisses', 'Holding hands tight', 'Long warm hugs', 'Cuddling under blankets'],
  },
  {
    id: 'km-ct-2',
    category: 'cute',
    question: 'What sweet gesture from you makes my heart melt instantly?',
    options: ['Unexpected good morning texts', 'Remembering a tiny detail I mentioned weeks ago', 'Sending cute photos/selfies randomly', 'Calling me sweet nicknames'],
  },
  {
    id: 'km-ct-3',
    category: 'cute',
    question: 'If I were a cute animal emoji, which one represents me best?',
    options: ['🧸 Teddy bear', '🐱 Cozy kitten', '🐶 Playful puppy', '🐰 Bunny'],
  },
  {
    id: 'km-ct-4',
    category: 'cute',
    question: 'What is my favorite nickname you call me?',
    options: ['Babe / Baby', 'My love', 'Honey / Sweetheart', 'A unique private nickname'],
  },

  // 5. After Dark (18+)
  {
    id: 'km-ad-1',
    category: 'after_dark',
    question: 'What late night mood fits me best when we are together in person?',
    options: ['Sweet & slow romance', 'Playful & teasing', 'Passionate & intense', 'Deep pillow talk till morning'],
  },
  {
    id: 'km-ad-2',
    category: 'after_dark',
    question: 'What is my favorite time of night for intimate conversations?',
    options: ['Right before falling asleep', '1 AM midnight vibe', '3 AM deep hours', 'Early morning right after waking up'],
  },
  {
    id: 'km-ad-3',
    category: 'after_dark',
    question: 'When we are physically together, what setting is most romantic to me?',
    options: ['Dim candlelight with soft music', 'Rainy night with cozy blankets', 'Moonlight view by the window', 'Warm bubble bath together'],
  },

  // 6. Spicy (18+)
  {
    id: 'km-sp-1',
    category: 'spicy',
    question: 'What turns me on the quickest?',
    options: ['A deep sultry voice over the phone', 'Unexpected romantic touch', 'Flirty tease texts during the day', 'Getting dressed up elegant'],
  },
  {
    id: 'km-sp-2',
    category: 'spicy',
    question: 'What is my favorite type of spicy text from you?',
    options: ['Teasing photos / outfit peeks', 'Bold confessions of what you want to do', 'Audio voice notes', 'Flirty countdown reminders'],
  },
  {
    id: 'km-sp-3',
    category: 'spicy',
    question: 'What is a spicy fantasy location we should try when we meet?',
    options: ['Private beach at sunset', 'Luxury hotel room balcony', 'Cozy cabin hot tub', 'Surprise road trip car stop'],
  },

  // 7. Deep
  {
    id: 'km-dp-1',
    category: 'deep',
    question: 'What do I value most in a lifelong partnership?',
    options: ['Unconditional trust & honesty', 'Deep emotional intimacy', 'Laughter & shared joy', 'Growth & mutual support'],
  },
  {
    id: 'km-dp-2',
    category: 'deep',
    question: 'What is my biggest personal fear about the future?',
    options: ['Not fulfilling my potential', 'Losing people I love', 'Getting stuck in routine', 'Financial instability'],
  },
  {
    id: 'km-dp-3',
    category: 'deep',
    question: 'When I am overwhelmed or stressed, how do I prefer to be comforted?',
    options: ['Give me space to process first', 'Listen to me vent without judgment', 'Distract me with humor and fun', 'Hold me tightly in silence'],
  },

  // 8. Foodies
  {
    id: 'km-fd-1',
    category: 'foodies',
    question: 'What is my ultimate late-night comfort craving?',
    options: ['Ice cream / Sweets', 'Pizza / Cheesy bite', 'Spicy ramen or noodles', 'Crispy fries / Burgers'],
  },
  {
    id: 'km-fd-2',
    category: 'foodies',
    question: 'If we could only eat one cuisine together for a whole month, what would I pick?',
    options: ['Italian (Pasta & Pizza)', 'Japanese (Sushi & Ramen)', 'Mexican (Tacos & Burritos)', 'Thai / Asian fusion'],
  },
  {
    id: 'km-fd-3',
    category: 'foodies',
    question: 'How do I take my coffee or tea in the morning?',
    options: ['Sweet with cream & flavor syrups', 'Black / Strong with no sugar', 'I prefer iced boba or tea', 'Fruit smoothie or juice instead'],
  },

  // 9. Firsts & Memories
  {
    id: 'km-fm-1',
    category: 'firsts_memories',
    question: 'What was my exact internal thought when we first met or started talking?',
    options: ['Wow, they are incredibly attractive', 'I feel so comfortable with them', 'This person is special', 'I could talk to them for hours'],
  },
  {
    id: 'km-fm-2',
    category: 'firsts_memories',
    question: 'Which of our past memories do I bring up the most often?',
    options: ['Our first long late-night video call', 'Our airport reunion hug', 'That funny awkward moment we laughed at', 'Our first romantic dinner'],
  },
  {
    id: 'km-fm-3',
    category: 'firsts_memories',
    question: 'What was the first thing about your profile or picture that caught my eye?',
    options: ['Your warm smile', 'Your eyes', 'Your style & vibe', 'The way you phrased your message'],
  },

  // 10. Silly & Random
  {
    id: 'km-sr-1',
    category: 'silly_random',
    question: 'If I was an animal, what would I be based on my personality?',
    options: ['A golden retriever puppy', 'A cozy lazy cat', 'A wise owl', 'A playful dolphin'],
  },
  {
    id: 'km-sr-2',
    category: 'silly_random',
    question: 'What weird talent or useless skill do I secretly possess?',
    options: ['Remembering random trivia facts', 'Doing funny voice impressions', 'Solving puzzles super fast', 'Wiggling ears / weird flexibility'],
  },
  {
    id: 'km-sr-3',
    category: 'silly_random',
    question: 'If I won $10 Million today, what is the first ridiculous thing I would buy?',
    options: ['A private jet to visit you anytime', 'A castle in Europe', 'A lifetime supply of my favorite food', 'A high-end sports car'],
  },

  // 11. Adventure
  {
    id: 'km-av-1',
    category: 'adventure',
    question: 'What is my dream vacation style with you?',
    options: ['Relaxing beach resort with cocktails', 'Exploring historic cities & food tours', 'Hiking mountains & nature camping', 'Road trip across breathtaking coastlines'],
  },
  {
    id: 'km-av-2',
    category: 'adventure',
    question: 'Which extreme adventure activity would I actually do with you?',
    options: ['Skydiving / Parasailing', 'Scuba diving with sea life', 'Ziplining over a jungle', 'Hot air balloon rides'],
  },

  // 12. Red Flags & Icks
  {
    id: 'km-rf-1',
    category: 'red_flags_icks',
    question: 'What is my biggest minor relationship ick?',
    options: ['Leaving messages on read for hours', 'Chewing loudly or noisy eating', 'Being indecisive about food', 'Being constantly late'],
  },
  {
    id: 'km-rf-2',
    category: 'red_flags_icks',
    question: 'What texting habit annoys me the most?',
    options: ['One-word replies like "K"', 'Using too many ellipses (...)', 'Sending 15 separate tiny messages', 'Voice notes that are 10 minutes long'],
  },

  // 13. Throwback
  {
    id: 'km-tb-1',
    category: 'throwback',
    question: 'What was my favorite childhood hobby growing up?',
    options: ['Video games & computer gear', 'Sports & outdoor games', 'Reading & drawing/art', 'Listening to music & dancing'],
  },
  {
    id: 'km-tb-2',
    category: 'throwback',
    question: 'What nostalgic 2000s / 2010s trend do I secretly miss?',
    options: ['Classic Cartoon Network / Nickelodeon shows', 'Old school MP3 players & iPods', 'Retro arcade games', 'Flip phones & MSN messenger'],
  },

  // 14. Our Future
  {
    id: 'km-ft-1',
    category: 'our_future',
    question: 'What is my biggest dream when we finally close the distance forever?',
    options: ['Building our cozy dream home together', 'Traveling the world side-by-side', 'Cooking dinner together every single night', 'Adopting a cute pet together'],
  },
  {
    id: 'km-ft-2',
    category: 'our_future',
    question: 'What pet do I want us to get when we live under the same roof?',
    options: ['A fluffy dog', 'A cute cat', 'Two pets so they aren\'t lonely', 'No pets, just us traveling'],
  },

  // 15. Secrets & Confessions
  {
    id: 'km-sc-1',
    category: 'secrets_confessions',
    question: 'What is a little secret habit I have when I think no one is watching?',
    options: ['Singing loudly in the shower/car', 'Dancing randomly when happy', 'Checking my hair/outfit in mirrors', 'Re-reading your sweet texts'],
  },
  {
    id: 'km-sc-2',
    category: 'secrets_confessions',
    question: 'What is a funny confession I haven\'t told many people?',
    options: ['I used to fake being sick to stay home & play games', 'I once ate a whole cake by myself in one sitting', 'I practiced my romantic speech in the mirror', 'I stalked your social media before our first date'],
  },

  // 16. Hot Takes
  {
    id: 'km-ht-1',
    category: 'hot_takes',
    question: 'What is my most controversial food or life hot take?',
    options: ['Pineapple DOES belong on pizza', 'Cold pizza is better than hot pizza', 'Movie theaters are overrated', 'Morning people have secret superpowers'],
  },
  {
    id: 'km-ht-2',
    category: 'hot_takes',
    question: 'What is my hot take on romantic comedy tropes?',
    options: ['The airport chase scene is classic gold', 'Miscommunication plots are super annoying', 'Enemies-to-lovers is the best trope', 'Friends-to-lovers is superior'],
  },

  // 17. What If
  {
    id: 'km-wi-1',
    category: 'what_if',
    question: 'If a Zombie Apocalypse happened, what would my role in our duo be?',
    options: ['The strategic planner & supply seeker', 'The fierce protector & fighter', 'The medic & emotional support anchor', 'The one who accidentally makes a noise'],
  },
  {
    id: 'km-wi-2',
    category: 'what_if',
    question: 'If we could time travel to any era for one week, where would I take us?',
    options: ['The Roaring 1920s Jazz Era', 'Ancient Egypt or Greece', 'The Futuristic 2150 AD', 'The 1980s Disco & Synthwave Era'],
  },
];

export const IQ_DUEL_CLASSIC_QUESTIONS: IQDuelQuestion[] = [
  {
    id: 'iq-c-1',
    question: 'Which country has the most natural lakes in the world?',
    options: ['United States', 'Canada', 'Russia', 'Finland'],
    correctIndex: 1,
    timeSeconds: 30,
  },
  {
    id: 'iq-c-2',
    question: 'If 5 cats can catch 5 mice in 5 minutes, how many cats are needed to catch 100 mice in 100 minutes?',
    options: ['100 cats', '5 cats', '20 cats', '1 cat'],
    correctIndex: 1,
    timeSeconds: 45,
  },
  {
    id: 'iq-c-3',
    question: 'Which chemical element has the symbol "Au"?',
    options: ['Silver', 'Copper', 'Gold', 'Aluminum'],
    correctIndex: 2,
    timeSeconds: 25,
  },
  {
    id: 'iq-c-4',
    question: 'Complete the pattern: 2, 6, 12, 20, 30, __?',
    options: ['38', '40', '42', '44'],
    correctIndex: 2,
    timeSeconds: 40,
  },
  {
    id: 'iq-c-5',
    question: 'What is the speed of light in vacuum (approximate)?',
    options: ['300,000 km/s', '150,000 km/s', '1,000,000 km/s', '500,000 km/s'],
    correctIndex: 0,
    timeSeconds: 30,
  },
  {
    id: 'iq-c-6',
    question: 'A bat and a ball together cost $1.10. The bat costs $1.00 more than the ball. How much does the ball cost?',
    options: ['$0.10', '$0.05', '$0.15', '$0.01'],
    correctIndex: 1,
    timeSeconds: 50,
  },
  {
    id: 'iq-c-7',
    question: 'Which planet in our solar system has the shortest day (fastest rotation)?',
    options: ['Earth', 'Mars', 'Jupiter', 'Saturn'],
    correctIndex: 2,
    timeSeconds: 30,
  },
  {
    id: 'iq-c-8',
    question: 'If yesterday was Tuesday, what day will it be 3 days after tomorrow?',
    options: ['Saturday', 'Sunday', 'Monday', 'Friday'],
    correctIndex: 1,
    timeSeconds: 45,
  },
  {
    id: 'iq-c-9',
    question: 'What is the only organ in the human body capable of regenerating itself?',
    options: ['Heart', 'Liver', 'Kidney', 'Lungs'],
    correctIndex: 1,
    timeSeconds: 30,
  },
  {
    id: 'iq-c-10',
    question: 'Which number is missing in the sequence: 1, 1, 2, 3, 5, 8, 13, __?',
    options: ['18', '20', '21', '25'],
    correctIndex: 2,
    timeSeconds: 35,
  },
  {
    id: 'iq-c-11',
    question: 'What gas makes up approximately 78% of Earth’s atmosphere?',
    options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Argon'],
    correctIndex: 2,
    timeSeconds: 30,
  },
  {
    id: 'iq-c-12',
    question: '👑 FINAL DOUBLE-POINT QUESTION: If a doctor gives you 3 pills and tells you to take one every 30 minutes, how long will they last?',
    options: ['90 minutes', '60 minutes', '30 minutes', '120 minutes'],
    correctIndex: 1,
    timeSeconds: 60,
    isDoublePoints: true,
  },
];

export const IQ_DUEL_MARATHON_QUESTIONS: IQDuelQuestion[] = [
  ...IQ_DUEL_CLASSIC_QUESTIONS.map((q) => ({ ...q, isDoublePoints: false })),
  {
    id: 'iq-m-13',
    question: 'Which ocean is the deepest in the world?',
    options: ['Atlantic Ocean', 'Indian Ocean', 'Pacific Ocean', 'Arctic Ocean'],
    correctIndex: 2,
    timeSeconds: 30,
  },
  {
    id: 'iq-m-14',
    question: 'How many sides does a nonagon have?',
    options: ['7', '8', '9', '10'],
    correctIndex: 2,
    timeSeconds: 25,
  },
  {
    id: 'iq-m-15',
    question: 'If you rearrange the letters "CINEMA", you get which word related to reading?',
    options: ['ICEMAN', 'ANIME', 'ICEMEN', 'ICEMAN'],
    correctIndex: 0,
    timeSeconds: 35,
  },
  {
    id: 'iq-m-16',
    question: 'What is the capital city of Australia?',
    options: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'],
    correctIndex: 2,
    timeSeconds: 30,
  },
  {
    id: 'iq-m-17',
    question: 'Which organ produces insulin in the human body?',
    options: ['Liver', 'Pancreas', 'Gallbladder', 'Spleen'],
    correctIndex: 1,
    timeSeconds: 30,
  },
  {
    id: 'iq-m-18',
    question: 'If an electric train is traveling south at 60 mph and the wind is blowing north at 20 mph, which way does the smoke blow?',
    options: ['North', 'South', 'East', 'Electric trains do not emit smoke!'],
    correctIndex: 3,
    timeSeconds: 40,
  },
  {
    id: 'iq-m-19',
    question: 'What is the sum of angles inside a hexagon?',
    options: ['360 degrees', '540 degrees', '720 degrees', '900 degrees'],
    correctIndex: 2,
    timeSeconds: 45,
  },
  {
    id: 'iq-m-20',
    question: '👑 MARATHON GRAND FINAL QUESTION: Some months have 31 days, some have 30 days. How many months have 28 days?',
    options: ['1 month (February)', '6 months', '12 months', '2 months'],
    correctIndex: 2,
    timeSeconds: 60,
    isDoublePoints: true,
  },
];

export const RIDDLES_DATA: Riddle[] = [
  {
    id: 'rd-1',
    title: 'The Unbreakable Connection',
    question: 'I can travel across thousands of miles in an instant, yet I stay in the exact same spot. I bring two hearts together without ever touching. What am I?',
    hint: 'You are using me right now to connect with your partner!',
    answer: 'A video call or message / digital connection',
    category: 'Love & LDR',
  },
  {
    id: 'rd-2',
    title: 'The Silent Keeper',
    question: 'I have no voice, yet I speak to you of true devotion. I can be opened only by the right key, or sealed until a future date. What am I?',
    hint: 'Check your Love Letters tab!',
    answer: 'A love letter',
    category: 'Love & LDR',
  },
  {
    id: 'rd-3',
    title: 'The Ticking Heart',
    question: 'The more of me there is, the less you see. But when I count down to zero, your happiness multiplies. What am I?',
    hint: 'It counts the days until your next airport visit!',
    answer: 'A countdown ticker',
    category: 'Relationship',
  },
  {
    id: 'rd-4',
    title: 'The Shadow Companion',
    question: 'I follow you everywhere you go in the sun, but I vanish in the dark. I am always by your side when you walk alone. What am I?',
    hint: 'Light creates me behind you.',
    answer: 'Your shadow',
    category: 'Classic Mind Teaser',
  },
  {
    id: 'rd-5',
    title: 'The Endless Ring',
    question: 'I have no beginning, middle, or end. I symbolise eternity between two lovers. What am I?',
    hint: 'Worn on a special finger.',
    answer: 'A ring / circle of love',
    category: 'Love & Romance',
  },
  {
    id: 'rd-6',
    title: 'The Time Traveler',
    question: 'I capture a single moment in time and freeze it forever. I never age, but I make you remember the past. What am I?',
    hint: 'Check your Memories gallery!',
    answer: 'A photograph / photo memory',
    category: 'Memories',
  },
  {
    id: 'rd-7',
    title: 'The Unseen Flame',
    question: 'I feed on affection and grow stronger with trust. I can hurt when distant, but I warm you when close. What am I?',
    hint: 'The core reason you two are together.',
    answer: 'Love',
    category: 'Love & Romance',
  },
];

export const THIS_OR_THAT_QUESTIONS = [
  { id: 'tot-1', question: 'Coffee or Tea?', options: ['☕ Coffee', '🍵 Tea'] },
  { id: 'tot-2', question: 'Cats or Dogs?', options: ['🐱 Cats', '🐶 Dogs'] },
  { id: 'tot-3', question: 'Netflix Night or Nightclub Party?', options: ['🎬 Netflix & Chill', '🪩 Party Nightclub'] },
  { id: 'tot-4', question: 'Pizza or Burgers?', options: ['🍕 Cheesy Pizza', '🍔 Juicy Burger'] },
  { id: 'tot-5', question: 'Beach Holiday or Mountain Cabin?', options: ['🏖️ Sunny Beach', '⛰️ Cozy Cabin'] },
  { id: 'tot-6', question: 'Early Morning Bird or Late Night Owl?', options: ['🌅 Early Bird', '🌙 Night Owl'] },
  { id: 'tot-7', question: 'Sweet Snacks or Savory Treats?', options: ['🍦 Sweet Dessert', '🍿 Savory Snacks'] },
  { id: 'tot-8', question: 'Road Trip or Flight Getaway?', options: ['🚗 Scenic Road Trip', '✈️ Fast Flight'] },
  { id: 'tot-9', question: 'Cook at Home or Order Takeout?', options: ['👩‍🍳 Cook Together', '📱 Order Takeout'] },
  { id: 'tot-10', question: 'Texting All Day or 1 Long Video Call?', options: ['💬 Constant Texting', '📹 Nightly Video Call'] },
];

export const WOULD_YOU_RATHER_QUESTIONS = [
  { id: 'wyr-1', question: 'Would you rather have a cozy home movie date or a fancy candlelit dinner?', options: ['🛋️ Home Movie Date', '🕯️ Fancy Dinner'] },
  { id: 'wyr-2', question: 'Would you rather live in a bustling metropolis or a quiet seaside town?', options: ['🏙️ Big City', '🌊 Seaside Town'] },
  { id: 'wyr-3', question: 'Would you rather travel 100 years into the past or 100 years into the future?', options: ['⏳ 100 Years Past', '🚀 100 Years Future'] },
  { id: 'wyr-4', question: 'Would you rather have infinite free coffee or infinite free flights to see each other?', options: ['☕ Infinite Coffee', '✈️ Unlimited Flights'] },
  { id: 'wyr-5', question: 'Would you rather receive surprise flowers or a hand-written love letter?', options: ['💐 Surprise Flowers', '💌 Hand-written Letter'] },
  { id: 'wyr-6', question: 'Would you rather spend a rainy weekend sleeping in or exploring a new city?', options: ['🛌 Cozy Sleep-in', '🌆 Explore City'] },
  { id: 'wyr-7', question: 'Would you rather be able to read minds or telepathically talk only to your partner?', options: ['🧠 Read All Minds', '💞 Partner Telepathy'] },
];

export const COMPATIBILITY_QUESTIONS = [
  { id: 'cmp-1', question: 'How do you handle disagreement during long-distance calls?', options: ['Talk it out immediately', 'Take 30 mins space first', 'Send a thoughtful text', 'Sleep on it'] },
  { id: 'cmp-2', question: 'What is your primary Love Language?', options: ['Words of Affirmation', 'Quality Time (Calls)', 'Receiving Gifts', 'Physical Touch / Reunions'] },
  { id: 'cmp-3', question: 'What is your ideal reunion celebration on Airport Day?', options: ['Quiet hug & cozy home date', 'Fancy restaurant dinner', 'Weekend surprise getaway', 'Party with friends'] },
  { id: 'cmp-4', question: 'How often do you like to check in throughout a busy workday?', options: ['Every couple hours', 'Morning & Goodnight only', 'Non-stop text stream', 'Whenever free'] },
  { id: 'cmp-5', question: 'Where would you prefer to settle down together in the future?', options: ['Hometown near family', 'Exciting new foreign city', 'Peaceful countryside', 'Coastal beach town'] },
];

