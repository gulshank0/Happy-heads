interface User {
  id: string | number;
  name: string;
  email: string;
  gender?: string;

  age?: number;
  phone?: string;
  bio?: string;
  googleId?: string;
}

interface FormattedUserData {
  id: string | number;
  name: string;
  email: string;
  gender?: string;
  age?: number;
  phone?: string;
  bio?: string;
  googleId?: string;
}

export const formatUserData = (user: User): FormattedUserData => {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      gender: user.gender,
      age: user.age,
      phone: user.phone,
      bio: user.bio,
      googleId: user.googleId,
    };
  };
  
  export const isValidEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };
  
  export const generateRandomString = (length: number): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };