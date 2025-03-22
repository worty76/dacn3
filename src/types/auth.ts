export interface User {
  id: string;
  email: string;
  role: "admin" | "user";
  name: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}
