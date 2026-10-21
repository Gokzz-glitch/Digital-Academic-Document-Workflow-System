import React, { createContext, useState, useContext, useEffect } from 'react';
import { getNotifications as apiGetNotifications, getUnreadCount as apiGetUnreadCount, markAsRead as apiMarkAsRead, markAllAsRead as apiMarkAllAsRead } from '../api/notification.api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated } = useAuth();

  const fetchNotifications = async () => {
    try {
      const res = await apiGetNotifications({ limit: 10 });
      setNotifications(res.data.data);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await apiGetUnreadCount();
      setUnreadCount(res.data.count);
    } catch (error) {
      console.error('Failed to fetch unread count', error);
    }
  };

  const markRead = async (id) => {
    try {
      await apiMarkAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const markAllRead = async () => {
    try {
      await apiMarkAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      fetchUnreadCount();
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifications, fetchUnreadCount, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
