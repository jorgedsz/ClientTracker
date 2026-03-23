import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Clients
export const getClients = (params) => api.get('/clients', { params });
export const getClient = (id) => api.get(`/clients/${id}`);
export const createClient = (data) => api.post('/clients', data);
export const updateClient = (id, data) => api.put(`/clients/${id}`, data);
export const deleteClient = (id) => api.delete(`/clients/${id}`);

// Meetings
export const getMeetings = (params) => api.get('/meetings', { params });
export const getMeeting = (id) => api.get(`/meetings/${id}`);
export const createMeeting = (data) => api.post('/meetings', data);
export const updateMeeting = (id, data) => api.put(`/meetings/${id}`, data);
export const deleteMeeting = (id) => api.delete(`/meetings/${id}`);
export const generateLesson = (meetingId) => api.post(`/meetings/${meetingId}/generate-lesson`);

// Lessons
export const getLessons = (params) => api.get('/lessons', { params });
export const getLesson = (id) => api.get(`/lessons/${id}`);
export const updateLesson = (id, data) => api.put(`/lessons/${id}`, data);
export const deleteLesson = (id) => api.delete(`/lessons/${id}`);
export const regenerateLesson = (id) => api.post(`/lessons/${id}/regenerate`);

// Gmail
export const getGmailAuthUrl = () => api.get('/gmail/auth-url');
export const getGmailStatus = () => api.get('/gmail/status');
export const disconnectGmail = () => api.post('/gmail/disconnect');
export const pollGmailNow = () => api.post('/gmail/poll-now');
export const getRecentEmails = () => api.get('/gmail/recent-emails');

// Email Filters
export const getEmailFilters = () => api.get('/email-filters');
export const createEmailFilter = (data) => api.post('/email-filters', data);
export const updateEmailFilter = (id, data) => api.put(`/email-filters/${id}`, data);
export const deleteEmailFilter = (id) => api.delete(`/email-filters/${id}`);
export const testEmailFilter = (data) => api.post('/email-filters/test', data);

// WhatsApp
export const getWhatsAppStatus = () => api.get('/whatsapp/status');
export const getWhatsAppQr = () => api.get('/whatsapp/qr');
export const connectWhatsApp = () => api.post('/whatsapp/connect');
export const disconnectWhatsApp = () => api.post('/whatsapp/disconnect');
export const getWhatsAppGroups = () => api.get('/whatsapp/groups');
export const getWhatsAppMessages = (params) => api.get('/whatsapp/messages', { params });
export const flagWhatsAppMessage = (id, data) => api.patch(`/whatsapp/messages/${id}/flag`, data);
export const noteWhatsAppMessage = (id, data) => api.patch(`/whatsapp/messages/${id}/note`, data);

// Settings
export const getSettings = () => api.get('/settings');
export const updateSettings = (data) => api.put('/settings', data);
export const getHealth = () => api.get('/settings/health');

// Dashboard
export const getDashboardOverview = () => api.get('/dashboard/overview');
export const getRecentActivity = () => api.get('/dashboard/recent-activity');

export default api;
