"use client";

import { collection, query, where, getDocs, orderBy, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ScriptDoc } from "@/types/script";

export interface ProjectLink {
  label: string;
  url: string;
}

export interface Project {
  id: string;
  name: string;
  code?: string;
  externalLink?: string;
  links?: ProjectLink[];
  workspaceId?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function fetchProjects(workspaceId: string, isSuperAdmin?: boolean): Promise<Project[]> {
  try {
    const projectsRef = collection(db, "projects");
    const constraints = isSuperAdmin ? [orderBy("name")] : [where("workspaceId", "==", workspaceId), orderBy("name")];
    const q = query(projectsRef, ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Project[];
  } catch (error) {
    console.error("Erro ao buscar projetos:", error);
    return [];
  }
}

export async function createProject(data: Partial<Project>): Promise<Project> {
  const docRef = await addDoc(collection(db, "projects"), {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return { id: docRef.id, ...data } as Project;
}

export async function updateProject(projectId: string, data: Partial<Project>): Promise<void> {
  await updateDoc(doc(db, "projects", projectId), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteProject(projectId: string): Promise<void> {
  await deleteDoc(doc(db, "projects", projectId));
}

export async function getScriptsByWorkspace(workspaceId: string, isSuperAdmin?: boolean): Promise<ScriptDoc[]> {
  try {
    const scriptsRef = collection(db, "scripts");
    const constraints = isSuperAdmin ? [] : [where("workspaceId", "==", workspaceId)];
    const q = query(scriptsRef, ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ScriptDoc[];
  } catch (error) {
    console.error("Erro ao buscar scripts:", error);
    return [];
  }
}