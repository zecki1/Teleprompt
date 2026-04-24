"use client";

import React, { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, increment, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Clock, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Comment {
  id: string;
  text: string;
  userId: string;
  userName: string;
  createdAt: { toDate: () => Date } | null;
}

export function CommentsPanel({ scriptId, onClose, hasFooter }: { scriptId: string; onClose: () => void; hasFooter?: boolean }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "scripts", scriptId, "comments"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      setComments(docs);
    });

    return () => unsub();
  }, [scriptId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setIsSending(true);
    try {
      // 1. Add comment to subcollection
      await addDoc(collection(db, "scripts", scriptId, "comments"), {
        text: newComment,
        userId: user.uid,
        userName: user.displayName || user.email,
        createdAt: serverTimestamp(),
      });

      // 2. Update script document with metadata for dashboard
      const scriptRef = doc(db, "scripts", scriptId);
      await updateDoc(scriptRef, {
        commentCount: increment(1),
        commentAuthors: arrayUnion(user.displayName || user.email)
      });

      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSending(false);
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
                    {comment.createdAt?.toDate ? format(comment.createdAt.toDate(), "HH:mm '•' dd/MM", { locale: ptBR }) : "Enviando..."}
                  </span>
                </div>
              </div>
              <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
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
