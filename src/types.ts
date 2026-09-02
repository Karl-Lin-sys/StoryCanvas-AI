export interface Message {
  role: "user" | "model";
  parts: { text: string }[];
}

export interface Scene {
  sceneNumber: number;
  description: string;
  caption: string;
  imageUrl?: string;
  isGeneratingImage?: boolean;
  imageError?: string;
}
