import type { Role } from '../constants/roles';

export interface UserProfile {
  id: string;
  email: string;
  emailVerified: boolean;
  phone: string | null;
  phoneVerified: boolean;
  firstName: string;
  lastName: string;
  role: Role;
  avatarUrl: string | null;
  timezone: string;
  notifyOnScan: boolean;
  notifyViaSms: boolean;
  notifyViaEmail: boolean;
  notifyViaPush: boolean;
  isSubscribed: boolean;
  createdAt: string;
}
