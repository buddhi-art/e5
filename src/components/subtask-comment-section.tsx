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
                className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-foreground transition-colors"
            >
                <MessageCircle className="w-3.5 h-3.5" />
                {comments.length > 0 ? `${comments.length} comment${comments.length !== 1 ? 's' : ''}` : 'Add comment'}
            </button>

            {expanded && (
                <div className="mt-2 space-y-2 pl-3 border-l-2 border-outline-variant">
                    {/* Existing comments */}
                    {comments.length > 0 && (
                        <div className="space-y-2 mb-3">
                            {comments.map((comment) => (
                                <div key={comment.id} className="bg-surface-container-high rounded-md p-2.5">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <div className="w-5 h-5 rounded-full bg-primary-container text-primary flex items-center justify-center font-bold text-[10px]">
                                            {(comment.profiles?.full_name || '?').charAt(0)}
                                        </div>
                                        <span className="text-xs font-medium text-foreground">
                                            {comment.profiles?.full_name || 'Unknown'}
                                        </span>
                                        {comment.profiles?.role === 'admin' && (
                                            <Shield className="w-3 h-3 text-tertiary" />
                                        )}
                                        <span className="text-[10px] text-outline ml-auto">
                                            {new Date(comment.created_at).toLocaleString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-on-surface-variant whitespace-pre-wrap">{comment.content}</p>
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
                            className="min-h-[36px] h-9 text-sm bg-surface-container-high border-outline-variant text-foreground resize-none py-1.5"
                            rows={1}
                        />
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleSubmit}
                            disabled={loading || !newComment.trim()}
                            className="h-9 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            <Send className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
