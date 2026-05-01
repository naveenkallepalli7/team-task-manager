/**
 * Seed Script: Populates database with sample data for testing
 * Usage: npm run seed
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User.model');
const Project = require('../models/Project.model');
const Task = require('../models/Task.model');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/team-task-manager';

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create users
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@taskmanager.com',
      password: 'Admin@123',
      role: 'admin',
    });

    const member1 = await User.create({
      name: 'Alice Johnson',
      email: 'alice@taskmanager.com',
      password: 'Member@123',
      role: 'member',
    });

    const member2 = await User.create({
      name: 'Bob Williams',
      email: 'bob@taskmanager.com',
      password: 'Member@123',
      role: 'member',
    });

    const member3 = await User.create({
      name: 'Carol Smith',
      email: 'carol@taskmanager.com',
      password: 'Member@123',
      role: 'member',
    });

    console.log('👥 Created users');

    // Create projects
    const project1 = await Project.create({
      name: 'Website Redesign',
      description: 'Complete overhaul of company website with modern UI/UX and improved performance.',
      createdBy: adminUser._id,
      members: [member1._id, member2._id, member3._id],
    });

    const project2 = await Project.create({
      name: 'Mobile App Development',
      description: 'Build cross-platform mobile app for iOS and Android.',
      createdBy: adminUser._id,
      members: [member1._id, member2._id],
    });

    const project3 = await Project.create({
      name: 'Data Analytics Platform',
      description: 'Internal analytics dashboard for business intelligence.',
      createdBy: adminUser._id,
      members: [member3._id],
    });

    console.log('📁 Created projects');

    // Create tasks with varied dates and statuses
    const now = new Date();
    const tasks = [
      // Website Redesign tasks
      {
        title: 'Design new homepage mockup',
        description: 'Create wireframes and high-fidelity mockups for the homepage redesign.',
        status: 'Completed',
        priority: 'High',
        dueDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        projectId: project1._id,
        assignedTo: member1._id,
        createdBy: adminUser._id,
        tags: ['design', 'UI'],
      },
      {
        title: 'Implement responsive navigation',
        description: 'Build a fully responsive navigation menu with mobile hamburger support.',
        status: 'In Progress',
        priority: 'High',
        dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        projectId: project1._id,
        assignedTo: member2._id,
        createdBy: adminUser._id,
        tags: ['frontend', 'CSS'],
      },
      {
        title: 'Optimize page load speed',
        description: 'Reduce LCP and improve Core Web Vitals scores to 90+.',
        status: 'Pending',
        priority: 'Medium',
        dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        projectId: project1._id,
        assignedTo: member1._id,
        createdBy: adminUser._id,
        tags: ['performance'],
      },
      {
        title: 'Set up CI/CD pipeline',
        description: 'Configure GitHub Actions for automated testing and deployment.',
        status: 'Pending',
        priority: 'Medium',
        dueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago (OVERDUE)
        projectId: project1._id,
        assignedTo: member3._id,
        createdBy: adminUser._id,
        tags: ['devops'],
      },

      // Mobile App tasks
      {
        title: 'Design app architecture',
        description: 'Plan the technical architecture and choose appropriate tech stack.',
        status: 'Completed',
        priority: 'High',
        dueDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        projectId: project2._id,
        assignedTo: member2._id,
        createdBy: adminUser._id,
        tags: ['architecture'],
      },
      {
        title: 'Build authentication screens',
        description: 'Login, signup, forgot password, and profile screens.',
        status: 'In Progress',
        priority: 'High',
        dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        projectId: project2._id,
        assignedTo: member1._id,
        createdBy: adminUser._id,
        tags: ['auth', 'screens'],
      },
      {
        title: 'Integrate push notifications',
        description: 'Set up Firebase Cloud Messaging for push notifications.',
        status: 'Pending',
        priority: 'Low',
        dueDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        projectId: project2._id,
        assignedTo: member2._id,
        createdBy: adminUser._id,
        tags: ['notifications', 'firebase'],
      },
      {
        title: 'API integration for products',
        description: 'Connect mobile app to backend APIs for product listing and detail pages.',
        status: 'Pending',
        priority: 'High',
        dueDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // Yesterday (OVERDUE)
        projectId: project2._id,
        assignedTo: member1._id,
        createdBy: adminUser._id,
        tags: ['api', 'integration'],
      },

      // Analytics Platform tasks
      {
        title: 'Set up data pipeline',
        description: 'Configure ETL pipeline to ingest data from multiple sources.',
        status: 'In Progress',
        priority: 'High',
        dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        projectId: project3._id,
        assignedTo: member3._id,
        createdBy: adminUser._id,
        tags: ['data', 'ETL'],
      },
      {
        title: 'Build dashboard charts',
        description: 'Create interactive charts and graphs for the analytics dashboard.',
        status: 'Pending',
        priority: 'Medium',
        dueDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        projectId: project3._id,
        assignedTo: member3._id,
        createdBy: adminUser._id,
        tags: ['charts', 'visualization'],
      },
    ];

    await Task.insertMany(tasks);
    console.log('✅ Created tasks');

    console.log('\n🎉 Seed completed successfully!\n');
    console.log('─────────────────────────────────────────');
    console.log('🔑 Test Credentials:');
    console.log('─────────────────────────────────────────');
    console.log('👑 Admin:  admin@taskmanager.com  /  Admin@123');
    console.log('👤 Member: alice@taskmanager.com  /  Member@123');
    console.log('👤 Member: bob@taskmanager.com    /  Member@123');
    console.log('👤 Member: carol@taskmanager.com  /  Member@123');
    console.log('─────────────────────────────────────────\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
};

seedData();
