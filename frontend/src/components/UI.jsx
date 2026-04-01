import Skeleton from 'react-loading-skeleton';

export const Card = ({ title, children, right }) => <section className='card'><div className='card-head'><h3>{title}</h3>{right}</div>{children}</section>;
export const StatCard = ({ label, value }) => <div className='stat-card'><div className='muted'>{label}</div><div className='stat-value'>{value}</div></div>;
export const LoadingBlock = ({ lines = 4 }) => <Skeleton count={lines} height={28} style={{ marginBottom: 10 }} />;
