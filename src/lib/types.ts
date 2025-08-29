export interface Resident {
  id: string;
  name: string;
  flat_number: string;
  notes?: string;
  contact: {
    whatsapp?: string;
    sms?: string;
    email?: string;
  };
}

export interface DashboardData {
  current_duty: { name: string };
  next_in_rotation: { name: string };
  system_status: { last_reminder_run: string, reminders_paused: boolean };
}

export interface User {
  id: string;
  email: string;
  role: 'superuser' | 'editor' | 'viewer';
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Issue {
    id: string;
    reported_by: string;
    flat_number: string;
    description: string;
    status: 'Reported' | 'In Progress' | 'Resolved';
    timestamp: string;
}

export interface ReportIssueData {
    name: string;
    flat_number: string;
    description: string;
}

export type AdminUser = Omit<User, 'id'> & { id: string };

export interface SystemSettings {
    owner_name?: string;
    owner_contact_number?: string;
    owner_contact_email?: string;
    owner_contact_whatsapp?: string;
    report_issue_link?: string;
    reminder_template?: string;
    announcement_template?: string;
    reminders_paused?: boolean;
}

export interface CommunicationDetail {
    recipient: string;
    method: 'WhatsApp' | 'SMS' | 'Email';
    status: 'Sent' | 'Failed';
    content?: string;
}

export interface CommunicationEvent {
    id: string;
    type: string;
    subject: string;
    timestamp: string;
    status: 'Completed' | 'Partial' | 'Failed';
    details: CommunicationDetail[];
}
