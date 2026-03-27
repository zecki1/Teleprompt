import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  writeBatch 
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Project {
  id: string;
  name: string;
  code: string;
  workspaceId: string;
  zeckiProjectId?: string;
  zeckiTaskId?: string;
  status: "active" | "completed" | "archived";
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

export const getProjects = async (workspaceId?: string): Promise<Project[]> => {
  const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
  
  const snapshot = await getDocs(q);
  
  let projects = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      code: data.code,
      workspaceId: data.workspaceId,
      zeckiProjectId: data.zeckiProjectId,
      zeckiTaskId: data.zeckiTaskId,
      status: data.status || "active",
      createdBy: data.createdBy,
      createdByName: data.createdByName,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Project;
  });

  if (workspaceId) {
    projects = projects.filter(p => p.workspaceId === workspaceId);
  }

  return projects;
};

export const getProjectById = async (id: string): Promise<Project | null> => {
  const docRef = doc(db, "projects", id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data();
  return {
    id: id,
    name: data.name,
    code: data.code,
    workspaceId: data.workspaceId,
    zeckiProjectId: data.zeckiProjectId,
    zeckiTaskId: data.zeckiTaskId,
    status: data.status || "active",
    createdBy: data.createdBy,
    createdByName: data.createdByName,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as Project;
};

export const createProject = async (
  projectData: Omit<Project, "id" | "createdAt" | "updatedAt">
): Promise<Project> => {
  const docRef = await addDoc(collection(db, "projects"), {
    ...projectData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    ...projectData,
    id: docRef.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

export const updateProject = async (
  id: string, 
  projectData: Partial<Omit<Project, "id" | "createdAt" | "updatedAt">>
): Promise<void> => {
  const docRef = doc(db, "projects", id);
  await updateDoc(docRef, {
    ...projectData,
    updatedAt: serverTimestamp(),
  });
};

export const deleteProject = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, "projects", id));
};

export const linkProjectToZecki = async (
  projectId: string,
  zeckiProjectId: string,
  zeckiTaskId: string
): Promise<void> => {
  const docRef = doc(db, "projects", projectId);
  await updateDoc(docRef, {
    zeckiProjectId,
    zeckiTaskId,
    updatedAt: serverTimestamp(),
  });
};
