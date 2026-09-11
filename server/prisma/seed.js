import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing old transaction data for deterministic seed...');
  await prisma.application.deleteMany();
  await prisma.assessmentResult.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.postedOpportunity.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.project.deleteMany();
  await prisma.mentorFeedback.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.industryProfile.deleteMany();
  await prisma.academicianProfile.deleteMany();
  await prisma.institutionProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding database with verified NSQF taxonomy...');

  // 1. Skill Taxonomy (Real NQR/HSSC Data)
  const taxonomyData = [
    {
      qpCode: "HSS/Q3601",
      roleName: "Panchakarma Technician",
      nsqfLevel: 4,
      competencyUnits: [
        { code: "HSS/N3601", name: "Prepare for panchakarma therapy session" },
        { code: "HSS/N3602", name: "Provide panchakarma therapy as per guidance/prescription" },
        { code: "HSS/N3603", name: "Carry out post panchakarma therapy procedures" },
        { code: "HSS/N9617", name: "Maintain a safe, healthy and secure working environment" },
        { code: "HSS/N9618", name: "Follow biomedical waste disposal and infection control policies" }
      ]
    },
    {
      qpCode: "HSS/Q3901",
      roleName: "Ayurveda Ahar and Poshan Sahayak",
      nsqfLevel: 3,
      competencyUnits: [
        { code: "HSS/N3901", name: "Provide support to Ayurveda Dietician in administrative work" },
        { code: "HSS/N3902", name: "Support during cooking procedures in line with Ayurveda principles" },
        { code: "HSS/N3903", name: "Carry out routine activities in the kitchen" },
        { code: "HSS/N9615", name: "Maintain interpersonal relationship with client, colleagues, and others" },
        { code: "HSS/N9617", name: "Maintain a safe, healthy and secure working environment" },
        { code: "HSS/N9620", name: "Comply with infection control and biomedical waste disposal policies" }
      ]
    },
    {
      qpCode: "HSS/Q3902",
      roleName: "Ayurveda Dietician",
      nsqfLevel: 5,
      competencyUnits: [
        { code: "HSS/N3904", name: "Prepare an ayurvedic diet plan as per client's health and medical conditions" },
        { code: "HSS/N3905", name: "Educate the client on customized diet plan in accordance with ayurvedic principles" },
        { code: "HSS/N3906", name: "Evaluate the effectiveness of the diet plan" },
        { code: "HSS/N3907", name: "Document and maintain the dietetic records for follow up activities" },
        { code: "HSS/N9617", name: "Maintain a safe, healthy and secure working environment" },
        { code: "HSS/N9620", name: "Comply infection control & biomedical waste disposal policies" }
      ]
    }
  ];

  for (const t of taxonomyData) {
    await prisma.skillTaxonomy.upsert({
      where: { qpCode: t.qpCode },
      update: {
        roleName: t.roleName,
        nsqfLevel: t.nsqfLevel,
        competencyUnits: t.competencyUnits
      },
      create: {
        qpCode: t.qpCode,
        roleName: t.roleName,
        nsqfLevel: t.nsqfLevel,
        competencyUnits: t.competencyUnits
      }
    });
  }

  // 2. Users & Profiles
  const hashedPassword = await bcrypt.hash('password123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);

  await prisma.user.create({
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
          specialization: 'Ayurveda Dietetics',
          institution: 'National Institute of Ayurveda',
          enrollmentYear: 2021,
          bio: 'Final year BAMS student specializing in Ayurvedic dietetics, Prakriti assessment, and therapeutic nutrition planning.',
          skills: JSON.stringify(['Ahara Vijnana', 'Diet Planning', 'Prakriti Assessment', 'Pathya Apathya', 'Nutritional Counseling'])
        }
      }
    }
  });

  const industryUser = await prisma.user.create({
    data: {
      email: 'industry@ayush.com',
      password: hashedPassword,
      role: 'INDUSTRY',
      name: 'Patanjali Research Foundation',
      industryProfile: {
        create: {
          companyName: 'Patanjali Research Foundation',
          industry: 'Ayurveda Pharmaceuticals & Clinical Wellness',
          location: 'Haridwar, Uttarakhand',
          description: 'Pioneering evidence-based Ayurvedic formulations, clinical dietetics, and therapeutic patient care.'
        }
      }
    }
  });

  const academicianUser = await prisma.user.create({
    data: {
      email: 'academician@ayush.edu',
      password: hashedPassword,
      role: 'ACADEMICIAN',
      name: 'Dr. Vasant Lad',
      academicianProfile: {
        create: {
          institution: 'Ayurvedic Institute',
          department: 'Dravyaguna & Ahara Vijnana',
          designation: 'Professor',
          expertise: JSON.stringify(['Ahara Vijnana', 'Panchakarma', 'Nadi Pariksha'])
        }
      }
    }
  });

  const institutionUser = await prisma.user.create({
    data: {
      email: 'institution@ayush.edu',
      password: hashedPassword,
      role: 'INSTITUTION',
      name: 'All India Institute of Ayurveda',
      institutionProfile: {
        create: {
          institutionName: 'All India Institute of Ayurveda (AIIA)',
          type: 'Government Apex Institute',
          location: 'New Delhi'
        }
      }
    }
  });

  // 3. Assessments
  const assessmentDiet = await prisma.assessment.create({
    data: {
      title: 'Ayurveda Dietetics & Nutrition Planning (Level 5)',
      description: 'Comprehensive evaluation of Ahara Vijnana, client Prakriti analysis, customized diet plan preparation, and pathya guidelines.',
      qpCode: 'HSS/Q3902',
      duration: 30,
      totalMarks: 50,
      questions: JSON.stringify([
        { q: 'What is Ahara Vijnana?', options: ['Dietetics & Nutrition Science', 'Surgical Technique', 'Bone Setting', 'Yoga Postures'], correctIndex: 0 },
        { q: 'Which factor is most critical when designing an individualized Ayurvedic diet plan?', options: ['Client Prakriti & Agni status', 'Caloric deficit only', 'Time of sunrise', 'Blood type'], correctIndex: 0 },
        { q: 'Which of the following is considered the primary seat of Agni in Ahara metabolism?', options: ['Grahani', 'Hridaya', 'Kanta', 'Sirah'], correctIndex: 0 }
      ])
    }
  });

  const assessmentPancha = await prisma.assessment.create({
    data: {
      title: 'Panchakarma Protocol & Procedures (Level 4)',
      description: 'Assessment of Snehana, Swedana, Shirodhara setup, and biomedical waste compliance.',
      qpCode: 'HSS/Q3601',
      duration: 45,
      totalMarks: 100,
      questions: JSON.stringify([
        { q: 'What is the preparatory procedure before Pradhana Karma in Panchakarma?', options: ['Purvakarma (Snehana & Swedana)', 'Paschatkarma', 'Samsarjana Krama', 'Langhana'], correctIndex: 0 },
        { q: 'Which color-coded bin is mandated for infectious biomedical waste?', options: ['Yellow', 'Green', 'Blue', 'Black'], correctIndex: 0 }
      ])
    }
  });

  // 4. Seed Assessment Result for Student (Demonstrating verified competency in Dietetics)
  const studentProfile = await prisma.studentProfile.findUnique({ where: { userId: studentUser.id } });
  if (studentProfile) {
    await prisma.assessmentResult.create({
      data: {
        studentId: studentProfile.id,
        assessmentId: assessmentDiet.id,
        score: 48,
        maxScore: 50,
        answers: JSON.stringify({ 0: 0, 1: 0, 2: 0 }),
        skillScores: JSON.stringify({
          "Prepare ayurvedic diet plan": 96,
          "Client Prakriti assessment": 95,
          "Nutritional counseling": 92
        })
      }
    });
  }

  // 5. Opportunities (Differentiated across semantic relevance and qualification packs)

  // Opportunity 1: Exceptional semantic match for student targeting Ayurveda Dietician
  await prisma.postedOpportunity.create({
    data: {
      postedById: industryUser.id,
      title: 'Clinical Ayurveda Dietician & Nutritionist Intern',
      description: 'Seeking a dedicated intern in Ayurvedic Clinical Nutrition. You will work alongside certified Ayurveda Dieticians to assess patient Prakriti, formulate personalized Ahara dietary regimens according to medical conditions, maintain clinical dietetic documentation, and counsel patients on pathya and apathya nutrition principles.',
      type: 'INTERNSHIP',
      location: 'Haridwar, Uttarakhand',
      requiredQpCodes: JSON.stringify(['HSS/Q3902']),
      stipend: '₹18,000/month',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });

  // Opportunity 2: Moderate semantic match - Assistant in dietary kitchen
  await prisma.postedOpportunity.create({
    data: {
      postedById: industryUser.id,
      title: 'Ayurveda Ahara & Poshan Kitchen Assistant',
      description: 'Support the hospital dietary department with administrative records, standard herbal food preparation in accordance with classical Ayurveda principles, maintaining safe sanitary kitchen standards, and assisting senior nutritionists with routine food distribution.',
      type: 'INTERNSHIP',
      location: 'New Delhi',
      requiredQpCodes: JSON.stringify(['HSS/Q3901']),
      stipend: '₹12,000/month',
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
    }
  });

  // Opportunity 3: Low semantic match for dietetics - Therapy / Panchakarma procedures
  await prisma.postedOpportunity.create({
    data: {
      postedById: industryUser.id,
      title: 'Panchakarma Therapy Assistant',
      description: 'Perform authentic Panchakarma clinical procedures including Snehana, Swedana, Shirodhara, and Basti under the direct supervision of Senior Vaidyas. Prepare therapeutic decoctions and oils, maintain treatment table sanitation, and manage biomedical waste according to HSSC infection control protocols.',
      type: 'JOB',
      location: 'Rishikesh, Uttarakhand',
      requiredQpCodes: JSON.stringify(['HSS/Q3601']),
      stipend: '₹22,000/month',
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    }
  });

  // Opportunity 4: General AYUSH wellness - Yoga & lifestyle meditation
  await prisma.postedOpportunity.create({
    data: {
      postedById: industryUser.id,
      title: 'Yoga & Holistic Lifestyle Wellness Counselor',
      description: 'Conduct morning yoga asana sessions, pranayama breathwork, and general relaxation meditation classes for wellness retreat guests. Guide clients in stress reduction techniques and healthy daily living routines without clinical dietary intervention.',
      type: 'JOB',
      location: 'Goa (Hybrid)',
      requiredQpCodes: JSON.stringify([]),
      stipend: '₹25,000/month',
      deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
    }
  });

  console.log('Seeding completed successfully with real verified NSQF data!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
