import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Categories & Skills
  const categoriesData = [
    { name: 'Ayurveda', desc: 'Traditional Indian system of medicine' },
    { name: 'Yoga', desc: 'Physical, mental, and spiritual practices' },
    { name: 'Unani', desc: 'Perso-Arabic traditional medicine' },
    { name: 'Siddha', desc: 'Traditional medicine originating in South India' },
    { name: 'Homeopathy', desc: 'Alternative medicine system' },
    { name: 'Naturopathy', desc: 'System of alternative medicine based on natural healing' },
  ];

  const createdCategories = [];
  for (const cat of categoriesData) {
    const createdCat = await prisma.skillCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: { name: cat.name, description: cat.desc },
    });
    createdCategories.push(createdCat);
  }

  const skillsData = [
    { category: 'Ayurveda', name: 'Panchakarma Therapy', level: 5 },
    { category: 'Ayurveda', name: 'Ayurvedic Dietetics', level: 4 },
    { category: 'Ayurveda', name: 'Herbology', level: 6 },
    { category: 'Ayurveda', name: 'Nadi Pariksha', level: 7 },
    { category: 'Ayurveda', name: 'Marma Therapy', level: 8 },
    { category: 'Yoga', name: 'Asana Practice', level: 3 },
    { category: 'Yoga', name: 'Pranayama Techniques', level: 4 },
    { category: 'Yoga', name: 'Meditation Guidance', level: 5 },
    { category: 'Yoga', name: 'Yoga Therapy', level: 7 },
    { category: 'Yoga', name: 'Anatomy and Physiology', level: 6 },
    { category: 'Unani', name: 'Ilaj-bil-Tadbeer', level: 6 },
    { category: 'Unani', name: 'Pharmacognosy', level: 5 },
    { category: 'Unani', name: 'Mizaj Assessment', level: 7 },
    { category: 'Unani', name: 'Kulliyat', level: 8 },
    { category: 'Unani', name: 'Moalajat', level: 9 },
    { category: 'Siddha', name: 'Varmam Therapy', level: 7 },
    { category: 'Siddha', name: 'Thokkanam', level: 6 },
    { category: 'Siddha', name: 'Siddha Pharmacology', level: 8 },
    { category: 'Siddha', name: 'Naadi Diagnosis', level: 7 },
    { category: 'Siddha', name: 'Yogam', level: 5 },
    { category: 'Homeopathy', name: 'Materia Medica', level: 6 },
    { category: 'Homeopathy', name: 'Repertory', level: 7 },
    { category: 'Homeopathy', name: 'Pharmacy', level: 5 },
    { category: 'Homeopathy', name: 'Organon of Medicine', level: 8 },
    { category: 'Homeopathy', name: 'Case Taking', level: 6 },
    { category: 'Naturopathy', name: 'Hydrotherapy', level: 5 },
    { category: 'Naturopathy', name: 'Mud Therapy', level: 4 },
    { category: 'Naturopathy', name: 'Fasting Therapy', level: 6 },
    { category: 'Naturopathy', name: 'Chromotherapy', level: 5 },
    { category: 'Naturopathy', name: 'Diet Therapy', level: 6 },
  ];

  for (const skill of skillsData) {
    const cat = createdCategories.find(c => c.name === skill.category);
    await prisma.skill.create({
      data: {
        categoryId: cat.id,
        name: skill.name,
        nsqfLevel: skill.level,
        description: `Proficiency in ${skill.name}`
      }
    });
  }

  // 2. Users & Profiles
  const hashedPassword = await bcrypt.hash('password123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@ayush.gov.in',
      password: adminPassword,
      role: 'ADMIN',
      name: 'Super Admin',
      phone: '9999999999'
    }
  });

  const studentUser = await prisma.user.create({
    data: {
      email: 'student@ayush.edu',
      password: hashedPassword,
      role: 'STUDENT',
      name: 'Ravi Kumar',
      phone: '9876543210',
      studentProfile: {
        create: {
          specialization: 'BAMS',
          institution: 'National Institute of Ayurveda',
          enrollmentYear: 2021,
          bio: 'Passionate about integrating ancient wisdom with modern science.',
          skills: JSON.stringify(['Panchakarma Therapy', 'Herbology']),
        }
      }
    },
    include: { studentProfile: true }
  });

  const industryUser = await prisma.user.create({
    data: {
      email: 'industry@ayush.com',
      password: hashedPassword,
      role: 'INDUSTRY',
      name: 'Dabur India Rep',
      phone: '1234567890',
      industryProfile: {
        create: {
          companyName: 'Dabur India',
          industry: 'Ayurvedic Pharmaceuticals',
          website: 'https://dabur.com',
          location: 'Delhi NCR'
        }
      }
    }
  });

  const academicianUser = await prisma.user.create({
    data: {
      email: 'academician@ayush.edu',
      password: hashedPassword,
      role: 'ACADEMICIAN',
      name: 'Dr. Anita Sharma',
      academicianProfile: {
        create: {
          institution: 'All India Institute of Ayurveda',
          department: 'Dravyaguna',
          designation: 'Professor',
          expertise: JSON.stringify(['Pharmacognosy', 'Clinical Research'])
        }
      }
    }
  });

  const institutionUser = await prisma.user.create({
    data: {
      email: 'institution@ayush.edu',
      password: hashedPassword,
      role: 'INSTITUTION',
      name: 'NIA Admin',
      institutionProfile: {
        create: {
          institutionName: 'National Institute of Ayurveda',
          type: 'Government',
          location: 'Jaipur',
          website: 'https://nia.nic.in'
        }
      }
    }
  });

  // 3. Assessments
  const sampleQuestions = JSON.stringify([
    { question: 'What is the primary concept in Ayurveda?', options: ['Tridosha', 'Yin-Yang', 'Humors', 'Qi'], correctIndex: 0 },
    { question: 'Which of these is NOT a dosha?', options: ['Vata', 'Pitta', 'Kapha', 'Agni'], correctIndex: 3 },
    { question: 'What is the literal meaning of Ayurveda?', options: ['Science of life', 'Science of herbs', 'Science of diet', 'Science of body'], correctIndex: 0 },
    { question: 'What is the standard text of Ayurveda?', options: ['Charaka Samhita', 'Rig Veda', 'Upanishads', 'Mahabharata'], correctIndex: 0 },
    { question: 'What is the primary treatment in Ayurveda?', options: ['Panchakarma', 'Surgery', 'Acupuncture', 'Chemotherapy'], correctIndex: 0 },
    { question: 'What dosha is associated with fire?', options: ['Vata', 'Pitta', 'Kapha', 'None'], correctIndex: 1 },
    { question: 'Which herb is commonly used for immunity?', options: ['Ashwagandha', 'Neem', 'Tulsi', 'All of the above'], correctIndex: 3 },
    { question: 'What is the digestive fire called in Ayurveda?', options: ['Agni', 'Ojas', 'Ama', 'Prana'], correctIndex: 0 },
    { question: 'Which sense organ is related to Vata?', options: ['Skin', 'Eyes', 'Tongue', 'Nose'], correctIndex: 0 },
    { question: 'What is the end product of perfect digestion?', options: ['Ojas', 'Ama', 'Mala', 'Rasa'], correctIndex: 0 },
  ]);

  const ayurvedaCat = createdCategories.find(c => c.name === 'Ayurveda');
  const yogaCat = createdCategories.find(c => c.name === 'Yoga');

  await prisma.assessment.create({
    data: {
      title: 'Ayurveda Basics NSQF Level 4',
      description: 'Fundamental assessment of Ayurvedic principles.',
      categoryId: ayurvedaCat.id,
      questions: sampleQuestions,
      duration: 30,
      totalMarks: 100
    }
  });

  await prisma.assessment.create({
    data: {
      title: 'Advanced Panchakarma NSQF Level 7',
      description: 'Test on detoxification procedures.',
      categoryId: ayurvedaCat.id,
      questions: sampleQuestions, // Reusing for demo
      duration: 45,
      totalMarks: 100
    }
  });

  await prisma.assessment.create({
    data: {
      title: 'Yoga Instructor Foundation',
      description: 'Basic asana and pranayama theory.',
      categoryId: yogaCat.id,
      questions: sampleQuestions, // Reusing for demo
      duration: 30,
      totalMarks: 100
    }
  });

  // 4. Opportunities
  await prisma.postedOpportunity.createMany({
    data: [
      {
        postedById: industryUser.id,
        title: 'Junior Ayurvedic Pharmacist',
        description: 'Looking for a fresh graduate to join our formulation team.',
        type: 'JOB',
        location: 'Delhi',
        isRemote: false,
        skillsRequired: JSON.stringify(['Herbology', 'Ayurvedic Dietetics']),
        stipend: '30000 INR/month',
      },
      {
        postedById: industryUser.id,
        title: 'Research Intern - Medicinal Plants',
        description: '3-month internship to study local flora.',
        type: 'INTERNSHIP',
        location: 'Remote',
        isRemote: true,
        skillsRequired: JSON.stringify(['Pharmacognosy']),
        stipend: '10000 INR/month',
      },
      {
        postedById: academicianUser.id,
        title: 'Research Assistant for Clinical Trial',
        description: 'Assisting in data collection for new formulation.',
        type: 'RESEARCH',
        location: 'Jaipur',
        isRemote: false,
        skillsRequired: JSON.stringify(['Clinical Research', 'Data Entry']),
        stipend: '20000 INR/month',
      },
      {
        postedById: institutionUser.id,
        title: 'Faculty Development Program on Tele-Medicine',
        description: '1-week online workshop for faculty.',
        type: 'FDP',
        location: 'Online',
        isRemote: true,
        skillsRequired: JSON.stringify(['Basic IT skills']),
      },
      {
        postedById: industryUser.id,
        title: 'Yoga Therapist for Corporate Wellness',
        description: 'Part-time project leading yoga sessions.',
        type: 'PROJECT',
        location: 'Mumbai',
        isRemote: false,
        skillsRequired: JSON.stringify(['Asana Practice', 'Yoga Therapy']),
        stipend: '15000 INR/project',
      }
    ]
  });

  // 5. Sample Certificates & Projects for Student
  await prisma.certificate.create({
    data: {
      studentId: studentUser.studentProfile.id,
      title: 'Certificate in Advanced Panchakarma',
      issuer: 'National Institute of Ayurveda',
      issueDate: new Date('2023-05-15'),
      description: 'Completed 6-month hands-on training.',
    }
  });

  await prisma.project.create({
    data: {
      studentId: studentUser.studentProfile.id,
      title: 'Efficacy of Ashwagandha in Stress Management',
      description: 'A literature review and small-scale survey study.',
      technologies: JSON.stringify(['SurveyMonkey', 'SPSS']),
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-06-01')
    }
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
