export interface Message {
  role: 'user' | 'model';
  text: string;
  image?: string; // Base64 encoded image
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji
}