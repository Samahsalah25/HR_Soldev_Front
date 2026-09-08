import api from "./axios";

// GET NOTIFICATIONS
export const getNotifications = async () => {
  const response = await api.get("/notifications");
  return response.data;
};

// GET UNREAD COUNT
export const getUnreadNotificationsCount = async () => {
  const response = await api.get("/notifications/unread_count");
  return response.data;
};

// MARK ONE NOTIFICATION AS READ
export const markNotificationAsRead = async (notificationId) => {
  const response = await api.post(`/notifications/${notificationId}/read`);
  return response.data;
};

// MARK ALL NOTIFICATIONS AS READ
export const markAllNotificationsAsRead = async () => {
  const response = await api.post("/notifications/mark_all_read");
  return response.data;
};