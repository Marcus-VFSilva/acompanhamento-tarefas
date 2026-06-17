import { getUserSettingsCollection } from "@/lib/mongodb";

export async function getSubordinateEmails(managerEmail: string): Promise<string[]> {
  const collection = await getUserSettingsCollection();
  const docs = await collection.find({ managerEmail: managerEmail.toLowerCase() }).toArray();
  return docs.map((d) => d._id.toString());
}

export async function getTaskVisibilityQuery(email: string, isAdmin: boolean) {
  if (isAdmin) return {};

  const normalized = email.toLowerCase();
  const subordinates = await getSubordinateEmails(normalized);

  // Líder de equipe: vê apenas tarefas dos subordinados (não as próprias)
  if (subordinates.length > 0) {
    return { assignedTo: { $in: subordinates } };
  }

  return { assignedTo: normalized };
}

export async function isTeamLeader(email: string): Promise<boolean> {
  const subordinates = await getSubordinateEmails(email.toLowerCase());
  return subordinates.length > 0;
}
