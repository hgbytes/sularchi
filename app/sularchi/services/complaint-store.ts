/**
 * Complaint Store
 *
 * Manages waste complaints (reports) with local persistence via AsyncStorage.
 * Each complaint links a captured image + AI classification + GPS location + points.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { type WasteCategory } from './waste-classifier';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  address?: string;
}

export type ComplaintStatus = 'pending' | 'in-progress' | 'resolved';

export interface Complaint {
  id: string;
  /** Local image URI */
  imageUri: string;
  /** AI-classified waste category */
  wasteCategory: WasteCategory;
  /** AI classification confidence (0-1) */
  confidence: number;
  /** Human-readable waste label */
  wasteLabel: string;
  /** AI-generated description of the waste */
  description: string;
  /** GPS coordinates auto-attached */
  location: GeoLocation;
  /** Points awarded for this report */
  pointsAwarded: number;
  /** Current status of the complaint */
  status: ComplaintStatus;
  /** ISO timestamp of creation */
  createdAt: string;
  /** ISO timestamp of last update */
  updatedAt: string;
}

// ─── Storage Keys ────────────────────────────────────────────────────────────

const COMPLAINTS_KEY = '@sularchi/complaints';
const USER_PROFILE_KEY = '@sularchi/user-profile';

// ─── User Profile ────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string;
  totalPoints: number;
  totalReports: number;
  streak: number; // consecutive days with reports
  lastReportDate: string | null;
  joinedAt: string;
  rank: number;
}

const DEFAULT_PROFILE: UserProfile = {
  id: 'local-user',
  name: 'Eco Warrior',
  totalPoints: 0,
  totalReports: 0,
  streak: 0,
  lastReportDate: null,
  joinedAt: new Date().toISOString(),
  rank: 0,
};

// ─── Points System ───────────────────────────────────────────────────────────

const POINTS_TABLE: Record<WasteCategory, number> = {
  plastic: 10,
  paper: 8,
  glass: 12,
  metal: 12,
  organic: 6,
  'e-waste': 20,
  textile: 10,
  hazardous: 25,
  unknown: 3,
};

const STREAK_BONUS = 5; // extra points per active streak day
const HIGH_CONFIDENCE_BONUS = 5; // bonus if confidence >= 85%

/**
 * Calculate points for a waste report.
 */
export function calculatePoints(
  category: WasteCategory,
  confidence: number,
  currentStreak: number
): number {
  let points = POINTS_TABLE[category] || 3;

  // High confidence bonus
  if (confidence >= 0.85) {
    points += HIGH_CONFIDENCE_BONUS;
  }

  // Streak bonus
  if (currentStreak > 0) {
    points += Math.min(currentStreak, 7) * STREAK_BONUS;
  }

  return points;
}

// ─── Streak Helpers ──────────────────────────────────────────────────────────

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isYesterday(d1: Date, d2: Date): boolean {
  const yesterday = new Date(d2);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(d1, yesterday);
}

function computeStreak(lastReportDate: string | null, currentStreak: number): number {
  if (!lastReportDate) return 1;

  const last = new Date(lastReportDate);
  const now = new Date();

  if (isSameDay(last, now)) return currentStreak; // same day, no change
  if (isYesterday(last, now)) return currentStreak + 1; // consecutive
  return 1; // streak broken
}

// ─── CRUD Operations ─────────────────────────────────────────────────────────

/**
 * Get the user profile.
 */
export async function getUserProfile(): Promise<UserProfile> {
  try {
    const json = await AsyncStorage.getItem(USER_PROFILE_KEY);
    if (json) return JSON.parse(json);
  } catch (e) {
    console.warn('Failed to load user profile:', e);
  }
  return { ...DEFAULT_PROFILE, joinedAt: new Date().toISOString() };
}

/**
 * Save user profile.
 */
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
}

/**
 * Update user name.
 */
export async function updateUserName(name: string): Promise<UserProfile> {
  const profile = await getUserProfile();
  profile.name = name;
  await saveUserProfile(profile);
  return profile;
}

/**
 * Get all complaints, newest first.
 */
export async function getComplaints(): Promise<Complaint[]> {
  try {
    const json = await AsyncStorage.getItem(COMPLAINTS_KEY);
    if (json) {
      const complaints: Complaint[] = JSON.parse(json);
      return complaints.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
  } catch (e) {
    console.warn('Failed to load complaints:', e);
  }
  return [];
}

/**
 * File a new waste complaint. Awards points and updates streak.
 * Returns the created complaint and updated profile.
 */
export async function fileComplaint(params: {
  imageUri: string;
  wasteCategory: WasteCategory;
  confidence: number;
  wasteLabel: string;
  description: string;
  location: GeoLocation;
}): Promise<{ complaint: Complaint; profile: UserProfile; pointsAwarded: number }> {
  const profile = await getUserProfile();

  // Update streak
  const newStreak = computeStreak(profile.lastReportDate, profile.streak);

  // Calculate points
  const pointsAwarded = calculatePoints(params.wasteCategory, params.confidence, newStreak);

  // Create complaint
  const now = new Date().toISOString();
  const complaint: Complaint = {
    id: `complaint-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    imageUri: params.imageUri,
    wasteCategory: params.wasteCategory,
    confidence: params.confidence,
    wasteLabel: params.wasteLabel,
    description: params.description,
    location: params.location,
    pointsAwarded,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  // Persist complaint
  const complaints = await getComplaints();
  complaints.unshift(complaint);
  await AsyncStorage.setItem(COMPLAINTS_KEY, JSON.stringify(complaints));

  // Update profile
  profile.totalPoints += pointsAwarded;
  profile.totalReports += 1;
  profile.streak = newStreak;
  profile.lastReportDate = now;
  await saveUserProfile(profile);

  return { complaint, profile, pointsAwarded };
}

/**
 * Get complaint by ID.
 */
export async function getComplaintById(id: string): Promise<Complaint | null> {
  const complaints = await getComplaints();
  return complaints.find((c) => c.id === id) || null;
}

/**
 * Get summary stats.
 */
export async function getStats(): Promise<{
  totalReports: number;
  totalPoints: number;
  categoryCounts: Record<string, number>;
  streak: number;
}> {
  const [profile, complaints] = await Promise.all([getUserProfile(), getComplaints()]);

  const categoryCounts: Record<string, number> = {};
  for (const c of complaints) {
    categoryCounts[c.wasteCategory] = (categoryCounts[c.wasteCategory] || 0) + 1;
  }

  return {
    totalReports: profile.totalReports,
    totalPoints: profile.totalPoints,
    categoryCounts,
    streak: profile.streak,
  };
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  id: string;
  name: string;
  totalPoints: number;
  totalReports: number;
  rank: number;
  isCurrentUser: boolean;
}

/**
 * Generate a leaderboard.
 * Combines the local user with simulated community members.
 * In production, this would query a backend API.
 */
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const profile = await getUserProfile();

  // Simulated community members (in production, fetch from backend)
  const communityMembers: Omit<LeaderboardEntry, 'rank'>[] = [
    { id: 'u1', name: 'GreenHero', totalPoints: 580, totalReports: 42, isCurrentUser: false },
    { id: 'u2', name: 'EcoChamp', totalPoints: 445, totalReports: 35, isCurrentUser: false },
    { id: 'u3', name: 'RecycleKing', totalPoints: 390, totalReports: 30, isCurrentUser: false },
    { id: 'u4', name: 'WasteWatcher', totalPoints: 310, totalReports: 24, isCurrentUser: false },
    { id: 'u5', name: 'CleanStreet', totalPoints: 275, totalReports: 21, isCurrentUser: false },
    { id: 'u6', name: 'EarthGuard', totalPoints: 220, totalReports: 18, isCurrentUser: false },
    { id: 'u7', name: 'TrashTracker', totalPoints: 180, totalReports: 14, isCurrentUser: false },
    { id: 'u8', name: 'BinBuddy', totalPoints: 140, totalReports: 10, isCurrentUser: false },
    { id: 'u9', name: 'ZeroWaste', totalPoints: 95, totalReports: 7, isCurrentUser: false },
  ];

  // Add current user
  const allEntries: Omit<LeaderboardEntry, 'rank'>[] = [
    ...communityMembers,
    {
      id: profile.id,
      name: profile.name,
      totalPoints: profile.totalPoints,
      totalReports: profile.totalReports,
      isCurrentUser: true,
    },
  ];

  // Sort by points descending
  allEntries.sort((a, b) => b.totalPoints - a.totalPoints);

  // Assign ranks
  return allEntries.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}
