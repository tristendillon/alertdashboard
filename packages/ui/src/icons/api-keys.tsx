import type { IconProps } from '../lib/types';

const ApiKeys: React.FC<IconProps> = ({
  size = 48,
  color = "currentColor",
  ...props
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="8" cy="15" r="4" stroke={color} strokeWidth="2" />
      <path d="M12 15L15 15" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M18 15L21 15" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M16.5 12.5L18.5 14.5L16.5 16.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 7L20 7" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M4 11L12 11" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

export default ApiKeys;