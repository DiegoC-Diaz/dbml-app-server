export interface UserDTO {
  createdAt: string;
  email: string;
  emailVerified: boolean;
  githubId: string | null;
  id: string;
  isActive: boolean;
  passwordHash: string | null;
  updatedAt: string | null;
  username: string;
};
