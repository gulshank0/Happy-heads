import { PrismaClient, MessageType } from '../generated/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.notificationRead.deleteMany();
  await prisma.userLike.deleteMany();
  await prisma.match.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.like.deleteMany();
  await prisma.post.deleteMany();
  await prisma.userPost.deleteMany();
  await prisma.personalityTraits.deleteMany();
  await prisma.userPreferences.deleteMany();
  await prisma.scoreCard.deleteMany();
  await prisma.user.deleteMany();

  // Create 7 Users
  console.log('👥 Creating users...');
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'alice.johnson@university.edu',
        name: 'Alice Johnson',
        avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
        gender: 'female',
        age: 21,
        phone: '+1-555-0101',
        bio: 'Computer Science enthusiast who loves coding and hiking. Always up for a coffee chat!',
        college: 'Stanford University',
        major: 'Computer Science',
        year: 3,
        location: '{"latitude": 37.4275, "longitude": -122.1697}',
        interests: ['coding', 'hiking', 'photography', 'coffee', 'machine learning'],
      },
    }),
    prisma.user.create({
      data: {
        email: 'bob.smith@college.edu',
        name: 'Bob Smith',
        avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
        gender: 'male',
        age: 22,
        phone: '+1-555-0102',
        bio: 'Basketball player and economics major. Love meeting new people and exploring new restaurants.',
        college: 'MIT',
        major: 'Economics',
        year: 4,
        location: '{"latitude": 42.3601, "longitude": -71.0942}',
        interests: ['basketball', 'economics', 'food', 'travel', 'music'],
      },
    }),
    prisma.user.create({
      data: {
        email: 'charlie.davis@uni.edu',
        name: 'Charlie Davis',
        avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
        gender: 'male',
        age: 20,
        phone: '+1-555-0103',
        bio: 'Art history buff with a passion for painting. Looking for creative minds to collaborate with!',
        college: 'Yale University',
        major: 'Art History',
        year: 2,
        location: '{"latitude": 41.3163, "longitude": -72.9223}',
        interests: ['painting', 'art history', 'museums', 'reading', 'yoga'],
      },
    }),
    prisma.user.create({
      data: {
        email: 'diana.wilson@school.edu',
        name: 'Diana Wilson',
        avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
        gender: 'female',
        age: 23,
        phone: '+1-555-0104',
        bio: 'Future doctor who loves running marathons. Believes in work-life balance and good vibes.',
        college: 'Harvard University',
        major: 'Pre-Med Biology',
        year: 4,
        location: '{"latitude": 42.3770, "longitude": -71.1167}',
        interests: ['running', 'medicine', 'volunteering', 'cooking', 'podcasts'],
      },
    }),
    prisma.user.create({
      data: {
        email: 'evan.martinez@edu.com',
        name: 'Evan Martinez',
        avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
        gender: 'male',
        age: 19,
        phone: '+1-555-0105',
        bio: 'Freshman exploring everything! Into gaming, anime, and software development.',
        college: 'UC Berkeley',
        major: 'Software Engineering',
        year: 1,
        location: '{"latitude": 37.8719, "longitude": -122.2585}',
        interests: ['gaming', 'anime', 'programming', 'esports', 'movies'],
      },
    }),
    prisma.user.create({
      data: {
        email: 'fiona.chen@campus.edu',
        name: 'Fiona Chen',
        avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
        gender: 'female',
        age: 22,
        phone: '+1-555-0106',
        bio: 'Business major with entrepreneurial spirit. Love networking and building connections.',
        college: 'Stanford University',
        major: 'Business Administration',
        year: 3,
        location: '{"latitude": 37.4275, "longitude": -122.1697}',
        interests: ['entrepreneurship', 'networking', 'startups', 'finance', 'tennis'],
      },
    }),
    prisma.user.create({
      data: {
        email: 'george.taylor@university.edu',
        name: 'George Taylor',
        avatar: 'https://randomuser.me/api/portraits/men/4.jpg',
        gender: 'male',
        age: 24,
        phone: '+1-555-0107',
        bio: 'Graduate student in Physics. Space enthusiast and amateur astronomer.',
        college: 'Caltech',
        major: 'Physics',
        year: 5,
        location: '{"latitude": 34.1377, "longitude": -118.1253}',
        interests: ['astronomy', 'physics', 'space', 'science fiction', 'chess'],
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create ScoreCards for each user
  console.log('📊 Creating scorecards...');
  const scoreCards = await Promise.all(
    users.map((user, index) =>
      prisma.scoreCard.create({
        data: {
          userId: user.id,
          college: user.college,
          major: user.major,
          year: user.year?.toString(),
          location: user.location,
          interests: user.interests,
          preferences: ['active', 'social', 'academic'],
          personality: ['friendly', 'outgoing', 'curious'][index % 3],
          score: 70 + index * 5,
        },
      })
    )
  );
  console.log(`✅ Created ${scoreCards.length} scorecards`);

  // Create UserPreferences for each user
  console.log('⚙️ Creating user preferences...');
  const userPreferences = await Promise.all(
    users.map((user, index) =>
      prisma.userPreferences.create({
        data: {
          userId: user.id,
          minAge: 18,
          maxAge: 30,
          preferredGenders: index % 2 === 0 ? ['male'] : ['female'],
          maxDistance: 50 + index * 10,
          collegePreference: ['same', 'any', 'different'][index % 3],
          majorPreference: 'any',
          minYear: 1,
          maxYear: 5,
          ageWeight: 0.15,
          distanceWeight: 0.10,
          interestsWeight: 0.25,
          collegeWeight: 0.10,
          majorWeight: 0.15,
          yearWeight: 0.10,
          personalityWeight: 0.15,
        },
      })
    )
  );
  console.log(`✅ Created ${userPreferences.length} user preferences`);

  // Create PersonalityTraits for each user
  console.log('🧠 Creating personality traits...');
  const personalityTraits = await Promise.all(
    users.map((user, index) =>
      prisma.personalityTraits.create({
        data: {
          userId: user.id,
          extroversion: 5 + (index % 5),
          openness: 6 + (index % 4),
          conscientiousness: 7 - (index % 3),
          agreeableness: 8 - (index % 4),
          neuroticism: 3 + (index % 5),
        },
      })
    )
  );
  console.log(`✅ Created ${personalityTraits.length} personality traits`);

  // Create Posts
  console.log('📝 Creating posts...');
  const posts = await Promise.all([
    prisma.post.create({
      data: {
        title: 'Looking for Study Buddies for Finals!',
        content: 'Anyone interested in forming a study group for the upcoming finals? I focus better with others around. Coffee is on me! ☕📚',
        published: true,
        authorId: users[0].id,
      },
    }),
    prisma.post.create({
      data: {
        title: 'Best Coffee Shops Near Campus',
        content: 'I have been exploring coffee shops around campus and found some gems! Drop your favorites below and let us make a complete list.',
        published: true,
        authorId: users[1].id,
      },
    }),
    prisma.post.create({
      data: {
        title: 'Art Exhibition This Weekend',
        content: 'The local gallery is hosting an amazing contemporary art exhibition. Would love to go with someone who appreciates art. Anyone interested?',
        published: true,
        authorId: users[2].id,
      },
    }),
    prisma.post.create({
      data: {
        title: 'Marathon Training Partner Needed',
        content: 'Training for the spring marathon and looking for running partners. I usually run 5-6 miles in the morning. Join me! 🏃‍♀️',
        published: true,
        authorId: users[3].id,
      },
    }),
    prisma.post.create({
      data: {
        title: 'Gaming Night This Friday!',
        content: 'Hosting a gaming night at my dorm this Friday. We have got multiple setups for both PC and console games. Snacks provided! 🎮',
        published: true,
        authorId: users[4].id,
      },
    }),
    prisma.post.create({
      data: {
        title: 'Startup Pitch Competition',
        content: 'Participating in the upcoming startup pitch competition. Looking for team members with tech skills. Let us build something amazing together! 🚀',
        published: true,
        authorId: users[5].id,
      },
    }),
    prisma.post.create({
      data: {
        title: 'Stargazing Event Next Week',
        content: 'Weather forecast looks perfect for stargazing next Wednesday. Bringing my telescope to the hill. All space enthusiasts welcome! 🔭✨',
        published: true,
        authorId: users[6].id,
      },
    }),
  ]);
  console.log(`✅ Created ${posts.length} posts`);

  // Create UserPosts
  console.log('📰 Creating user posts...');
  const userPosts = await Promise.all([
    prisma.userPost.create({
      data: {
        title: 'My Coding Journey',
        content: 'Started learning to code 3 years ago and it changed my life. Here is my journey from Hello World to building full-stack apps.',
        postType: 'article',
        userId: users[0].id,
      },
    }),
    prisma.userPost.create({
      data: {
        title: 'Campus Life Photos',
        content: 'Some beautiful shots from around campus this fall.',
        postType: 'image',
        image: 'https://picsum.photos/800/600?random=1',
        userId: users[1].id,
      },
    }),
    prisma.userPost.create({
      data: {
        title: 'My Latest Painting',
        content: 'Just finished this oil painting inspired by impressionist masters.',
        postType: 'image',
        image: 'https://picsum.photos/800/600?random=2',
        userId: users[2].id,
      },
    }),
    prisma.userPost.create({
      data: {
        title: 'Marathon Prep Update',
        content: 'Week 8 of training complete! Sharing my progress and lessons learned.',
        postType: 'article',
        userId: users[3].id,
      },
    }),
    prisma.userPost.create({
      data: {
        title: 'My Gaming Setup Tour',
        content: 'Finally completed my dream gaming setup. Check it out!',
        postType: 'video',
        image: 'https://picsum.photos/800/600?random=3',
        userId: users[4].id,
      },
    }),
    prisma.userPost.create({
      data: {
        title: 'Startup Ideas Brainstorm',
        content: 'Compiled a list of startup ideas for the competition. Looking for feedback!',
        postType: 'article',
        userId: users[5].id,
      },
    }),
    prisma.userPost.create({
      data: {
        title: 'Last Night Astrophotography',
        content: 'Captured some amazing shots of the Milky Way last night.',
        postType: 'image',
        image: 'https://picsum.photos/800/600?random=4',
        userId: users[6].id,
      },
    }),
  ]);
  console.log(`✅ Created ${userPosts.length} user posts`);

  // Create Comments
  console.log('💬 Creating comments...');
  const comments = await Promise.all([
    prisma.comment.create({
      data: {
        content: 'Count me in! I need a study group too.',
        authorId: users[1].id,
        postId: posts[0].id,
      },
    }),
    prisma.comment.create({
      data: {
        content: 'Try the Blue Bottle on University Ave - amazing espresso!',
        authorId: users[0].id,
        postId: posts[1].id,
      },
    }),
    prisma.comment.create({
      data: {
        content: 'I would love to join the art exhibition visit!',
        authorId: users[3].id,
        postId: posts[2].id,
      },
    }),
    prisma.comment.create({
      data: {
        content: 'I run in the evenings, but maybe we can sync up on weekends?',
        authorId: users[0].id,
        postId: posts[3].id,
      },
    }),
    prisma.comment.create({
      data: {
        content: 'What games are you playing? I am bringing my Nintendo Switch!',
        authorId: users[2].id,
        postId: posts[4].id,
      },
    }),
    prisma.comment.create({
      data: {
        content: 'I have some dev experience - would love to help build the MVP!',
        authorId: users[0].id,
        postId: posts[5].id,
      },
    }),
    prisma.comment.create({
      data: {
        content: 'Can you share the coordinates? Would love to join!',
        authorId: users[4].id,
        postId: posts[6].id,
      },
    }),
  ]);
  console.log(`✅ Created ${comments.length} comments`);

  // Create Likes
  console.log('❤️ Creating likes...');
  const likes = await Promise.all([
    prisma.like.create({ data: { userId: users[1].id, postId: posts[0].id } }),
    prisma.like.create({ data: { userId: users[2].id, postId: posts[0].id } }),
    prisma.like.create({ data: { userId: users[3].id, postId: posts[1].id } }),
    prisma.like.create({ data: { userId: users[4].id, postId: posts[2].id } }),
    prisma.like.create({ data: { userId: users[5].id, postId: posts[3].id } }),
    prisma.like.create({ data: { userId: users[6].id, postId: posts[4].id } }),
    prisma.like.create({ data: { userId: users[0].id, postId: posts[5].id } }),
  ]);
  console.log(`✅ Created ${likes.length} likes`);

  // Create Conversations and Messages
  console.log('💌 Creating conversations and messages...');
  const conversations = await Promise.all([
    prisma.conversation.create({
      data: {
        user1Id: users[0].id,
        user2Id: users[1].id,
        lastMessageAt: new Date(),
      },
    }),
    prisma.conversation.create({
      data: {
        user1Id: users[2].id,
        user2Id: users[3].id,
        lastMessageAt: new Date(),
      },
    }),
    prisma.conversation.create({
      data: {
        user1Id: users[4].id,
        user2Id: users[5].id,
        lastMessageAt: new Date(),
      },
    }),
    prisma.conversation.create({
      data: {
        user1Id: users[0].id,
        user2Id: users[6].id,
        lastMessageAt: new Date(),
      },
    }),
    prisma.conversation.create({
      data: {
        user1Id: users[1].id,
        user2Id: users[3].id,
        lastMessageAt: new Date(),
      },
    }),
    prisma.conversation.create({
      data: {
        user1Id: users[2].id,
        user2Id: users[5].id,
        lastMessageAt: new Date(),
      },
    }),
  ]);
  console.log(`✅ Created ${conversations.length} conversations`);

  const messages = await Promise.all([
    // Conversation 1: Alice and Bob
    prisma.message.create({
      data: {
        conversationId: conversations[0].id,
        senderId: users[0].id,
        receiverId: users[1].id,
        content: 'Hey Bob! Saw your post about coffee shops. Any recommendations?',
        messageType: MessageType.TEXT,
        isRead: true,
        isDelivered: true,
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conversations[0].id,
        senderId: users[1].id,
        receiverId: users[0].id,
        content: 'Hey Alice! Yeah, try Philz Coffee - they have amazing iced coffee!',
        messageType: MessageType.TEXT,
        isRead: true,
        isDelivered: true,
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conversations[0].id,
        senderId: users[0].id,
        receiverId: users[1].id,
        content: 'Awesome! Want to grab coffee there sometime?',
        messageType: MessageType.TEXT,
        isRead: false,
        isDelivered: true,
      },
    }),
    // Conversation 2: Charlie and Diana
    prisma.message.create({
      data: {
        conversationId: conversations[1].id,
        senderId: users[2].id,
        receiverId: users[3].id,
        content: 'Hi Diana! I saw you are interested in the art exhibition!',
        messageType: MessageType.TEXT,
        isRead: true,
        isDelivered: true,
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conversations[1].id,
        senderId: users[3].id,
        receiverId: users[2].id,
        content: 'Yes! I have always loved art. When should we go?',
        messageType: MessageType.TEXT,
        isRead: true,
        isDelivered: true,
      },
    }),
    // Conversation 3: Evan and Fiona
    prisma.message.create({
      data: {
        conversationId: conversations[2].id,
        senderId: users[4].id,
        receiverId: users[5].id,
        content: 'Hey! Saw your startup post. I can help with the tech side!',
        messageType: MessageType.TEXT,
        isRead: true,
        isDelivered: true,
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conversations[2].id,
        senderId: users[5].id,
        receiverId: users[4].id,
        content: 'Perfect! Let us meet up this week to discuss ideas.',
        messageType: MessageType.TEXT,
        isRead: false,
        isDelivered: true,
      },
    }),
  ]);
  console.log(`✅ Created ${messages.length} messages`);

  // Create Matches
  console.log('🎯 Creating matches...');
  const matches = await Promise.all([
    prisma.match.create({
      data: {
        user1Id: users[0].id,
        user2Id: users[1].id,
        score: 85.5,
      },
    }),
    prisma.match.create({
      data: {
        user1Id: users[2].id,
        user2Id: users[3].id,
        score: 78.2,
      },
    }),
    prisma.match.create({
      data: {
        user1Id: users[4].id,
        user2Id: users[5].id,
        score: 92.1,
      },
    }),
    prisma.match.create({
      data: {
        user1Id: users[0].id,
        user2Id: users[5].id,
        score: 73.8,
      },
    }),
    prisma.match.create({
      data: {
        user1Id: users[1].id,
        user2Id: users[6].id,
        score: 68.4,
      },
    }),
    prisma.match.create({
      data: {
        user1Id: users[3].id,
        user2Id: users[6].id,
        score: 81.9,
      },
    }),
  ]);
  console.log(`✅ Created ${matches.length} matches`);

  // Create UserLikes
  console.log('💕 Creating user likes...');
  const userLikes = await Promise.all([
    prisma.userLike.create({ data: { senderId: users[0].id, receiverId: users[1].id } }),
    prisma.userLike.create({ data: { senderId: users[1].id, receiverId: users[0].id } }),
    prisma.userLike.create({ data: { senderId: users[2].id, receiverId: users[3].id } }),
    prisma.userLike.create({ data: { senderId: users[3].id, receiverId: users[2].id } }),
    prisma.userLike.create({ data: { senderId: users[4].id, receiverId: users[5].id } }),
    prisma.userLike.create({ data: { senderId: users[5].id, receiverId: users[4].id } }),
    prisma.userLike.create({ data: { senderId: users[6].id, receiverId: users[0].id } }),
  ]);
  console.log(`✅ Created ${userLikes.length} user likes`);

  // Create NotificationReads
  console.log('🔔 Creating notification reads...');
  const notificationReads = await Promise.all([
    prisma.notificationRead.create({
      data: {
        userId: users[0].id,
        notificationId: userLikes[0].id,
        notificationType: 'like',
      },
    }),
    prisma.notificationRead.create({
      data: {
        userId: users[1].id,
        notificationId: matches[0].id,
        notificationType: 'match',
      },
    }),
    prisma.notificationRead.create({
      data: {
        userId: users[2].id,
        notificationId: messages[3].id,
        notificationType: 'message',
      },
    }),
    prisma.notificationRead.create({
      data: {
        userId: users[3].id,
        notificationId: userLikes[2].id,
        notificationType: 'like',
      },
    }),
    prisma.notificationRead.create({
      data: {
        userId: users[4].id,
        notificationId: matches[2].id,
        notificationType: 'match',
      },
    }),
    prisma.notificationRead.create({
      data: {
        userId: users[5].id,
        notificationId: messages[5].id,
        notificationType: 'message',
      },
    }),
  ]);
  console.log(`✅ Created ${notificationReads.length} notification reads`);

  console.log('');
  console.log('🎉 Database seeding completed successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   👥 Users: ${users.length}`);
  console.log(`   📊 ScoreCards: ${scoreCards.length}`);
  console.log(`   ⚙️ UserPreferences: ${userPreferences.length}`);
  console.log(`   🧠 PersonalityTraits: ${personalityTraits.length}`);
  console.log(`   📝 Posts: ${posts.length}`);
  console.log(`   📰 UserPosts: ${userPosts.length}`);
  console.log(`   💬 Comments: ${comments.length}`);
  console.log(`   ❤️ Likes: ${likes.length}`);
  console.log(`   💌 Conversations: ${conversations.length}`);
  console.log(`   ✉️ Messages: ${messages.length}`);
  console.log(`   🎯 Matches: ${matches.length}`);
  console.log(`   💕 UserLikes: ${userLikes.length}`);
  console.log(`   🔔 NotificationReads: ${notificationReads.length}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
