interface Props {
  label: string;
  value: string;
  delta: string;
  tone: 'primary' | 'success' | 'warning';
}

export const StatChip: React.FC<Props> = ({ label, value, delta, tone }) => {
  return (
    <div className={`l4p-stat-chip is-${tone}`}>
      <span className="l4p-stat-label">{label}</span>
      <strong>{value}</strong>
      {delta && <span className="l4p-stat-delta">{delta}</span>}
    </div>
  );
};
