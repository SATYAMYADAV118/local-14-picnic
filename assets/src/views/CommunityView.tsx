import { useEffect, useState } from 'react';
import { fetchJSON, sendJSON } from '../utils/api';
import { useDraft } from '../utils/useDraft';

interface Post {
  id: number;
  body: string;
  created_at: string;
  author_id: number;
  author_name: string;
}

interface Comment {
  id: number;
  body: string;
  created_at: string;
  post_id: number;
  author_id: number;
  author_name: string;
}

interface Props {
  addToast: (toast: { type: 'success' | 'error'; message: string }) => void;
}

export const CommunityView: React.FC<Props> = ({ addToast }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [loading, setLoading] = useState(true);
  const [newPostDraft] = useState(() => useDraft<string>('community-new-post', ''));
  const [editingPost, setEditingPost] = useState<number | null>(null);
  const [postEditValue, setPostEditValue] = useState('');
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [commentEditValue, setCommentEditValue] = useState('');

  const isCoordinator = l4pApp.currentUser.roles.includes('l4p_coordinator');
  const isVolunteer = l4pApp.currentUser.roles.includes('l4p_volunteer');
  const volunteerPostingEnabled = Boolean(l4pApp.settings.volunteer_community_post);
  const canPost = isCoordinator || (isVolunteer && volunteerPostingEnabled);

  const loadPosts = () => {
    fetchJSON<Post[]>('community/posts')
      .then((items) => {
        setPosts(items);
        items.forEach((post) => loadComments(post.id));
        setEditingPost(null);
        setPostEditValue('');
        setEditingComment(null);
        setCommentEditValue('');
      })
      .catch(() => addToast({ type: 'error', message: 'Unable to load posts.' }))
      .finally(() => setLoading(false));
  };

  const loadComments = (postId: number) => {
    fetchJSON<Comment[]>(`community/posts/${postId}/comments`).then((items) => {
      setComments((prev) => ({ ...prev, [postId]: items }));
    });
  };

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitPost = async () => {
    if (!newPostDraft.value || !newPostDraft.value.trim()) {
      return;
    }

    try {
      await sendJSON<Post>('community/posts', 'POST', { body: newPostDraft.value });
      newPostDraft.clear();
      addToast({ type: 'success', message: 'Post shared.' });
      loadPosts();
    } catch (error) {
      addToast({ type: 'error', message: 'Could not publish post.' });
    }
  };

  const submitPostEdit = async (postId: number) => {
    try {
      await sendJSON<Post>(`community/posts/${postId}`, 'POST', { body: postEditValue });
      addToast({ type: 'success', message: 'Post updated.' });
      setEditingPost(null);
      setPostEditValue('');
      loadPosts();
    } catch (error) {
      addToast({ type: 'error', message: 'Could not update post.' });
    }
  };

  const deletePost = async (postId: number) => {
    try {
      await fetchJSON(`community/posts/${postId}`, { method: 'DELETE' });
      addToast({ type: 'success', message: 'Post deleted.' });
      loadPosts();
    } catch (error) {
      addToast({ type: 'error', message: 'Could not delete post.' });
    }
  };

  const submitComment = async (postId: number, body: string, clear: () => void) => {
    if (!body.trim()) {
      return;
    }

    try {
      await sendJSON<Comment>(`community/posts/${postId}/comments`, 'POST', { body });
      clear();
      addToast({ type: 'success', message: 'Reply added.' });
      loadComments(postId);
    } catch (error) {
      addToast({ type: 'error', message: 'Could not add reply.' });
    }
  };

  const submitCommentEdit = async (commentId: number) => {
    try {
      await sendJSON<Comment>(`community/comments/${commentId}`, 'POST', { body: commentEditValue });
      addToast({ type: 'success', message: 'Comment updated.' });
      setEditingComment(null);
      setCommentEditValue('');
      // Find post id from lookup and reload that post's comments.
      const postEntry = Object.entries(comments).find(([, commentList]) => commentList.some((comment) => comment.id === commentId));
      if (postEntry) {
        loadComments(Number(postEntry[0]));
      }
    } catch (error) {
      addToast({ type: 'error', message: 'Could not update comment.' });
    }
  };

  const deleteComment = async (commentId: number, postId: number) => {
    try {
      await fetchJSON(`community/comments/${commentId}`, { method: 'DELETE' });
      addToast({ type: 'success', message: 'Comment deleted.' });
      if (editingComment === commentId) {
        setEditingComment(null);
        setCommentEditValue('');
      }
      loadComments(postId);
    } catch (error) {
      addToast({ type: 'error', message: 'Could not delete comment.' });
    }
  };

  if (loading) {
    return <div className="l4p-skeleton" aria-busy="true" />;
  }

  return (
    <section className="l4p-stack">
      <header className="l4p-toolbar">
        <h1>Community</h1>
      </header>

      {canPost && (
        <div className="l4p-card">
          <h2>Share an update</h2>
          <textarea
            aria-label="Community post"
            value={newPostDraft.value || ''}
            onChange={(event) => newPostDraft.update(event.target.value)}
            placeholder="Celebrate wins, share needs, or ask questions..."
          />
          <button className="l4p-button" onClick={submitPost}>
            Post
          </button>
        </div>
      )}

      <div className="l4p-stack">
        {posts.map((post) => (
          <article key={post.id} className="l4p-card">
            <header className="l4p-card-header">
              <div>
                <h3>{post.author_name}</h3>
                <time dateTime={post.created_at}>{new Date(post.created_at).toLocaleString()}</time>
              </div>
              {(isCoordinator || post.author_id === l4pApp.currentUser.id) && (
                <div className="l4p-inline-actions">
                  {editingPost === post.id ? (
                    <>
                      <button className="l4p-link" onClick={() => submitPostEdit(post.id)}>
                        Save
                      </button>
                      <button
                        className="l4p-link"
                        onClick={() => {
                          setEditingPost(null);
                          setPostEditValue('');
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="l4p-link"
                        onClick={() => {
                          setEditingPost(post.id);
                          setPostEditValue(post.body);
                        }}
                      >
                        Edit
                      </button>
                      <button className="l4p-link l4p-danger" onClick={() => deletePost(post.id)}>
                        Delete
                      </button>
                    </>
                  )}
                </div>
              )}
            </header>
            {editingPost === post.id ? (
              <textarea value={postEditValue} onChange={(event) => setPostEditValue(event.target.value)} />
            ) : (
              <p dangerouslySetInnerHTML={{ __html: post.body }} />
            )}
            <div className="l4p-comments">
              <h3>Replies</h3>
              <ul>
                {(comments[post.id] || []).map((comment) => (
                  <li key={comment.id}>
                    <header className="l4p-comment-meta">
                      <strong>{comment.author_name}</strong>
                      <time dateTime={comment.created_at}>{new Date(comment.created_at).toLocaleString()}</time>
                    </header>
                    {editingComment === comment.id ? (
                      <textarea value={commentEditValue} onChange={(event) => setCommentEditValue(event.target.value)} />
                    ) : (
                      <p dangerouslySetInnerHTML={{ __html: comment.body }} />
                    )}
                    {(isCoordinator || comment.author_id === l4pApp.currentUser.id) && (
                      <div className="l4p-inline-actions">
                        {editingComment === comment.id ? (
                          <>
                            <button className="l4p-link" onClick={() => submitCommentEdit(comment.id)}>
                              Save
                            </button>
                            <button
                              className="l4p-link"
                              onClick={() => {
                                setEditingComment(null);
                                setCommentEditValue('');
                              }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="l4p-link"
                              onClick={() => {
                                setEditingComment(comment.id);
                                setCommentEditValue(comment.body);
                              }}
                            >
                              Edit
                            </button>
                            <button className="l4p-link l4p-danger" onClick={() => deleteComment(comment.id, post.id)}>
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </li>
                ))}
                {(comments[post.id] || []).length === 0 && <li className="l4p-empty">No replies yet.</li>}
              </ul>
              {canPost && <ReplyBox postId={post.id} onSubmit={submitComment} />}
            </div>
          </article>
        ))}
        {posts.length === 0 && <div className="l4p-empty">No posts yet.</div>}
      </div>
    </section>
  );
};

interface ReplyBoxProps {
  postId: number;
  onSubmit: (postId: number, body: string, clear: () => void) => void;
}

const ReplyBox: React.FC<ReplyBoxProps> = ({ postId, onSubmit }) => {
  const draft = useDraft<string>(`community-comment-${postId}`, '');

  return (
    <div className="l4p-reply-box">
      <textarea
        aria-label="Reply"
        value={draft.value || ''}
        onChange={(event) => draft.update(event.target.value)}
        placeholder="Add a reply"
      />
      <button className="l4p-button" onClick={() => onSubmit(postId, draft.value || '', draft.clear)}>
        Reply
      </button>
    </div>
  );
};
