import { BaseRepository } from './base.repository.js';
import { User } from '../models/User.js';

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  findActiveByEmailWithPassword(email) {
    return User.findOne({ email: email.toLowerCase().trim(), isActive: true }).select('+passwordHash');
  }
}

export const userRepository = new UserRepository();
