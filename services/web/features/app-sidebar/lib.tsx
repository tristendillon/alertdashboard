import { Building2, UsersIcon, Settings, FileText, Bell, Database, Layers, ShieldCheck } from 'lucide-react';
import { Home } from 'lucide-react';
import type { Sidebar } from '@workspace/ui/lib/types';
import { Department, Station, Access, Permissions } from '@workspace/ui/icons';
import { IoKeyOutline } from "react-icons/io5";
import { MdOutlineMap, MdOutlineDescription } from "react-icons/md";
import { FaMapMarkerAlt } from "react-icons/fa";

export const HomeSidebar: Sidebar = {
  key: "home",
  pathnames: [""],
  groups: [
    {
      label: "Home",
      items: [
        {
          title: "Organization",
          url: "organization",
          icon: <Building2 />,
          isChildLink: true,
        },
        {
          title: "Dashboards",
          url: "dashboards",
          icon: <Home />,
          isChildLink: true,
        },
        {
          title: "Configuration",
          url: "configuration",
          icon: <Settings />,
          isChildLink: true,
        }
      ]
    },
    {
      label: "Map Configuration",
      items: [
        {
          title: "Map Data",
          url: "map-data",
          icon: <FaMapMarkerAlt />,
        },
        {
          title: "Map Icons",
          url: "map-icons",
          icon: <MdOutlineMap />,
        },
        {
          title: "Map Templates",
          url: "map-templates",
          icon: <Layers />,
        }
      ]
    },
    {
      label: "Configuration",
      items: [
        {
          title: "Units",
          url: "units",
          icon: <Database />,
        },
        {
          title: "Descriptors",
          url: "descriptors",
          icon: <MdOutlineDescription />,
        },
        {
          title: "Redaction Levels",
          url: "redaction-levels",
          icon: <Settings />,
        }
      ]
    }
  ]
};
export const OrganizationSidebar: Sidebar = {
  key: "organization",
  pathnames: ["organization"],
  groups: [
    {
      label: "Organization",
      items: [
        {
          title: "Overview",
          url: "organization",
          icon: <Building2 />,
        },
        {
          title: "Departments",
          url: "departments",
          icon: <Department />,
        },
        {
          title: "Stations",
          url: "stations",
          icon: <Station />,
        },
        {
          title: "Users",
          url: "users",
          icon: <UsersIcon />,
        },
        {
          title: "Roles",
          url: "roles",
          icon: <ShieldCheck />,
        },
        {
          title: "Permissions",
          url: "permissions",
          icon: <Permissions />,
        },
        {
          title: "API Keys",
          url: "api-keys",
          icon: <IoKeyOutline />,
        },
      ]
    },
  ],
  parent: {
    label: "Home",
    href: "/",
  },
};

export const ConfigurationSidebar: Sidebar = {
  key: "configuration",
  pathnames: ["configuration"],
  groups: [
    {
      label: "Configuration",
      items: [
        {
          title: "Units",
          url: "units",
          icon: <Database />,
        },
        {
          title: "Descriptors",
          url: "descriptors",
          icon: <MdOutlineDescription />,
        },
        {
          title: "Redaction Levels",
          url: "redaction-levels",
          icon: <Settings />,
        }
      ]
    },
    {
      label: "Map Configuration",
      items: [
        {
          title: "Map Data",
          url: "map-data",
          icon: <FaMapMarkerAlt />,
        },
        {
          title: "Map Icons",
          url: "map-icons",
          icon: <MdOutlineMap />,
        },
        {
          title: "Map Templates",
          url: "map-templates",
          icon: <Layers />,
        }
      ]
    },
  ],
  parent: {
    label: "Home",
    href: "/",
  },
}

export const DashboardsSidebar: Sidebar = {
  key: "dashboards",
  pathnames: ["dashboards"],
  groups: [
    {
      label: "Dashboards",
      items: [
        {
          title: "Overview",
          url: "dashboard",
          icon: <Home />,
        },
        {
          title: "Pages",
          url: "pages",
          icon: <FileText />,
        },
        {
          title: "Drafts",
          url: "drafts",
          icon: <FileText />,
        },
        {
          title: "Alerts",
          url: "alerts",
          icon: <Bell />,
        }
      ]
    }
  ],
  parent: {
    label: "Home",
    href: "/",
  },
}

export const OldDashboardSidebar: Sidebar = {
  key: "dashboard",
  pathnames: ["Dashboard"],
  groups: [
    {
      label: "Organization",
      items: [
        {
          title: "Overview",
          url: "organization",
          icon: <Building2 />,
        },
        {
          title: "Departments",
          url: "departments",
          icon: <Department />,
        },
        {
          title: "Stations",
          url: "stations",
          icon: <Station />,
        },
        {
          label: "Access",
          icon: <Access />,
          items: [
            {
              title: "Users",
              url: "users",
              icon: <UsersIcon />,
            },
            {
              title: "Roles",
              url: "roles",
              icon: <ShieldCheck />,
            },
            {
              title: "Permissions",
              url: "permissions",
              icon: <Permissions />,
            },
            {
              title: "API Keys",
              url: "api-keys",
              icon: <IoKeyOutline />,
            },
          ]
        },
      ]
    },
    {
      label: "Dashboards",
      items: [
        {
          title: "Overview",
          url: "dashboard",
          icon: <Home />,
        },
        {
          title: "Pages",
          url: "pages",
          icon: <FileText />,
        },
        {
          title: "Drafts",
          url: "drafts",
          icon: <FileText />,
        },
        {
          title: "Alerts",
          url: "alerts",
          icon: <Bell />,
        }
      ]
    },
    {
      label: "Map Configuration",
      items: [
        {
          title: "Map Data",
          url: "map-data",
          icon: <FaMapMarkerAlt />,
        },
        {
          title: "Map Icons",
          url: "map-icons",
          icon: <MdOutlineMap />,
        },
        {
          title: "Map Templates",
          url: "map-templates",
          icon: <Layers />,
        }
      ]
    },
    {
      label: "Configuration",
      items: [
        {
          title: "Units",
          url: "units",
          icon: <Database />,
        },
        {
          title: "Descriptors",
          url: "descriptors",
          icon: <MdOutlineDescription />,
        },
        {
          title: "Redaction Levels",
          url: "redaction-levels",
          icon: <Settings />,
        }
      ]
    }
  ]
};

export const AllSidebars: Sidebar[] = [
  HomeSidebar,
  OrganizationSidebar,
  DashboardsSidebar,
];