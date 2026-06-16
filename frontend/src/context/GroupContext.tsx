import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { useAuth } from './AuthContext';

interface GroupSummary {
  totalExpenses: number;
  thisMonthExpenses: number;
  pendingBalancesCount: number;
}

interface MemberBalance {
  user: {
    _id: string;
    name: string;
    profileImage?: string;
  };
  amount: number;
}

interface GroupBalances {
  youOwe: number;
  youAreOwed: number;
  owesList: MemberBalance[];
  owedList: MemberBalance[];
}

interface Expense {
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

interface GroupData {
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

interface GroupContextType {
  activeGroupId: string | null;
  activeGroupData: GroupData | null;
  loading: boolean;
  createGroup: (name: string, type: string) => Promise<void>;
  joinGroup: (code: string) => Promise<void>;
  setActiveGroup: (id: string | null) => Promise<void>;
  fetchDashboard: () => Promise<void>;
  refreshActiveGroup: () => Promise<void>;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export const GroupProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, refreshUser } = useAuth();
  const [activeGroupId, setActiveGroupIdState] = useState<string | null>(null);
  const [activeGroupData, setActiveGroupData] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Load last active group on mount or when user changes
  useEffect(() => {
    if (user) {
      loadActiveGroup();
    } else {
      setActiveGroupIdState(null);
      setActiveGroupData(null);
    }
  }, [user]);

  // Refetch dashboard when active group ID changes
  useEffect(() => {
    if (activeGroupId) {
      fetchDashboard();
    } else {
      setActiveGroupData(null);
    }
  }, [activeGroupId]);

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

  const fetchDashboard = async () => {
    if (!activeGroupId) return;
    try {
      setLoading(true);
      const res = await api.get(`/groups/${activeGroupId}/dashboard`);
      setActiveGroupData(res.data);
    } catch (err) {
      console.log('Failed to fetch group dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshActiveGroup = async () => {
    await fetchDashboard();
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

  return (
    <GroupContext.Provider
      value={{
        activeGroupId,
        activeGroupData,
        loading,
        createGroup,
        joinGroup,
        setActiveGroup,
        fetchDashboard,
        refreshActiveGroup,
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
