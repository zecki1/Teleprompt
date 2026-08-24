"use client";

import { useFirebase } from "./client";
import type { AuthResponse, UserDto } from "./types";

export interface RegisterRequest {
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

async function firebaseLogin(input: LoginRequest): Promise<AuthResponse> {
  const { getFirebaseAuth, getFirebaseDb } = await import("@/lib/firebase");
  const { signInWithEmailAndPassword } = await import("firebase/auth");
  const { doc, getDoc, setDoc, Timestamp } = await import("firebase/firestore");

  const auth = getFirebaseAuth();
  const db = getFirebaseDb();

  const cred = await signInWithEmailAndPassword(auth, input.email, input.password);
  const uid = cred.user.uid;

  const userDoc = await getDoc(doc(db, "users", uid));
  let userDto: UserDto;

  if (userDoc.exists()) {
    const d = userDoc.data();
    userDto = {
      id: uid,
      email: d.email || cred.user.email || input.email,
      displayName: d.displayName || cred.user.displayName || input.email.split("@")[0],
      role: d.role || "Estagiário",
      isSuperAdmin: d.isSuperAdmin || false,
      canManagePermissions: d.canManagePermissions || false,
      canCollaborate: d.canCollaborate || false,
      isEditor: d.isEditor || false,
      isRevisor: d.isRevisor || false,
      canRevert: d.canRevert || false,
      canViewAdmin: d.canViewAdmin || false,
      canViewReports: d.canViewReports || false,
      canViewActivityHistory: d.canViewActivityHistory || false,
      canViewDebugLogs: d.canViewDebugLogs || false,
      canAssign: d.canAssign || false,
      requiresChecklist: d.requiresChecklist ?? true,
      status: d.status || "active",
      workspaceId: d.workspaceId || "",
    };
  } else {
    const displayName = cred.user.displayName || input.email.split("@")[0];
    const newUserData = {
      email: input.email,
      displayName,
      role: "Estagiário",
      isSuperAdmin: false,
      canManagePermissions: false,
      canCollaborate: false,
      isEditor: false,
      isRevisor: false,
      canRevert: false,
      canViewAdmin: false,
      canViewReports: false,
      canViewActivityHistory: false,
      canViewDebugLogs: false,
      canAssign: false,
      requiresChecklist: true,
      status: "active",
      workspaceId: "",
      createdAt: Timestamp.now(),
    };
    await setDoc(doc(db, "users", uid), newUserData);
    userDto = {
      id: uid,
      email: input.email,
      displayName,
      role: "Estagiário",
      isSuperAdmin: false,
      canManagePermissions: false,
      canCollaborate: false,
      isEditor: false,
      isRevisor: false,
      canRevert: false,
      canViewAdmin: false,
      canViewReports: false,
      canViewActivityHistory: false,
      canViewDebugLogs: false,
      canAssign: false,
      requiresChecklist: true,
      status: "active",
      workspaceId: "",
    };
  }

  const token = await cred.user.getIdToken();
  return { token, user: userDto };
}

async function firebaseRegister(input: RegisterRequest): Promise<AuthResponse> {
  const { getFirebaseAuth, getFirebaseDb } = await import("@/lib/firebase");
  const { createUserWithEmailAndPassword, updateProfile } = await import("firebase/auth");
  const { doc, setDoc, Timestamp } = await import("firebase/firestore");

  const auth = getFirebaseAuth();
  const db = getFirebaseDb();

  const cred = await createUserWithEmailAndPassword(auth, input.email, input.password);
  const uid = cred.user.uid;

  if (input.displayName) {
    await updateProfile(cred.user, { displayName: input.displayName });
  }

  const newUserData = {
    email: input.email,
    displayName: input.displayName || input.email.split("@")[0],
    role: "Estagiário",
    isSuperAdmin: false,
    canManagePermissions: false,
    canCollaborate: false,
    isEditor: false,
    isRevisor: false,
    canRevert: false,
    canViewAdmin: false,
    canViewReports: false,
    canViewActivityHistory: false,
    canViewDebugLogs: false,
    canAssign: false,
    requiresChecklist: true,
    status: "active",
    workspaceId: "",
    createdAt: Timestamp.now(),
  };
  await setDoc(doc(db, "users", uid), newUserData);

  const token = await cred.user.getIdToken();
  return {
    token,
    user: {
      id: uid,
      email: input.email,
      displayName: newUserData.displayName,
      role: "Estagiário",
      isSuperAdmin: false,
      canManagePermissions: false,
      canCollaborate: false,
      isEditor: false,
      isRevisor: false,
      canRevert: false,
      canViewAdmin: false,
      canViewReports: false,
      canViewActivityHistory: false,
      canViewDebugLogs: false,
      canAssign: false,
      requiresChecklist: true,
      status: "active",
      workspaceId: "",
    },
  };
}

async function firebaseMe(): Promise<UserDto> {
  const { getFirebaseAuth, getFirebaseDb } = await import("@/lib/firebase");
  const { doc, getDoc } = await import("firebase/firestore");

  const auth = getFirebaseAuth();
  const db = getFirebaseDb();

  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Não autenticado");

  const userDoc = await getDoc(doc(db, "users", currentUser.uid));
  if (!userDoc.exists()) {
    return {
      id: currentUser.uid,
      email: currentUser.email || "",
      displayName: currentUser.displayName || currentUser.email?.split("@")[0] || "",
      role: "Estagiário",
      isSuperAdmin: false,
      canManagePermissions: false,
      canCollaborate: false,
      isEditor: false,
      isRevisor: false,
      canRevert: false,
      canViewAdmin: false,
      canViewReports: false,
      canViewActivityHistory: false,
      canViewDebugLogs: false,
      canAssign: false,
      requiresChecklist: true,
      status: "active",
      workspaceId: "",
    };
  }

  const d = userDoc.data();
  return {
    id: currentUser.uid,
    email: d.email || currentUser.email || "",
    displayName: d.displayName || currentUser.displayName || "",
    role: d.role || "Estagiário",
    isSuperAdmin: d.isSuperAdmin || false,
    canManagePermissions: d.canManagePermissions || false,
    canCollaborate: d.canCollaborate || false,
    isEditor: d.isEditor || false,
    isRevisor: d.isRevisor || false,
    canRevert: d.canRevert || false,
    canViewAdmin: d.canViewAdmin || false,
    canViewReports: d.canViewReports || false,
    canViewActivityHistory: d.canViewActivityHistory || false,
    canViewDebugLogs: d.canViewDebugLogs || false,
    canAssign: d.canAssign || false,
    requiresChecklist: d.requiresChecklist ?? true,
    status: d.status || "active",
    workspaceId: d.workspaceId || "",
  };
}

async function firebaseLogout(): Promise<void> {
  const { getFirebaseAuth } = await import("@/lib/firebase");
  const { signOut } = await import("firebase/auth");
  const auth = getFirebaseAuth();
  await signOut(auth);
}

async function httpLogin(input: LoginRequest): Promise<AuthResponse> {
  const { api } = await import("./client");
  return api.post<AuthResponse>("/api/v1/auth/login", input, { skipAuth: true });
}

async function httpRegister(input: RegisterRequest): Promise<AuthResponse> {
  const { api } = await import("./client");
  return api.post<AuthResponse>("/api/v1/auth/register", input, { skipAuth: true });
}

async function httpMe(): Promise<UserDto> {
  const { api } = await import("./client");
  return api.get<UserDto>("/api/v1/auth/me");
}

async function httpLogout(): Promise<void> {
  const { api } = await import("./client");
  await api.post<unknown>("/api/v1/auth/logout");
}

export function login(input: LoginRequest): Promise<AuthResponse> {
  return useFirebase ? firebaseLogin(input) : httpLogin(input);
}

export function register(input: RegisterRequest): Promise<AuthResponse> {
  return useFirebase ? firebaseRegister(input) : httpRegister(input);
}

export function me(): Promise<UserDto> {
  return useFirebase ? firebaseMe() : httpMe();
}

export function logout(): Promise<void> {
  return useFirebase ? firebaseLogout() : httpLogout();
}
