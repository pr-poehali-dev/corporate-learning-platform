export interface User {
  userId: number;
  phone: string;
  fullName: string;
  role: 'student' | 'admin';
}

export const authService = {
  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  setUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  },

  logout(): void {
    localStorage.removeItem('user');
  },

  isAdmin(): boolean {
    const user = this.getUser();
    return user?.role === 'admin';
  }
};
