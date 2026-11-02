import Icon from './Icon';
export default function ExternalLink({
  children,
  className = 'button button-secondary',
  ...props
}) {
  return (
    <a {...props} className={className} target="_blank" rel="noopener noreferrer">
      {children}
      <Icon name="external" size={15} />
    </a>
  );
}
