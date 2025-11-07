import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { useRequest } from '../hooks/useRequest';
import { useBoot } from '../hooks/useBoot';
import { useToast } from '../components/ToastContext';

const DRAFT_TTL = 30 * 60 * 1000;

type CommunityPost = {
  id: number;
  body: string;
  created_at: string;
  author_id: number;
  author?: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  comments?: CommunityComment[];
  optimistic?: boolean;
};

type CommunityComment = {
  id: number;
  post_id: number;
  body: string;
  created_at: string;
  author_id: number;
  author?: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  optimistic?: boolean;
};

function draftKey(scope: string) {
  return `l4p-draft-${scope}`;
}

function loadDraft(scope: string) {
  const raw = localStorage.getItem(draftKey(scope));
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > DRAFT_TTL) {
      localStorage.removeItem(draftKey(scope));
      return '';
    }
    return parsed.value ?? '';
  } catch (error) {
    return '';
  }
}

function saveDraft(scope: string, value: string) {
  localStorage.setItem(draftKey(scope), JSON.stringify({ value, timestamp: Date.now() }));
}

export function Community() {
  const { call } = useRequest();
  const client = useQueryClient();
  const toast = useToast();
  const { isCoordinator, currentUser } = useBoot();
  const [composer, setComposer] = useState(() => loadDraft('root'));

  const communityQuery = useQuery({
    queryKey: ['community'],
    queryFn: () => call<{ data: CommunityPost[] }>('/community'),
    refetchInterval: 15000
  });

  useEffect(() => {
    saveDraft('root', composer);
  }, [composer]);

  const restore = (snapshot: { data: CommunityPost[] } | undefined) => {
    if (snapshot) {
      client.setQueryData(['community'], snapshot);
    }
  };

  const createPost = useMutation({
    mutationFn: ({ body }: { body: string }) => call<CommunityPost>('/community', 'POST', { body }),
    onMutate: async ({ body }) => {
      await client.cancelQueries({ queryKey: ['community'] });
      const snapshot = client.getQueryData<{ data: CommunityPost[] }>(['community']);

      const optimisticPost: CommunityPost = {
        id: Number.MIN_SAFE_INTEGER + Date.now(),
        body,
        created_at: new Date().toISOString(),
        author_id: currentUser?.id ?? 0,
        author: currentUser
          ? { id: currentUser.id, name: currentUser.name, email: currentUser.email, avatar: currentUser.avatar }
          : undefined,
        comments: [],
        optimistic: true
      };

      client.setQueryData<{ data: CommunityPost[] }>(['community'], (previous) => ({
        data: previous ? [optimisticPost, ...previous.data] : [optimisticPost]
      }));

      return { snapshot, optimisticId: optimisticPost.id };
    },
    onError: (error: Error, _variables, context) => {
      restore(context?.snapshot);
      toast(error.message || 'Posting is restricted for your role', 'error');
    },
    onSuccess: (post, _variables, context) => {
      client.setQueryData<{ data: CommunityPost[] }>(['community'], (previous) => {
        if (!previous) {
          return { data: [post] };
        }
        return {
          data: previous.data.map((entry) => (entry.id === context?.optimisticId ? post : entry))
        };
      });
      setComposer('');
      localStorage.removeItem(draftKey('root'));
      toast('Message posted', 'success');
    },
    onSettled: () => {
      client.invalidateQueries({ queryKey: ['community'] });
    }
  });

  const replyMutation = useMutation({
    mutationFn: ({ postId, body }: { postId: number; body: string }) =>
      call<CommunityComment>(`/community/${postId}/reply`, 'POST', { body }),
    onMutate: async ({ postId, body }) => {
      await client.cancelQueries({ queryKey: ['community'] });
      const snapshot = client.getQueryData<{ data: CommunityPost[] }>(['community']);

      const optimisticComment: CommunityComment = {
        id: Number.MIN_SAFE_INTEGER + Date.now(),
        post_id: postId,
        body,
        created_at: new Date().toISOString(),
        author_id: currentUser?.id ?? 0,
        author: currentUser
          ? { id: currentUser.id, name: currentUser.name, email: currentUser.email, avatar: currentUser.avatar }
          : undefined,
        optimistic: true
      };

      client.setQueryData<{ data: CommunityPost[] }>(['community'], (previous) => {
        if (!previous) {
          return previous;
        }
        return {
          data: previous.data.map((post) =>
            post.id === postId
              ? { ...post, comments: [...(post.comments ?? []), optimisticComment] }
              : post
          )
        };
      });

      return { snapshot, optimisticId: optimisticComment.id, postId };
    },
    onError: (error: Error, _variables, context) => {
      restore(context?.snapshot);
      toast(error.message || 'Unable to reply', 'error');
    },
    onSuccess: (comment, variables, context) => {
      client.setQueryData<{ data: CommunityPost[] }>(['community'], (previous) => {
        if (!previous) {
          return previous;
        }
        return {
          data: previous.data.map((post) =>
            post.id === variables.postId
              ? {
                  ...post,
                  comments: (post.comments ?? []).map((entry) =>
                    entry.id === context?.optimisticId ? comment : entry
                  )
                }
              : post
          )
        };
      });
      localStorage.removeItem(draftKey(`reply-${variables.postId}`));
      toast('Reply posted', 'success');
    },
    onSettled: () => {
      client.invalidateQueries({ queryKey: ['community'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id }: { id: number }) => call(`/community/${id}`, 'DELETE'),
    onMutate: async ({ id }) => {
      await client.cancelQueries({ queryKey: ['community'] });
      const snapshot = client.getQueryData<{ data: CommunityPost[] }>(['community']);

      client.setQueryData<{ data: CommunityPost[] }>(['community'], (previous) => {
        if (!previous) {
          return previous;
        }
        return {
          data: previous.data.filter((post) => post.id !== id)
        };
      });

      return { snapshot };
    },
    onError: (error: Error, _variables, context) => {
      restore(context?.snapshot);
      toast(error.message || 'Unable to delete post', 'error');
    },
    onSuccess: (response: any) => {
      if (response?.moderation) {
        toast('Delete request sent to coordinator', 'info');
      } else {
        toast('Post deleted', 'success');
      }
    },
    onSettled: () => {
      client.invalidateQueries({ queryKey: ['community'] });
    }
  });

  async function handleDelete(post: CommunityPost) {
    const createdTimestamp = new Date(post.created_at).getTime();
    const withinWindow = Date.now() - createdTimestamp < 15 * 60 * 1000;
    const isAuthor = currentUser?.id === post.author_id;

    if (!isCoordinator && (!withinWindow || !isAuthor)) {
      toast('Delete request sent to coordinator', 'info');
    }

    deleteMutation.mutate({ id: post.id });
  }

  function handleReplyDraft(postId: number, value: string) {
    saveDraft(`reply-${postId}`, value);
  }

  return (
    <Card title="Community Hub" subtitle="Threaded conversations" isLoading={communityQuery.isLoading}>
      <div className="rounded-3xl border border-slate-200 bg-white p-5">
        <textarea
          value={composer}
          onChange={(event) => setComposer(event.target.value)}
          placeholder="Share an update with the crew"
          className="h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-[var(--l4p-primary)] focus:outline-none"
        />
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => createPost.mutate({ body: composer })}
            className="rounded-full bg-[var(--l4p-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            disabled={!composer.trim() || createPost.isPending}
          >
            Post update
          </button>
        </div>
      </div>

      <div className="mt-4 h-[420px] space-y-4 overflow-y-auto pr-2">
        {(communityQuery.data?.data ?? []).map((post) => (
          <article key={post.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={post.author?.avatar || 'https://placehold.co/48x48'} alt={post.author?.name} className="h-12 w-12 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{post.author?.name}</p>
                  <p className="text-xs text-slate-500">{new Date(post.created_at).toLocaleString()}</p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(post)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500"
              >
                Delete
              </button>
            </div>
            <p className="mt-3 text-sm text-slate-700">{post.body}</p>
            <div className="mt-4 space-y-3">
              {(post.comments ?? []).map((comment) => (
                <div key={comment.id} className="rounded-2xl bg-slate-50 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{comment.author?.name}</p>
                      <p className="text-xs text-slate-500">{new Date(comment.created_at).toLocaleString()}</p>
                    </div>
                    <p className="text-xs text-slate-400">{comment.author?.email}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{comment.body}</p>
                </div>
              ))}
              <div className="rounded-2xl bg-slate-100 p-3">
                <textarea
                  defaultValue={loadDraft(`reply-${post.id}`)}
                  onChange={(event) => handleReplyDraft(post.id, event.target.value)}
                  placeholder="Write a reply"
                  className="h-20 w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-[var(--l4p-primary)] focus:outline-none"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => {
                      const draft = loadDraft(`reply-${post.id}`);
                      if (!draft.trim()) {
                        toast('Reply cannot be empty', 'info');
                        return;
                      }
                      replyMutation.mutate({ postId: post.id, body: draft });
                    }}
                    className="rounded-full bg-[var(--l4p-primary)] px-3 py-1 text-xs font-semibold text-white"
                  >
                    Reply
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </Card>
  );
}
