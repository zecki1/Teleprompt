"use client";

import React, { useState, useEffect, useCallback } from "react";
import { listComments, addComment, resolveComment } from "@/api/comments";
import { listUsers } from "@/api/users";
import { toComment } from "@/lib/script-mappers";
import { toDate } from "@/lib/data-utils";
import { usePolling } from "@/lib/polling";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Clock, X, Check } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export interface Comment {
  id: string;
  text: string;
  userId: string;
  userName: string;
  marker?: number;
  createdAt: string | null;
  isResolved?: boolean;
}

export function CommentsPanel({ scriptId, onClose, hasFooter }: { scriptId: string; onClose: () => void; hasFooter?: boolean }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    listUsers()
      .then((dtos) => {
        if (!active) return;
        const map: Record<string, string> = {};
        dtos.forEach((u) => {
          if (u.displayName) map[u.id] = u.displayName;
        });
        setUserMap(map);
      })
      .catch(() => {
        // Name resolution is best-effort; fall back to authorId.
      });
    return () => {
      active = false;
    };
  }, []);

  const loadComments = useCallback(async () => {
    try {
      const dtos = await listComments(scriptId);
      const list: Comment[] = dtos.map((dto) => {
        const c = toComment(dto);
        return {
          id: c.id,
          text: c.body,
          userId: c.authorId,
          userName: userMap[c.authorId] || c.authorId,
          createdAt: c.createdAt,
          isResolved: c.isResolved,
        };
      });
      list.sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime());
      setComments(list);
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  }, [scriptId, userMap]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  usePolling(loadComments, 5000, [loadComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setIsSending(true);
    try {
      const dto = await addComment(scriptId, newComment);
      const c = toComment(dto);
      const fresh: Comment = {
        id: c.id,
        text: c.body,
        userId: c.authorId,
        userName: user.displayName || user.email || c.authorId,
        createdAt: c.createdAt,
        isResolved: c.isResolved,
      };
      setComments((prev) => [fresh, ...prev.filter((x) => x.id !== fresh.id)]);
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleResolve = async (comment: Comment) => {
    if (!comment || comment.isResolved) return;
    setResolvingId(comment.id);
    try {
      await resolveComment(scriptId, comment.id);
      setComments((prev) =>
        prev.map((c) => (c.id === comment.id ? { ...c, isResolved: true } : c))
      );
    } catch (error) {
      console.error("Error resolving comment:", error);
    } finally {
      setResolvingId(null);
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className={`flex flex-col h-full bg-zinc-950 border-l border-zinc-800 w-[350px] animate-in slide-in-from-right duration-300 ${hasFooter ? 'pb-16' : ''}`}>
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-500" />
          <h2 className="font-black uppercase tracking-widest text-sm text-white">Comentários</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-500 hover:text-white">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600 space-y-2">
            <MessageSquare className="w-8 h-8 opacity-20" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Nenhum comentário ainda</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6 border border-zinc-800">
                  <AvatarFallback className="text-[10px] bg-zinc-900 text-zinc-400">
                    {getInitials(comment.userName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white uppercase tracking-tighter leading-none">
                    {comment.userName}
                  </span>
                  <span className="text-[8px] text-zinc-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    {comment.createdAt ? format(toDate(comment.createdAt), "HH:mm '•' dd/MM", { locale: ptBR }) : "Enviando..."}
                  </span>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  {comment.isResolved && (
                    <Badge className="bg-green-700 hover:bg-green-700 text-white border-none text-[9px] h-4">
                      Resolvido
                    </Badge>
                  )}
                  {user?.uid === comment.userId && !comment.isResolved && (
                    <button
                      onClick={() => handleResolve(comment)}
                      disabled={resolvingId === comment.id}
                      className="text-zinc-600 hover:text-green-400 transition-colors p-1 disabled:opacity-50"
                      title="Resolver comentário"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              <div className={`bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50 ${comment.isResolved ? "opacity-50" : ""}`}>
                <p className="text-xs text-zinc-300 leading-relaxed">{comment.text}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Deixe um comentário..."
            className="min-h-[80px] bg-zinc-900 border-zinc-800 text-xs resize-none focus-visible:ring-blue-500 text-white"
          />
          <Button 
            type="submit" 
            disabled={isSending || !newComment.trim()}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[10px] h-10 shadow-lg shadow-blue-900/20"
          >
            {isSending ? "Enviando..." : (
              <span className="flex items-center gap-2">
                <Send className="w-3.5 h-3.5" /> Enviar Comentário
              </span>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
