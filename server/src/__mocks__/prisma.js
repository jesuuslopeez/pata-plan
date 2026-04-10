const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
  $disconnect: jest.fn(),
};

module.exports = mockPrisma;
