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

    // Get all users except excluded ones - no strict profile requirements
    const users = await prisma.user.findMany({
      where: {
        id: { notIn: excludedIds }
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
      location: (() => {
        if (!user.location) return null;
        try {
          return JSON.parse(user.location as string);
        } catch (e) {
          console.error('Invalid location JSON for user', user.id, user.location);
          return null;
        }
      })(),
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
      location: (() => {
        if (!user.location) return null;
        try {
          return JSON.parse(user.location as string);
        } catch (e) {
          console.error('Invalid location JSON for user', user.id, user.location);
          return null;
        }
      })(),
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
    if (!currentUser) {
      throw new Error('User not found');
    }

    const candidates = await this.getUsersForMatching(userId);
    const matches: MatchResult[] = [];

    // If user has preferences, use the full matching algorithm
    if (currentUser.userPreferences) {
      for (const candidate of candidates) {
        // Check for mutual gender preference
        const currentUserGender = currentUser.gender;
        const candidateGender = candidate.gender;

        const currentUserLikesCandidateGender = !currentUser.userPreferences.preferredGenders?.length || 
          currentUser.userPreferences.preferredGenders.includes(candidateGender);
        
        // Ensure candidate has preferences set to check reciprocation
        const candidateLikesCurrentUserGender = !candidate.userPreferences?.preferredGenders?.length || 
          candidate.userPreferences.preferredGenders.includes(currentUserGender);

        if (!currentUserLikesCandidateGender || !candidateLikesCurrentUserGender) {
          continue;
        }

        // Calculate compatibility scores using the new method
        const matchResult = this.calculateCompatibility(currentUser, candidate);

        if (matchResult && matchResult.score > 30) { // Only include matches above 30% compatibility
          matches.push(matchResult);
        }
      }
    } else {
      // No preferences set - return all candidates with a default score
      for (const candidate of candidates) {
        matches.push({
          user: candidate,
          score: 50, // Default neutral score
          breakdown: {
            ageCompatibility: 50,
            distanceScore: 50,
            interestSimilarity: 50,
            collegeCompatibility: 50,
            majorCompatibility: 50,
            yearCompatibility: 50,
            personalityCompatibility: 50,
            totalScore: 50
          }
        });
      }
    }

    // Sort by score descending and return top matches
    const sortedMatches = [...matches].sort((a, b) => b.score - a.score);
    return sortedMatches.slice(0, limit);
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

  // Record a like or pass
  async recordSwipeAction(senderId: string, receiverId: string, action: 'like' | 'pass'): Promise<{ isMatch: boolean, message: string }> {
    try {
      if (action === 'pass') {
        // For now, we just don't create a like record for passes
        // You could create a separate 'passes' table if you want to track them
        return { isMatch: false, message: 'Passed successfully' };
      }

      // Check if like already exists
      const existingLike = await prisma.userLike.findFirst({
        where: {
          senderId,
          receiverId
        }
      });

      if (existingLike) {
        return { isMatch: false, message: 'Already liked this user' };
      }

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
        // Calculate compatibility score for the match
        const sender = await this.getCurrentUser(senderId);
        const receiver = await this.getCurrentUser(receiverId);
        
        let score = 75; // Default good score for matches
        if (sender && receiver) {
          const matchResult = this.calculateCompatibility(sender, receiver);
          score = matchResult?.score || 75;
        }

        // Create match record
        await this.createMatch(senderId, receiverId, score);
        
        return { isMatch: true, message: "It's a match! 🎉" };
      }

      return { isMatch: false, message: 'Like recorded successfully! 💕' };
    } catch (error) {
      console.error('Record swipe action error:', error);
      throw new Error('Failed to record swipe action');
    }
  }

  // Get users for discovery/swiping
  async getUsersForDiscovery(currentUserId: string, limit: number = 10): Promise<UserForMatching[]> {
    // Get users that have been liked or passed on
    const likedUserIds = await prisma.userLike.findMany({
      where: { senderId: currentUserId },
      select: { receiverId: true }
    });

    // Get users that are already matched
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

    // Get current user's preferences for filtering (optional)
    const currentUser = await this.getCurrentUser(currentUserId);
    const preferences = currentUser?.userPreferences;

    // Build query based on whether user has preferences set
    let whereClause: any = {
      id: { notIn: excludedIds }
    };

    // If user has preferences, apply them; otherwise show all users
    if (preferences) {
      // Apply age filter only if user has set preferences
      if (preferences.minAge && preferences.maxAge) {
        whereClause.OR = [
          {
            age: {
              gte: preferences.minAge,
              lte: preferences.maxAge
            }
          },
          { age: null } // Also include users without age set
        ];
      }
      
      // Apply gender filter only if user has set gender preferences
      if (preferences.preferredGenders && preferences.preferredGenders.length > 0) {
        whereClause.OR = [
          ...(whereClause.OR || []),
          {
            gender: {
              in: preferences.preferredGenders
            }
          },
          { gender: null } // Also include users without gender set
        ];
      }
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        userPreferences: true,
        personalityTraits: true
      },
      take: limit * 3, // Get more to have buffer after filtering
      orderBy: {
        createdAt: 'desc' // Show newest users first
      }
    });

    // Light filtering - only exclude if both users have preferences and they conflict
    let filteredUsers = users;
    if (currentUser?.gender && preferences?.preferredGenders?.length) {
      filteredUsers = users.filter(user => {
        // If user has no preferences, include them
        if (!user.userPreferences) return true;
        // If user has no preferred genders set, include them
        if (!user.userPreferences.preferredGenders?.length) return true;
        // Check if they would be interested in current user
        return user.userPreferences.preferredGenders.includes(currentUser.gender);
      });
    }

    return filteredUsers.slice(0, limit).map(user => ({
      id: user.id,
      name: user.name || 'Unknown User',
      age: user.age || 0,
      gender: user.gender || 'Not specified',
      college: user.college || 'Not specified',
      major: user.major || 'Not specified',
      year: user.year || 0,
      bio: user.bio || 'No bio yet',
      avatar: user.avatar || `https://api.dicebear.com/8.x/lorelei/svg?seed=${user.name || user.id}`,
      location: (() => {
        if (!user.location) return null;
        try {
          return JSON.parse(user.location as string);
        } catch (e) {
          return null;
        }
      })(),
      interests: user.interests || [],
      userPreferences: user.userPreferences,
      personalityTraits: user.personalityTraits
    }));
  }
}