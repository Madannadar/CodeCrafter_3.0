require('dotenv').config();
const mongoose = require('mongoose');
const Subject = require('./models/Subject');

const subjects = [
  { id: '12th_math', name: '12th Mathematics (Complex Numbers)', shortName: '12th Math', color: '#a78bfa', icon: '📐' },
  { id: 'math1', name: 'Engineering Mathematics 1', shortName: 'Math I', color: '#8b5cf6', icon: '∑', prerequisiteId: '12th_math' },
  { id: 'm2', name: 'Engineering Mathematics 2', shortName: 'Math II', color: '#ec4899', icon: '∫', prerequisiteId: 'math1' },
  
  { id: '12th_phy', name: '12th Physics (Dual Nature)', shortName: '12th Physics', color: '#fbbf24', icon: '🔬' },
  { id: 'phy1', name: 'Engineering Physics 1', shortName: 'Physics', color: '#f59e0b', icon: '⚛', prerequisiteId: '12th_phy' },
  { id: 'phy2', name: 'Engineering Physics 2', shortName: 'Physics II', color: '#f97316', icon: '🧲', prerequisiteId: 'phy1' },
  
  { id: 'chem1', name: 'Engineering Chemistry 1', shortName: 'Chemistry', color: '#10b981', icon: '⚗' },
  { id: 'chem2', name: 'Engineering Chemistry 2', shortName: 'Chemistry II', color: '#14b8a6', icon: '🧪', prerequisiteId: 'chem1' },
  
  { id: 'pre_bee', name: 'BEE Prerequisites', shortName: 'Pre-BEE', color: '#f87171', icon: '🔌' },
  { id: 'bee', name: 'Basic Electrical Engineering', shortName: 'Electrical', color: '#ef4444', icon: '⚡', prerequisiteId: 'pre_bee' },
  
  { id: 'pre_mech', name: 'Mechanics Prerequisites', shortName: 'Pre-Mech', color: '#22d3ee', icon: '📏' },
  { id: 'mech', name: 'Engineering Mechanics', shortName: 'Mechanics', color: '#06b6d4', icon: '⚙', prerequisiteId: 'pre_mech' },
  
  { id: 'eg', name: 'Engineering Graphics', shortName: 'Graphics', color: '#3b82f6', icon: '📐' },
  { id: 'cp', name: 'Computer Programming', shortName: 'Programming', color: '#eab308', icon: '💻' },
  
  { id: 'dbms', name: 'Database Management Systems', shortName: 'DBMS', color: '#f43f5e', icon: '🗄️' },
  { id: 'os', name: 'Operating Systems', shortName: 'OS', color: '#0ea5e9', icon: '🖥️' },
  { id: 'mp', name: 'Microprocessors', shortName: 'MP', color: '#10b981', icon: '🔌' },
];

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected for seeding');
    try {
      // Clear existing subjects
      await Subject.deleteMany({});
      console.log('Existing subjects cleared');

      // Insert new
      await Subject.insertMany(subjects);
      console.log('Successfully seeded subjects');
      process.exit(0);
    } catch (err) {
      console.error('Error seeding subjects:', err);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
