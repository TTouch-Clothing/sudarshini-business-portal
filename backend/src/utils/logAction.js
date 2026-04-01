import UserLog from '../models/UserLog.js';

export async function logAction({ userName, action, ipAddress }) {
  try {
    await UserLog.create({ userName, action, ipAddress });
  } catch (err) {
    console.error('Log create failed', err.message);
  }
}
