import { TransformationDashboard } from "@/components/transformation-dashboard";

export default function DashboardPage() {
  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold">Transformation Management</h1>
        <TransformationDashboard />
      </div>
    </div>
  );
}
