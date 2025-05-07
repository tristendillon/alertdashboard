import type { IconProps } from '../lib/types';

const Permissions: React.FC<IconProps> = ({
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
      <rect x="4" y="11" width="16" height="10" rx="2" stroke={color} strokeWidth="2" />
      <path d="M12 15V17" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M7.5 11V7C7.5 4.79086 9.29086 3 11.5 3H12.5C14.7091 3 16.5 4.79086 16.5 7V11" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="15" r="1" stroke={color} strokeWidth="2" />
    </svg>
  );
};

export default Permissions;