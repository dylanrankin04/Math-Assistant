
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

export interface ChatSession {
  id: string;
  userId?: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}
