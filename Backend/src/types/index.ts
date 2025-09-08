export interface User {
    id: string;
    name: string;
    email: string;
    avatar: string;
    age?: number;
    phone?: string;
    bio?: string;
  }
  
  export interface AuthRequest extends Request {
    user?: User;
  }
  
  export interface UserResponse {
    message: string;
    user: User;
  }
  
  export interface ErrorResponse {
    error: string;
  }