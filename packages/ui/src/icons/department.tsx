import type { IconProps } from '../lib/types';

const Department: React.FC<IconProps> = ({
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
      <circle cx="12" cy="5" r="3" stroke={color} strokeWidth="2" />
      <circle cx="5" cy="16" r="3" stroke={color} strokeWidth="2" />
      <circle cx="19" cy="16" r="3" stroke={color} strokeWidth="2" />
      <line x1="12" y1="8" x2="12" y2="12" stroke={color} strokeWidth="2" />
      <line x1="5" y1="13" x2="5" y2="12" stroke={color} strokeWidth="2" />
      <line x1="19" y1="13" x2="19" y2="12" stroke={color} strokeWidth="2" />
      <line x1="12" y1="12" x2="5" y2="12" stroke={color} strokeWidth="2" />
      <line x1="12" y1="12" x2="19" y2="12" stroke={color} strokeWidth="2" />
    </svg>
  );
};

export default Department;
