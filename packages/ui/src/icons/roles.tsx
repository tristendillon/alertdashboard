import type { IconProps } from '../lib/types';

const Roles: React.FC<IconProps> = ({
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
      <circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" />
      <path d="M5 19C5 16.7909 8.13401 15 12 15C15.866 15 19 16.7909 19 19" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M17 9L19 7L21 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 7V11" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M7 9L5 7L3 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 7V11" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

export default Roles;