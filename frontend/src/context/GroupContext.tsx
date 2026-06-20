import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { useAuth } from './AuthContext';

export interface GroupSummary {
  totalExpenses: number;
  thisMonthExpenses: number;
  pendingBalancesCount: number;
}

export interface MemberBalance {
  user: {
    _id: string;
    name: string;
    profileImage?: string;
  };
  amount: number;
}

export interface GroupBalances {
  youOwe: number;
  youAreOwed: number;
  owesList: MemberBalance[];
  owedList: MemberBalance[];
  balanceBreakdown: Array<{
    type: 'you_are_owed' | 'you_owe' | 'settled_by_you' | 'settled_to_you';
    amount: number;
    date: string;
    message: string;
  }>;
}

export interface Expense {
  _id: string;
  amount: number;
  category: string;
  notes?: string;
  paidBy: {
    _id: string;
    name: string;
    profileImage?: string;
  };
  splitBetween: Array<{ user: string; amount: number }>;
  date: string;
}

export interface GroupData {
  group: {
    _id: string;
    name: string;
    code: string;
    type: string;
    membersCount: number;
  };
  summary: GroupSummary;
  balances: GroupBalances;
  recentExpenses: Expense[];
}

export interface GroupContextType {
  activeGroupId: string | null;
  loading: boolean;

  createGroup: (name: string, type: string) => Promise<void>;
  joinGroup: (code: string) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  setActiveGroup: (id: string | null) => Promise<void>;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export const GroupProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, refreshUser } = useAuth();
  const [activeGroupId, setActiveGroupIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Load last active group on mount or when user changes
  useEffect(() => {
    if (user) {
      loadActiveGroup();
    } else {
      setActiveGroupIdState(null);
    }
  }, [user]);

  const loadActiveGroup = async () => {
    try {
      const storedId = await AsyncStorage.getItem('activeGroupId');
      if (storedId) {
        // Double check if user is still in this group
        const userGroups = user?.groups || [];
        const isInGroup = userGroups.some(g => g._id === storedId);
        if (isInGroup) {
          setActiveGroupIdState(storedId);
          return;
        }
      }
      
      // Default to first group user belongs to
      if (user?.groups && user.groups.length > 0) {
        const firstId = user.groups[0]._id;
        setActiveGroupIdState(firstId);
        await AsyncStorage.setItem('activeGroupId', firstId);
      } else {
        setActiveGroupIdState(null);
      }
    } catch (err) {
      console.log('Failed to load active group from storage:', err);
    }
  };

  const setActiveGroup = async (id: string | null) => {
    try {
      if (id) {
        await AsyncStorage.setItem('activeGroupId', id);
      } else {
        await AsyncStorage.removeItem('activeGroupId');
      }
      setActiveGroupIdState(id);
    } catch (err) {
      console.log('Failed to save active group:', err);
    }
  };

  const createGroup = async (name: string, type: string) => {
    try {
      setLoading(true);
      const res = await api.post('/groups', { name, type });
      const newGroup = res.data;
      
      await refreshUser(); // refresh user groups list
      await setActiveGroup(newGroup._id);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Create group failed';
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const joinGroup = async (code: string) => {
    try {
      setLoading(true);
      const res = await api.post('/groups/join', { code });
      const joinedGroup = res.data;
      
      await refreshUser(); // refresh user groups list
      await setActiveGroup(joinedGroup._id);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Join group failed';
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const deleteGroup = async (groupId: string) => {
    try {
      setLoading(true);
      await api.delete(`/groups/${groupId}`);
      await refreshUser(); // refresh user groups list
      
      // If the deleted group was active, clear active group
      if (activeGroupId === groupId) {
        await setActiveGroup(null);
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Delete group failed';
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GroupContext.Provider
      value={{
        activeGroupId,
        loading,
        createGroup,
        joinGroup,
        deleteGroup,
        setActiveGroup,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
};

export const useGroup = () => {
  const context = useContext(GroupContext);
  if (context === undefined) {
    throw new Error('useGroup must be used within a GroupProvider');
  }
  return context;
};
