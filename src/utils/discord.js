import { supabase } from '../supabase.js';

async function invokeNotify(project, type) {
    try {
        const { data, error } = await supabase.functions.invoke('discord-notify', {
            body: { project, type }
        });
        if (error) throw error;
        return data;
    } catch (err) {
        console.warn(`Discord notification (${type}) failed:`, err.message);
        return null;
    }
}

export const sendDiscordNotification = (project, isUpdate = false) =>
    invokeNotify(project, isUpdate ? 'update' : 'submit');

export const sendAdminApproveNotification = (project) =>
    invokeNotify(project, 'approve');

export const sendAdminDeclineNotification = (project) =>
    invokeNotify(project, 'decline');
