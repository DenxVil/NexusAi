import { createContext } from 'react';
import type { ChatContextType } from '../types';

export const ChatContext = createContext<ChatContextType | undefined>(undefined);
