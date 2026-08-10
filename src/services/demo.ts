"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  type Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  type Firestore,
  collection,
  doc,
  query,
  where,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import { firebaseConfig, db as mainDb } from "@/lib/firebase";
import { parseScript } from "@/lib/parser";
import { debugInfo, debugError } from "@/lib/debug-log";

// Credenciais fixas da conta demo compartilhável.
// São apenas constantes no código (não ficam no Firestore).
export const DEMO_EMAIL = "demo@teleprompt.app";
export const DEMO_PASSWORD = "Demo2026!";
export const DEMO_USER_NAME = "Equipe de Demonstração";
export const DEMO_WORKSPACE_NAME = "Workspace de Demonstração";
export const DEMO_PROJECT_NAME = "Tutorial de Demonstração";
export const DEMO_SCRIPT_TITLE = "Roteiro de Exemplo";

// Roteiro de exemplo com os marcadores suportados pelo parser:
// Cena, [Loc] (locução), [Let] (lettering), [Pron] (pronúncia), [Img] (imagem),
// [Url] (fonte), [Abe]/[Enc] (abertura/encerramento) e Tempo.
export const DEMO_RAW_CONTENT = `Cena 1
Tempo: 45 segundos
[abe]: Abertura do programa
[Loc]: Olá! Este é o roteiro de demonstração do Teleprompt. Edite o texto livremente e veja como as cenas são organizadas.
[Let1]: Bem-vindo
[Pron1]: Bem-vin-du
[Img1]: https://picsum.photos/seed/teleprompt/640/360
[Url1]: https://www.youtube.com/results?search_query=teleprompter

[Loc]: No teleprompter, pressione Reproduzir para testar a rolagem automática do texto.
[Let2]: Velocidade ajustável
[Pron2]: ve-lo-ci-da-de

[Loc]: Quando terminar, marque como gravado e confira o histórico de versões no editor.
[enc]: Encerramento`;

export interface DemoSetupResult {
  email: string;
  password: string;
  workspaceId: string;
  projectId: string;
  scriptId: string;
  created: boolean;
}

// Segundo app do Firebase usado apenas para criar a conta demo.
// Ele tem sessão própria, então o admin continua logado no app principal.
function getDemoApp(): FirebaseApp {
  const existing = getApps().find((a) => a.name === "demo");
  if (existing) return existing;
  return initializeApp(firebaseConfig, "demo");
}

async function ensureDemoAuth(): Promise<{ auth: Auth; db: Firestore; uid: string; createdUser: boolean }> {
  const demoApp = getDemoApp();
  const auth = getAuth(demoApp);
  const db = getFirestore(demoApp);

  try {
    const { user } = await createUserWithEmailAndPassword(auth, DEMO_EMAIL, DEMO_PASSWORD);
    debugInfo("demo.setup", "Conta demo de autenticação criada", { uid: user.uid });
    return { auth, db, uid: user.uid, createdUser: true };
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "auth/email-already-in-use") {
      // Já existe: entra para pegar o uid e reutilizar (recupera setups interrompidos).
      const { user } = await signInWithEmailAndPassword(auth, DEMO_EMAIL, DEMO_PASSWORD);
      debugInfo("demo.setup", "Conta demo de autenticação reutilizada", { uid: user.uid });
      return { auth, db, uid: user.uid, createdUser: false };
    }
    throw error;
  }
}

export async function setupDemo(): Promise<DemoSetupResult> {
  const startedAt = Date.now();
  let created = false;

  const { auth, db: demoDb, uid, createdUser } = await ensureDemoAuth();
  if (createdUser) created = true;

  const now = new Date().toISOString();

  try {
    // 1) Workspace demo (único)
    let workspaceId = "";
    const wsQuery = query(collection(demoDb, "workspaces"), where("isDemo", "==", true));
    const wsSnap = await getDocs(wsQuery);
    if (!wsSnap.empty) {
      workspaceId = wsSnap.docs[0].id;
    } else {
      workspaceId = crypto.randomUUID();
      await setDoc(doc(demoDb, "workspaces", workspaceId), {
        name: DEMO_WORKSPACE_NAME,
        ownerId: uid,
        ownerEmail: DEMO_EMAIL,
        members: [uid],
        createdAt: now,
        updatedAt: now,
        plan: "free",
        isDemo: true,
        roleLabels: { Diretor: "Diretor", Docente: "Docente" },
      });
      created = true;
      debugInfo("demo.setup", "Workspace de demonstração criado", { workspaceId });
    }

    // 2) Usuário demo (criado pelo próprio, pois as regras exigem uid == auth.uid)
    const userRef = doc(demoDb, "users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      await updateDoc(userRef, {
        workspaceId,
        workspaces: arrayUnion(workspaceId),
        updatedAt: now,
      });
    } else {
      await setDoc(userRef, {
        uid,
        email: DEMO_EMAIL,
        displayName: DEMO_USER_NAME,
        name: DEMO_USER_NAME,
        role: "Diretor",
        status: "active",
        isSuperAdmin: false,
        canCollaborate: true,
        isEditor: true,
        isRevisor: true,
        canRevert: true,
        canAssign: true,
        canViewAdmin: true,
        canViewReports: true,
        canViewActivityHistory: true,
        requiresChecklist: false,
        avatarUrl: "",
        workspaceId,
        workspaces: [workspaceId],
        createdAt: now,
        updatedAt: now,
      });
      created = true;
      debugInfo("demo.setup", "Usuário demo criado", { uid, workspaceId });
    }

    // 3) Projeto de exemplo
    // Filtra por workspaceId no Firestore e por nome em JS para não depender de
    // índice composto (workspaceId + name) no projeto.
    let projectId = "";
    const projQuery = query(collection(demoDb, "projects"), where("workspaceId", "==", workspaceId));
    const projSnap = await getDocs(projQuery);
    const existingProject = projSnap.docs.find(d => (d.data().name as string) === DEMO_PROJECT_NAME);
    if (existingProject) {
      projectId = existingProject.id;
    } else {
      const projRef = await addDoc(collection(demoDb, "projects"), {
        name: DEMO_PROJECT_NAME,
        code: "DEMO",
        workspaceId,
        status: "in-progress",
        createdAt: now,
        updatedAt: now,
      });
      projectId = projRef.id;
      created = true;
      debugInfo("demo.setup", "Projeto de demonstração criado", { projectId });
    }

    // 4) Roteiro de exemplo + primeira versão
    let scriptId = "";
    const scriptQuery = query(collection(demoDb, "scripts"), where("projectId", "==", projectId));
    const scriptSnap = await getDocs(scriptQuery);
    if (!scriptSnap.empty) {
      scriptId = scriptSnap.docs[0].id;
    } else {
      const scriptRef = await addDoc(collection(demoDb, "scripts"), {
        title: DEMO_SCRIPT_TITLE,
        project: DEMO_PROJECT_NAME,
        projectName: DEMO_PROJECT_NAME,
        projectId,
        folder: "Raiz",
        subfolder: "",
        category: "video",
        path: ["Raiz"],
        status: "rascunho",
        workspaceId,
        createdBy: uid,
        createdByName: DEMO_USER_NAME,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isPlaceholder: false,
        isPublic: true,
        lockedForEditing: false,
        isMirrored: false,
      });
      scriptId = scriptRef.id;

      const scenes = parseScript(DEMO_RAW_CONTENT);
      await addDoc(collection(demoDb, "scripts", scriptId, "versions"), {
        content: DEMO_RAW_CONTENT,
        scenes,
        createdBy: uid,
        createdByName: DEMO_USER_NAME,
        createdAt: serverTimestamp(),
      });
      created = true;
      debugInfo("demo.setup", "Roteiro de demonstração criado", { scriptId, sceneCount: scenes.length });
    }

    return { email: DEMO_EMAIL, password: DEMO_PASSWORD, workspaceId, projectId, scriptId, created };
  } catch (error) {
    debugError("demo.setup", "Falha ao preparar ambiente de demonstração", error, { durationMs: Date.now() - startedAt });
    throw error;
  } finally {
    // Encerra a sessão do app demo (não afeta a sessão do admin).
    try {
      await signOut(auth);
    } catch {
      // ignora
    }
    debugInfo("demo.setup", "Setup de demonstração concluído", { durationMs: Date.now() - startedAt, created });
  }
}

/**
 * Estado atual do ambiente de demonstração (para o painel do admin).
 */
export async function getDemoStatus(): Promise<{ ready: boolean; workspaceId?: string; email: string; password: string }> {
  const wsQuery = query(collection(mainDb, "workspaces"), where("isDemo", "==", true));
  const wsSnap = await getDocs(wsQuery);
  if (wsSnap.empty) return { ready: false, email: DEMO_EMAIL, password: DEMO_PASSWORD };
  const workspaceId = wsSnap.docs[0].id;

  const userQuery = query(collection(mainDb, "users"), where("email", "==", DEMO_EMAIL));
  const userSnap = await getDocs(userQuery);
  return { ready: !userSnap.empty, workspaceId, email: DEMO_EMAIL, password: DEMO_PASSWORD };
}
