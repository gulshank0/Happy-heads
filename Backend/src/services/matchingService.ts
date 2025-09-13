import { PrismaClient } from '../../generated/client';

const prisma = new PrismaClient();

interface UserForMatching {
  id: string;
  name: string;
  age: number;
  gender: string;
  college: string;
  major: string;
  year: number;
  bio: string;
  avatar: string;
  location: { latitude: number; longitude: number }| null;
  interests: string[];
  userPreferences: {
    minAge: number;
    maxAge: number;
    preferredGenders: string[];
    maxDistance: number;
    collegePreference: string;
    majorPreference: string;
    minYear: number;
    maxYear: number;
    ageWeight: number;
    distanceWeight: number;
    interestsWeight: number;
    collegeWeight: number;
    majorWeight: number;
    yearWeight: number;
    personalityWeight: number;
  } | null;
  personalityTraits: {
    extroversion: number;
    openness: number;
    conscientiousness: number;
    agreeableness: number;
    neuroticism: number;
  } | null;
}

interface MatchResult {
  user: UserForMatching;
  score: number;
  breakdown: {
    ageCompatibility: number;
    distanceScore: number;
    interestSimilarity: number;
    collegeCompatibility: number;
    majorCompatibility: number;
    yearCompatibility: number;
    personalityCompatibility: number;
    totalScore: number;
  };
}

export class MatchingService {
  // Get users for matching (excluding current user and already liked/matched users)
  async getUsersForMatching(currentUserId: string): Promise<UserForMatching[]> {
    const likedUserIds = await prisma.userLike.findMany({
      where: { senderId: currentUserId },
      select: {
        receiverId: true
      }
    });

    const matchedUserIds = await prisma.match.findMany({
      where: {
        OR: [
          { user1Id: currentUserId },
          { user2Id: currentUserId }
        ]
      },
      select: { user1Id: true, user2Id: true }
    });

    const excludedIds = [
      currentUserId,
      ...likedUserIds.map(like => like.receiverId),
      ...matchedUserIds.flatMap(match => [match.user1Id, match.user2Id])
    ];

    const users = await prisma.user.findMany({
      where: {
        id: { notIn: excludedIds },
        age: { not: null },
        gender: { not: null },
        college: { not: null },
        major: { not: null },
        year: { not: null }
      },
      include: {
        userPreferences: true,
        personalityTraits: true
      }
    });

    return users.map(user => ({
      id: user.id,
      name: user.name || 'Unknown',
      age: user.age || 0,
      gender: user.gender || '',
      college: user.college || '',
      major: user.major || '',
      year: user.year || 0,
      bio: user.bio || '',
      avatar: user.avatar || '',
      location: user.location ? JSON.parse(user.location as string) : null,
      interests: user.interests || [],
      userPreferences: user.userPreferences,
      personalityTraits: user.personalityTraits
    }));
  }

  // Get current user with preferences
  async getCurrentUser(userId: string): Promise<UserForMatching | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userPreferences: true,
        personalityTraits: true
      }
    });

    if (!user) return null;

    return {
      id: user.id,
      name: user.name || 'Unknown',
      age: user.age || 0,
      gender: user.gender || '',
      college: user.college || '',
      major: user.major || '',
      year: user.year || 0,
      bio: user.bio || '',
      avatar: user.avatar || '',
      location: user.location ? JSON.parse(user.location as string) : null,
      interests: user.interests || [],
      userPreferences: user.userPreferences,
      personalityTraits: user.personalityTraits
    };
  }

  // Calculate distance between two points using Haversine formula
  private calculateDistance(
    lat1: number, lon1: number, 
    lat2: number, lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Calculate age compatibility
  private calculateAgeCompatibility(userAge: number, candidateAge: number, preferences: any): number {
    if (!preferences) return 50;
    
    if (candidateAge >= preferences.minAge && candidateAge <= preferences.maxAge) {
      const midPoint = (preferences.minAge + preferences.maxAge) / 2;
      const maxDeviation = (preferences.maxAge - preferences.minAge) / 2;
      const deviation = Math.abs(candidateAge - midPoint);
      return Math.max(0, 100 - (deviation / maxDeviation) * 50);
    }
    return 0;
  }

  // Calculate distance compatibility
  private calculateDistanceScore(user: UserForMatching, candidate: UserForMatching): number {
    if (!user.location || !candidate.location || !user.userPreferences) return 50;
    
    const distance = this.calculateDistance(
      user.location.latitude, user.location.longitude,
      candidate.location.latitude, candidate.location.longitude
    );

    if (distance <= user.userPreferences.maxDistance) {
      return Math.max(0, 100 - (distance / user.userPreferences.maxDistance) * 100);
    }
    return 0;
  }

  // Calculate interest similarity
  private calculateInterestSimilarity(userInterests: string[], candidateInterests: string[]): number {
    if (userInterests.length === 0 || candidateInterests.length === 0) return 0;
    
    const commonInterests = userInterests.filter(interest => 
      candidateInterests.includes(interest)
    );
    
    const totalInterests = new Set([...userInterests, ...candidateInterests]).size;
    return (commonInterests.length / Math.max(userInterests.length, candidateInterests.length)) * 100;
  }

  // Calculate college compatibility
  private calculateCollegeCompatibility(user: UserForMatching, candidate: UserForMatching): number {
    if (!user.userPreferences) return 50;
    
    const preference = user.userPreferences.collegePreference;
    const sameCollege = user.college === candidate.college;

    switch (preference) {
      case 'same': return sameCollege ? 100 : 0;
      case 'different': return sameCollege ? 0 : 100;
      case 'any': return sameCollege ? 100 : 80;
      default: return 50;
    }
  }

  // Calculate major compatibility
  private calculateMajorCompatibility(user: UserForMatching, candidate: UserForMatching): number {
    if (!user.userPreferences) return 50;
    
    const preference = user.userPreferences.majorPreference;
    const sameMajor = user.major === candidate.major;

    switch (preference) {
      case 'same': return sameMajor ? 100 : 0;
      case 'different': return sameMajor ? 0 : 100;
      case 'any': return sameMajor ? 100 : 85;
      default: return 50;
    }
  }

  // Calculate year compatibility
  private calculateYearCompatibility(user: UserForMatching, candidate: UserForMatching): number {
    if (!user.userPreferences) return 50;
    
    if (candidate.year >= user.userPreferences.minYear && candidate.year <= user.userPreferences.maxYear) {
      const yearDiff = Math.abs(user.year - candidate.year);
      return Math.max(50, 100 - (yearDiff * 20));
    }
    return 0;
  }

  // Calculate personality compatibility using Euclidean distance
  private calculatePersonalityCompatibility(
    userPersonality: any, 
    candidatePersonality: any
  ): number {
    if (!userPersonality || !candidatePersonality) return 50;

    const traits = ['extroversion', 'openness', 'conscientiousness', 'agreeableness', 'neuroticism'];
    let totalDistance = 0;

    traits.forEach(trait => {
      const diff = userPersonality[trait] - candidatePersonality[trait];
      totalDistance += diff * diff;
    });

    const euclideanDistance = Math.sqrt(totalDistance);
    const maxDistance = Math.sqrt(5 * 81); // Max possible distance (9^2 * 5 traits)
    return Math.max(0, (1 - euclideanDistance / maxDistance) * 100);
  }

  // Calculate the compatibility score between two users
  private calculateCompatibility(currentUser: UserForMatching, candidate: UserForMatching): MatchResult | null {
    if (!currentUser.userPreferences) return null;

    const ageCompatibility = this.calculateAgeCompatibility(
      currentUser.age, candidate.age, currentUser.userPreferences
    );
    const distanceScore = this.calculateDistanceScore(currentUser, candidate);
    const interestSimilarity = this.calculateInterestSimilarity(
      currentUser.interests, candidate.interests
    );
    const collegeCompatibility = this.calculateCollegeCompatibility(currentUser, candidate);
    const majorCompatibility = this.calculateMajorCompatibility(currentUser, candidate);
    const yearCompatibility = this.calculateYearCompatibility(currentUser, candidate);
    const personalityCompatibility = this.calculatePersonalityCompatibility(
      currentUser.personalityTraits, candidate.personalityTraits
    );

    const weights = currentUser.userPreferences;
    const totalWeight = weights.ageWeight + weights.distanceWeight + weights.interestsWeight +
                       weights.collegeWeight + weights.majorWeight + weights.yearWeight +
                       weights.personalityWeight;

    if (totalWeight === 0) return null; // Avoid division by zero

    const totalScore = (
      (ageCompatibility * weights.ageWeight) +
      (distanceScore * weights.distanceWeight) +
      (interestSimilarity * weights.interestsWeight) +
      (collegeCompatibility * weights.collegeWeight) +
      (majorCompatibility * weights.majorWeight) +
      (yearCompatibility * weights.yearWeight) +
      (personalityCompatibility * weights.personalityWeight)
    ) / totalWeight;

    return {
      user: candidate,
      score: totalScore,
      breakdown: {
        ageCompatibility,
        distanceScore,
        interestSimilarity,
        collegeCompatibility,
        majorCompatibility,
        yearCompatibility,
        personalityCompatibility,
        totalScore
      }
    };
  }

  // Main matching algorithm
  async findMatches(userId: string, limit: number = 10): Promise<MatchResult[]> {
    const currentUser = await this.getCurrentUser(userId);
    if (!currentUser || !currentUser.userPreferences) {
      throw new Error('User not found or preferences not set');
    }

    const candidates = await this.getUsersForMatching(userId);
    const matches: MatchResult[] = [];

    for (const candidate of candidates) {
      // Check for mutual gender preference
      const currentUserGender = currentUser.gender;
      const candidateGender = candidate.gender;

      const currentUserLikesCandidateGender = currentUser.userPreferences.preferredGenders.includes(candidateGender);
      
      // Ensure candidate has preferences set to check reciprocation
      const candidateLikesCurrentUserGender = candidate.userPreferences ? 
        candidate.userPreferences.preferredGenders.includes(currentUserGender) : 
        true; // Default to true if candidate has no preference set

      if (!currentUserLikesCandidateGender || !candidateLikesCurrentUserGender) {
        continue;
      }

      // Calculate compatibility scores using the new method
      const matchResult = this.calculateCompatibility(currentUser, candidate);

      if (matchResult && matchResult.score > 30) { // Only include matches above 30% compatibility
        matches.push(matchResult);
      }
    }

    // Sort by score descending and return top matches
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Save a match when both users like each other
  async createMatch(user1Id: string, user2Id: string, score: number): Promise<void> {
    await prisma.match.create({
      data: {
        user1Id,
        user2Id,
        score
      }
    });
  }

  // Record a like
  async recordLike(senderId: string, receiverId: string): Promise<boolean> {
    // Check if like already exists
    const existingLike = await prisma.userLike.findFirst({
      where: {
        senderId,
        receiverId
      }
    });

    if (existingLike) return false;

    // Create the like
    await prisma.userLike.create({
      data: { senderId, receiverId }
    });

    // Check if it's a mutual like (match)
    const reciprocalLike = await prisma.userLike.findFirst({
      where: {
        senderId: receiverId,
        receiverId: senderId
      }
    });

    if (reciprocalLike) {
      // Calculate compatibility score for the match more efficiently
      const sender = await this.getCurrentUser(senderId);
      const receiver = await this.getCurrentUser(receiverId);
      
      let score = 50; // Default score
      if (sender && receiver) {
        const matchResult = this.calculateCompatibility(sender, receiver);
        score = matchResult?.score || 50;
      }

      await this.createMatch(senderId, receiverId, score);
      return true; // It's a match!
    }

    return false; // Just a like, not a match yet
  }
}