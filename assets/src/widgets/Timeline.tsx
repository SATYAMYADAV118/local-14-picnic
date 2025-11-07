interface Props {
  items: { id: number; message: string; created_at: string }[];
}

export const Timeline: React.FC<Props> = ({ items }) => {
  return (
    <ul className="l4p-timeline">
      {items.map((item) => (
        <li key={item.id}>
          <span className="l4p-dot" aria-hidden="true" />
          <div>
            <p>{item.message}</p>
            <time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time>
          </div>
        </li>
      ))}
      {items.length === 0 && <li className="l4p-empty">No notifications yet.</li>}
    </ul>
  );
};
