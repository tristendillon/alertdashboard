"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldTransformationsList } from "./transformations/field-transformations-list";
import { TransformationRulesList } from "./transformations/transformation-rules-list";
import { FieldTransformationForm } from "@/forms/transformations/create-field-transformation-form";
import { TransformationRuleForm } from "@/forms/transformations/create-transformation-rule-form";

type TabType = "transformations" | "rules";

export function TransformationDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("transformations");
  const [showCreateTransformation, setShowCreateTransformation] =
    useState(false);
  const [showCreateRule, setShowCreateRule] = useState(false);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-muted flex w-fit space-x-1 rounded-lg p-1">
        <button
          onClick={() => setActiveTab("transformations")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "transformations"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Field Transformations
        </button>
        <button
          onClick={() => setActiveTab("rules")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "rules"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Transformation Rules
        </button>
      </div>

      {/* Field Transformations Tab */}
      {activeTab === "transformations" && (
        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Field Transformations</h2>
              <p className="text-muted-foreground mt-1">
                Create reusable transformations that can be applied to dispatch
                fields
              </p>
            </div>
            <Button onClick={() => setShowCreateTransformation(true)}>
              Create Transformation
            </Button>
          </div>
          <FieldTransformationsList />
        </Card>
      )}

      {/* Transformation Rules Tab */}
      {activeTab === "rules" && (
        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Transformation Rules</h2>
              <p className="text-muted-foreground mt-1">
                Define rules that match dispatches and apply transformations
              </p>
            </div>
            <Button onClick={() => setShowCreateRule(true)}>Create Rule</Button>
          </div>
          <TransformationRulesList />
        </Card>
      )}

      {/* Modal Forms */}
      <FieldTransformationForm
        mode="create"
        transformation={null}
        open={showCreateTransformation}
        onCloseAction={() => setShowCreateTransformation(false)}
      />

      <TransformationRuleForm
        mode="create"
        rule={null}
        open={showCreateRule}
        onCloseAction={() => setShowCreateRule(false)}
      />
    </div>
  );
}
