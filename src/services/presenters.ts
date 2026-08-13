"use client";

import {
  listPresenters,
  createPresenter,
  updatePresenter as apiUpdatePresenter,
  deletePresenter as apiDeletePresenter,
} from "@/api/presenters";
import { toPresenter } from "@/lib/script-mappers";
import type { PresenterDto } from "@/api/types";

export interface Presenter {
  id: string;
  name: string;
  workspaceId: string;
  createdBy: string;
  createdAt?: string;
}

export const addPresenter = async (name: string, _workspaceId: string, _userId: string): Promise<string> => {
  const dto = await createPresenter({ name });
  return dto.id;
};

export const getPresenters = async (workspaceId: string): Promise<Presenter[]> => {
  try {
    const dtos = await listPresenters();
    return dtos.map((dto: PresenterDto) => ({ ...toPresenter(dto), workspaceId }));
  } catch (error) {
    console.error("Erro ao buscar apresentadores:", error);
    return [];
  }
};

export const deletePresenter = async (presenterId: string): Promise<void> => {
  await apiDeletePresenter(presenterId);
};

export const updatePresenter = async (presenterId: string, data: Partial<Presenter>): Promise<void> => {
  await apiUpdatePresenter(presenterId, { name: data.name || "" });
};
