'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { MessageCircle, Send, Shield } from 'lucide-react'
import { addSubtaskComment } from '@/app/actions/subtask-comments'

type Comment = {
    id: string
    subtask_id: string
    author_id: string
    content: string
    created_at: string
    profiles: { full_name: string; role: string } | null
}

export function SubtaskCommentSection({ subtaskId, initialComments }: { subtaskId: string; initialComments: Comment[] }) {
    const [comments, setComments] = useState<Comment[]>(initialComments)
    const [newComment, setNewComment] = useState('')
    const [loading, setLoading] = useState(false)
    const [expanded, setExpanded] = useState(false)

    async function handleSubmit() {
        if (!newComment.trim()) return

        setLoading(true)
        const result = await addSubtaskComment(subtaskId, newComment.trim())
        setLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else if (result.comment) {
            setComments(prev => [...prev, result.comment])
            setNewComment('')
        }
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    return (
        <div className="mt-2">
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            >
                <MessageCircle className="w-3.5 h-3.5" />
                {comments.length > 0 ? `${comments.length} comment${comments.length !== 1 ? 's' : ''}` : 'Add comment'}
            </button>

            {expanded && (
                <div className="mt-2 space-y-2 pl-3 border-l-2 border-zinc-200 dark:border-zinc-700">
                    {/* Existing comments */}
                    {comments.length > 0 && (
                        <div className="space-y-2 mb-3">
                            {comments.map((comment) => (
                                <div key={comment.id} className="bg-zinc-50 dark:bg-zinc-900/50 rounded-md p-2.5">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <div className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-[10px]">
                                            {(comment.profiles?.full_name || '?').charAt(0)}
                                        </div>
                                        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                            {comment.profiles?.full_name || 'Unknown'}
                                        </span>
                                        {comment.profiles?.role === 'admin' && (
                                            <Shield className="w-3 h-3 text-orange-500" />
                                        )}
                                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 ml-auto">
                                            {new Date(comment.created_at).toLocaleString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">{comment.content}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Comment input */}
                    <div className="flex gap-2 items-start">
                        <Textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Write a comment... (Enter to send, Shift+Enter for new line)"
                            className="min-h-[36px] h-9 text-sm bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white resize-none py-1.5"
                            rows={1}
                        />
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleSubmit}
                            disabled={loading || !newComment.trim()}
                            className="h-9 shrink-0 bg-sky-600 hover:bg-sky-500 text-white"
                        >
                            <Send className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
