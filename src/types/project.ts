export interface Project {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  email: string;
  name: string;
  managerEmail?: string;
  managerName?: string;
}

export interface UserSettingsResponse extends UserSettings {
  isManager: boolean;
  subordinates: { email: string; name: string }[];
}
