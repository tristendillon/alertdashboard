import type { IconProps } from '@workspace/ui/lib/types';

const Organization: React.FC<IconProps> = ({
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
      <rect x="2" y="8" width="20" height="14" rx="1" stroke={color} strokeWidth="2" />
      <rect x="5" y="2" width="14" height="6" rx="1" stroke={color} strokeWidth="2" />
      <line x1="12" y1="8" x2="12" y2="2" stroke={color} strokeWidth="2" />
      <line x1="6" y1="14" x2="18" y2="14" stroke={color} strokeWidth="2" />
      <line x1="6" y1="19" x2="18" y2="19" stroke={color} strokeWidth="2" />
      <line x1="9" y1="14" x2="9" y2="22" stroke={color} strokeWidth="2" />
      <line x1="15" y1="14" x2="15" y2="22" stroke={color} strokeWidth="2" />
    </svg>
  );
};

export default Organization;
