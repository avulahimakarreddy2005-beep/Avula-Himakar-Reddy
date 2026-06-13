export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

export interface Issue {
  id: string;
  type: 'pothole' | 'drainage' | 'waste' | 'hazard';
  severity: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'resolved';
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  reporterId: string;
  createdAt: number;
  updatedAt: number;
  imageUrl?: string;
  description: string;
  tags: string[];
  comments: Comment[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'update' | 'message' | 'alert';
  timestamp: number;
  read: boolean;
  relatedId?: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  coins: number;
  badges: string[];
  preferences: {
    notifications: {
      updates: boolean;
      messages: boolean;
      alerts: boolean;
    };
  };
}
