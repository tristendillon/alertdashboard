import type { IconProps } from '../lib/types';

const Station: React.FC<IconProps> = ({
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
      <path d="M3 21H21V8L12 3L3 8V21Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <rect x="9" y="13" width="6" height="8" stroke={color} strokeWidth="2" />
      <path d="M9 9H15" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M6 12V12.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M18 12V12.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M6 16V16.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M18 16V16.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

export default Station;
