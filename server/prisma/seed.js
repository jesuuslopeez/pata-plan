const { PrismaClient } = require('.prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.expense.deleteMany();
  await prisma.document.deleteMany();
  await prisma.vetVisit.deleteMany();
  await prisma.healthEvent.deleteMany();
  await prisma.protocolAssignment.deleteMany();
  await prisma.protocolStep.deleteMany();
  await prisma.protocol.deleteMany();
  await prisma.weightRecord.deleteMany();
  await prisma.eventType.deleteMany();
  await prisma.animal.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();

  // User
  const passwordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@pataplan.com',
      passwordHash,
      role: 'ADMIN',
    },
  });

  // Groups
  const casa = await prisma.group.create({
    data: { name: 'Casa', userId: admin.id },
  });
  const refugio = await prisma.group.create({
    data: { name: 'Refugio', userId: admin.id },
  });

  // Animals - Casa
  const rocky = await prisma.animal.create({
    data: {
      name: 'Rocky',
      species: 'DOG',
      breed: 'Labrador',
      sex: 'MALE',
      dateOfBirth: new Date('2020-03-15'),
      microchip: '941000012345678',
      groupId: casa.id,
    },
  });
  const luna = await prisma.animal.create({
    data: {
      name: 'Luna',
      species: 'CAT',
      breed: 'European Shorthair',
      sex: 'FEMALE',
      dateOfBirth: new Date('2021-06-10'),
      groupId: casa.id,
    },
  });
  const simba = await prisma.animal.create({
    data: {
      name: 'Simba',
      species: 'CAT',
      breed: 'Siamese',
      sex: 'MALE',
      dateOfBirth: new Date('2022-01-20'),
      groupId: casa.id,
    },
  });
  const nala = await prisma.animal.create({
    data: {
      name: 'Nala',
      species: 'CAT',
      sex: 'FEMALE',
      dateOfBirth: new Date('2022-01-20'),
      groupId: casa.id,
    },
  });

  // Animals - Refugio
  const milo = await prisma.animal.create({
    data: {
      name: 'Milo',
      species: 'CAT',
      sex: 'MALE',
      dateOfBirth: new Date('2023-04-01'),
      notes: 'Found in the street, very friendly',
      groupId: refugio.id,
    },
  });
  const cleo = await prisma.animal.create({
    data: {
      name: 'Cleo',
      species: 'CAT',
      sex: 'FEMALE',
      dateOfBirth: new Date('2023-08-15'),
      groupId: refugio.id,
    },
  });
  const oliver = await prisma.animal.create({
    data: {
      name: 'Oliver',
      species: 'CAT',
      sex: 'MALE',
      notes: 'Shy, needs patience',
      groupId: refugio.id,
    },
  });

  // Event types
  const vacTrivalente = await prisma.eventType.create({
    data: { name: 'Trivalent vaccine', category: 'VACCINE', severityScore: 8 },
  });
  const vacRabia = await prisma.eventType.create({
    data: { name: 'Rabies vaccine', category: 'VACCINE', severityScore: 9 },
  });
  const despInterna = await prisma.eventType.create({
    data: { name: 'Internal deworming', category: 'DEWORMING_INTERNAL', severityScore: 6 },
  });
  const despExterna = await prisma.eventType.create({
    data: { name: 'External deworming', category: 'DEWORMING_EXTERNAL', severityScore: 5 },
  });
  const revision = await prisma.eventType.create({
    data: { name: 'General checkup', category: 'CHECKUP', severityScore: 4 },
  });

  // Health events
  const now = new Date();
  const daysAgo = (d) => new Date(now.getTime() - d * 86400000);
  const daysFromNow = (d) => new Date(now.getTime() + d * 86400000);

  // Rocky - completed vaccine, overdue deworming, pending checkup
  await prisma.healthEvent.createMany({
    data: [
      {
        animalId: rocky.id,
        eventTypeId: vacRabia.id,
        scheduledDate: daysAgo(90),
        completedDate: daysAgo(90),
        product: 'Nobivac Rabies',
        vetName: 'Dr. Garcia',
        status: 'COMPLETED',
        frequencyDays: 365,
        nextDueDate: daysFromNow(275),
      },
      {
        animalId: rocky.id,
        eventTypeId: despInterna.id,
        scheduledDate: daysAgo(10),
        status: 'OVERDUE',
        frequencyDays: 90,
      },
      {
        animalId: rocky.id,
        eventTypeId: revision.id,
        scheduledDate: daysFromNow(15),
        status: 'PENDING',
      },
    ],
  });

  // Luna - completed trivalent, pending external deworming
  await prisma.healthEvent.createMany({
    data: [
      {
        animalId: luna.id,
        eventTypeId: vacTrivalente.id,
        scheduledDate: daysAgo(60),
        completedDate: daysAgo(58),
        product: 'Purevax RCPCh',
        status: 'COMPLETED',
        frequencyDays: 365,
        nextDueDate: daysFromNow(305),
      },
      {
        animalId: luna.id,
        eventTypeId: despExterna.id,
        scheduledDate: daysFromNow(5),
        status: 'PENDING',
        frequencyDays: 30,
      },
    ],
  });

  // Simba - overdue vaccine
  await prisma.healthEvent.create({
    data: {
      animalId: simba.id,
      eventTypeId: vacTrivalente.id,
      scheduledDate: daysAgo(20),
      status: 'OVERDUE',
    },
  });

  // Nala - pending deworming
  await prisma.healthEvent.create({
    data: {
      animalId: nala.id,
      eventTypeId: despInterna.id,
      scheduledDate: daysFromNow(3),
      status: 'PENDING',
      frequencyDays: 90,
    },
  });

  // Milo - completed deworming, pending vaccine
  await prisma.healthEvent.createMany({
    data: [
      {
        animalId: milo.id,
        eventTypeId: despInterna.id,
        scheduledDate: daysAgo(30),
        completedDate: daysAgo(30),
        product: 'Milbemax',
        status: 'COMPLETED',
      },
      {
        animalId: milo.id,
        eventTypeId: vacTrivalente.id,
        scheduledDate: daysFromNow(7),
        status: 'PENDING',
      },
    ],
  });

  // Cleo - overdue checkup
  await prisma.healthEvent.create({
    data: {
      animalId: cleo.id,
      eventTypeId: revision.id,
      scheduledDate: daysAgo(5),
      status: 'OVERDUE',
    },
  });

  // Oliver - pending deworming
  await prisma.healthEvent.create({
    data: {
      animalId: oliver.id,
      eventTypeId: despExterna.id,
      scheduledDate: daysFromNow(10),
      status: 'PENDING',
    },
  });

  // Weight records - Rocky
  await prisma.weightRecord.createMany({
    data: [
      { animalId: rocky.id, valueKg: 28.5, recordedAt: daysAgo(180) },
      { animalId: rocky.id, valueKg: 29.0, recordedAt: daysAgo(120) },
      { animalId: rocky.id, valueKg: 29.2, recordedAt: daysAgo(60) },
      { animalId: rocky.id, valueKg: 29.5, recordedAt: daysAgo(0) },
    ],
  });

  // Weight records - Luna
  await prisma.weightRecord.createMany({
    data: [
      { animalId: luna.id, valueKg: 3.8, recordedAt: daysAgo(120) },
      { animalId: luna.id, valueKg: 4.0, recordedAt: daysAgo(60) },
      { animalId: luna.id, valueKg: 4.1, recordedAt: daysAgo(0) },
    ],
  });

  // Vet visit - Rocky
  await prisma.vetVisit.create({
    data: {
      animalId: rocky.id,
      visitDate: daysAgo(90),
      reason: 'Annual checkup and rabies vaccination',
      diagnosis: 'Healthy, no issues found',
      treatment: 'Rabies vaccine administered',
      vetName: 'Dr. Garcia',
      observations: 'Weight stable, good dental health',
      cost: 65.00,
    },
  });

  // Protocol - Nuevo gato refugio
  await prisma.protocol.create({
    data: {
      name: 'New shelter cat',
      description: 'Standard protocol for newly arrived shelter cats',
      userId: admin.id,
      steps: {
        create: [
          { eventTypeId: despInterna.id, dayOffset: 0, product: 'Milbemax', notes: 'First deworming on arrival', sortOrder: 1 },
          { eventTypeId: vacTrivalente.id, dayOffset: 15, product: 'Purevax RCPCh', notes: 'First trivalent dose', sortOrder: 2 },
          { eventTypeId: vacTrivalente.id, dayOffset: 45, product: 'Purevax RCPCh', notes: 'Second trivalent dose', sortOrder: 3 },
          { eventTypeId: revision.id, dayOffset: 60, notes: 'Post-protocol general checkup', sortOrder: 4 },
        ],
      },
    },
  });

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
