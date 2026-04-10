const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
  group: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  animal: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  healthEvent: {
    groupBy: jest.fn(),
  },
  weightRecord: {
    findMany: jest.fn(),
  },
  $disconnect: jest.fn(),
};

module.exports = mockPrisma;
