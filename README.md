# Alert Dashboard

A real-time alerting dashboard for Fire Departments and EMS stations that integrates with Active 911 and FirstDue platforms to display live alerts and emergency information.

## Project Structure

This project is built as a monorepo using shadcn/ui components with the following structure:

```
├── packages/
│   ├── ui/            - Shared UI components using shadcn/ui
│   ├── convex/        - Convex backend
│   └── *-config/      - Shared configuration files
├── services/
│   ├── web/           - Main web application
│   └── dashboards/    - Separate dashboard service
```

## Features

- Real-time alert monitoring for emergency services
- Integration with Active 911 and FirstDue platforms
- Responsive dashboard for desktop and mobile devices
- Secure authentication for department personnel

### Adding UI Components

To add components to your app, run the following command:
You need to be in a directory with a components.json file
to add a component to the shared UI library.

```bash
cd /services/web/
pnpm dlx shadcn@canary add [COMPONENT]
```

This will place the UI components in the `packages/ui/src/components` directory.

### Using Components

To use the components in your app, import them from the UI package:

```tsx
import { Button } from "@workspace/ui/components/button"
```
