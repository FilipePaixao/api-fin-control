import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
});

const TestUserModel = mongoose.model('TestUser', userSchema);

afterEach(async () => {
  await TestUserModel.deleteMany({});
});

describe('When we try to create & save a user', () => {
  it('should return the saved user successfully', async () => {
    const userData = { name: 'Lucas', email: 'lucas@whitebeard.com' };
    const validUser = new TestUserModel(userData);
    await validUser.save();

    const savedUser = await TestUserModel.findOne({ email: userData.email });

    expect(savedUser).toBeDefined();
    expect(savedUser!.name).toBe(userData.name);
    expect(savedUser!.email).toBe(userData.email);
  });
});
