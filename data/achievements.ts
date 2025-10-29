import { Achievement, AchievementId } from "../types";
import { CheckCircleIcon } from "../components/icons/CheckCircleIcon";
import { BookOpenIcon } from "../components/icons/BookOpenIcon";
import { TrophyIcon } from "../components/icons/TrophyIcon";
import { TrendingUpIcon } from "../components/icons/TrendingUpIcon";
import { ClockIcon } from "../components/icons/ClockIcon";

export const achievementsList: Achievement[] = [
    {
        id: 'exam_1',
        name: 'First Step',
        description: 'Complete your first exam.',
        icon: CheckCircleIcon,
    },
    {
        id: 'exam_5',
        name: 'Consistent Learner',
        description: 'Complete 5 exams.',
        icon: CheckCircleIcon,
    },
    {
        id: 'score_100',
        name: 'Perfectionist',
        description: 'Score 100% on any exam.',
        icon: TrophyIcon,
    },
    {
        id: 'aid_1',
        name: 'Resourceful',
        description: 'Create your first study aid.',
        icon: BookOpenIcon,
    },
    {
        id: 'aid_10',
        name: 'Master Librarian',
        description: 'Create 10 different study aids.',
        icon: BookOpenIcon,
    },
    {
        id: 'streak_3',
        name: 'On a Roll',
        description: 'Maintain a 3-day study streak.',
        icon: TrendingUpIcon,
    },
    {
        id: 'streak_7',
        name: 'Study Machine',
        description: 'Maintain a 7-day study streak.',
        icon: TrendingUpIcon,
    },
    // FIX: Add missing pomodoro_1 achievement to align with type definitions and app logic.
    {
        id: 'pomodoro_1',
        name: 'Time Master',
        description: 'Complete your first Pomodoro session.',
        icon: ClockIcon,
    },
];

export const getAchievement = (id: AchievementId): Achievement | undefined => {
    return achievementsList.find(ach => ach.id === id);
};