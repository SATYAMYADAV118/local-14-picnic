interface Props {
  posts: { id: number; body: string; created_at: string }[];
}

export const CommunityMiniFeed: React.FC<Props> = ({ posts }) => {
  return (
    <ul className="l4p-mini-feed">
      {posts.map((post) => (
        <li key={post.id}>
          <p>{post.body}</p>
          <time dateTime={post.created_at}>{new Date(post.created_at).toLocaleString()}</time>
        </li>
      ))}
      {posts.length === 0 && <li className="l4p-empty">No community updates yet.</li>}
    </ul>
  );
};
