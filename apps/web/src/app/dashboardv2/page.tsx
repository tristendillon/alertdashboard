import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DispatchPieChart } from "@/components/charts/dispatch-pie-chart";
import { HourlyActivityChart } from "@/components/charts/hourly-activity-chart";
import { DispatchListContent } from "@/components/dashboard/dispatch-list-content";
import { ViewTokenStatus } from "@/components/dashboard/view-token-status";
import { DashboardQuickActions } from "@/components/dashboard/dashboard-quick-actions";

export default function DashboardV2Page() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <DashboardQuickActions />
        </CardContent>
      </Card>
      <div className="space-y-6">
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-6">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Recent Dispatches</CardTitle>
              <CardDescription>Latest emergency responses</CardDescription>
            </CardHeader>
            <CardContent>
              <DispatchListContent />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>View Token Status</CardTitle>
              <CardDescription>Connected viewing locations</CardDescription>
            </CardHeader>
            <CardContent>
              <ViewTokenStatus />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Dispatch Distribution</CardTitle>
              <CardDescription>Breakdown by emergency type</CardDescription>
            </CardHeader>
            <CardContent>
              <DispatchPieChart />
            </CardContent>
          </Card>

          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>24-Hour Activity</CardTitle>
              <CardDescription>Dispatch volume by hour of day</CardDescription>
            </CardHeader>
            <CardContent>
              <HourlyActivityChart />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
