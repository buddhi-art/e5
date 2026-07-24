'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquare, Send } from 'lucide-react'
import { getProjectComments, addProjectComment, getProjectTeamMembers, type ProjectComment } from '@/app/actions/project-comments'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function ProjectDiscussion({
  projectId,
  currentUserId
}: {
  projectId: string
  currentUserId: string
}) {
  const [comments, setComments] = useState<ProjectComment[]>([])
  const [teamMembers, setTeamMembers] = useState<{ id: string; full_name: string; role: string }[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showMentions, setShowMentions] = useState(false)
  const [mentionFilter, setMentionFilter] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const [data, members] = await Promise.all([
        getProjectComments(projectId),
        getProjectTeamMembers()
      ])
      setComments(data)
      setTeamMembers(members)
      setLoading(false)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
    load()
    const interval = setInterval(load, 30_000)
    return () => clearInterval(interval)
  }, [projectId])

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    setNewComment(val)

    const lastChar = val.slice(-1)
    const atIndex = val.lastIndexOf('@')

    if (atIndex !== -1 && (atIndex === 0 || val[atIndex - 1] === ' ')) {
      const query = val.substring(atIndex + 1)
      if (!query.includes(' ')) {
        setShowMentions(true)
        setMentionFilter(query)
        return
      }
    }
    setShowMentions(false)
  }

  function insertMention(name: string) {
    const atIndex = newComment.lastIndexOf('@')
    if (atIndex !== -1) {
      const updated = newComment.substring(0, atIndex) + `@${name} `
      setNewComment(updated)
    }
    setShowMentions(false)
  }

  async function handleSend() {
    if (!newComment.trim()) return
    setSubmitting(true)
    setShowMentions(false)
    const res = await addProjectComment(projectId, newComment)
    if (res.error) {
      toast.error(res.error)
      setSubmitting(false)
    } else {
      setNewComment('')
      setComments(prev => [...prev, {
        id: 'temp-' + Date.now(),
        project_id: projectId,
        user_id: currentUserId,
        comment_text: newComment,
        created_at: new Date().toISOString(),
        profiles: { full_name: 'You', role: '', designation: '' }
      }])
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      setSubmitting(false)
    }
  }

  const filteredMembers = teamMembers.filter(m => 
    m.full_name.toLowerCase().includes(mentionFilter.toLowerCase())
  )

  return (
    <Card className="bg-surface-container-lowest border-outline-variant/50 elevation-1 flex flex-col h-[500px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-outline-variant/30">
        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-on-surface">
          <MessageSquare className="w-5 h-5 text-primary" />
          Project Discussion
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-premium">
        {loading ? (
          <div className="flex justify-center items-center h-full text-outline">Loading...</div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-outline">
            <MessageSquare className="w-10 h-10 mb-2 opacity-50" />
            <p>No comments yet.</p>
            <p className="text-xs">Start the discussion!</p>
          </div>
        ) : (
          comments.map(c => {
            const isMe = c.user_id === currentUserId || c.profiles?.full_name === 'You'
            const initials = (c.profiles?.full_name || 'U').substring(0, 2).toUpperCase()
            
            return (
              <div key={c.id} className={cn("flex gap-3", isMe ? "flex-row-reverse" : "flex-row")}>
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs border border-primary/20">
                  {initials}
                </div>
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2",
                  isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-surface-container-high text-on-surface rounded-tl-none"
                )}>
                  {!isMe && (
                    <p className="text-[10px] font-semibold opacity-70 mb-1">{c.profiles?.full_name}</p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{c.comment_text}</p>
                  <p className={cn("text-[10px] mt-1 text-right", isMe ? "text-primary-foreground/70" : "text-outline")}>
                    {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </CardContent>
      
      <div className="p-4 bg-surface-container/30 border-t border-outline-variant/30 rounded-b-xl relative">
        {showMentions && filteredMembers.length > 0 && (
          <div className="absolute bottom-full mb-2 left-4 right-4 bg-surface-container-high border border-outline-variant rounded-xl shadow-lg p-2 max-h-40 overflow-y-auto z-50 space-y-1">
            <span className="text-[10px] uppercase font-bold text-outline px-2">Mention Team Member</span>
            {filteredMembers.map(m => (
              <button
                key={m.id}
                type="button"
                className="w-full text-left px-3 py-1.5 text-xs font-semibold rounded-lg hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-between"
                onClick={() => insertMention(m.full_name)}
              >
                <span>@{m.full_name}</span>
                <span className="text-[10px] text-outline capitalize">{m.role}</span>
              </button>
            ))}
          </div>
        )}
        <div className="relative flex items-center">
          <Textarea 
            value={newComment}
            onChange={handleInputChange}
            placeholder="Type a message (use @ to mention)..."
            className="min-h-[44px] h-[44px] max-h-[120px] resize-none pr-12 bg-surface-container py-3"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <Button 
            size="icon" 
            variant="ghost" 
            className="absolute right-1 text-primary hover:bg-primary/10"
            disabled={!newComment.trim() || submitting}
            onClick={handleSend}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
