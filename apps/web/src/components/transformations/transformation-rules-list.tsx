"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useQuery } from "@/hooks/use-query";
import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TransformationRuleForm } from "@/forms/transformations/create-transformation-rule-form";
import type { Id } from "@sizeupdashboard/convex/src/api/_generated/dataModel.js";
import type { TransformationRule } from "@sizeupdashboard/convex/src/api/schema.js";

export function TransformationRulesList() {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<TransformationRule | null>(
    null,
  );
  const { data: rules, status } = useQuery(
    api.transformations.getTransformationRules,
    {},
  );
  const deleteRule = useMutation(api.transformations.deleteTransformationRule);

  if (status === "pending") {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">
          Loading transformation rules...
        </div>
      </div>
    );
  }

  if (!rules || rules.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="text-muted-foreground mb-4">
          No transformation rules created yet
        </div>
        <p className="text-muted-foreground text-sm">
          Create your first rule to start applying transformations to dispatches
        </p>
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteRule({
        id: id as Id<"transformationRules">,
      });
    } catch (error) {
      console.error("Failed to delete rule:", error);
      alert("Failed to delete transformation rule.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {rules.map((rule) => (
          <div
            key={rule._id}
            className="hover:bg-accent/50 rounded-lg border p-4 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold">{rule.name}</h3>
                  <Badge variant="outline">
                    {rule.transformations.length} transformation
                    {rule.transformations.length !== 1 ? "s" : ""}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  {rule.dispatchTypeRegex && (
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground min-w-[80px] font-medium">
                        Regex:
                      </span>
                      <span className="bg-muted rounded px-2 py-1 font-mono text-xs">
                        {rule.dispatchTypeRegex}
                      </span>
                    </div>
                  )}

                  {rule.keywords.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground min-w-[80px] font-medium">
                        Keywords:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {rule.keywords.map((keyword) => (
                          <Badge
                            key={keyword}
                            variant="secondary"
                            className="text-xs"
                          >
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {rule.dispatchTypes.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground min-w-[80px] font-medium">
                        Types:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {rule.dispatchTypes.map((typeId) => (
                          <Badge
                            key={typeId}
                            variant="secondary"
                            className="text-xs"
                          >
                            {typeId}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground min-w-[80px] font-medium">
                      Applies:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {rule.transformations.map((transformationId) => (
                        <Badge
                          key={transformationId}
                          variant="default"
                          className="text-xs"
                        >
                          {transformationId}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-muted-foreground text-xs">
                  Created: {new Date(rule._creationTime).toLocaleDateString()}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingRule(rule)}
                >
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deletingId === rule._id}
                    >
                      {deletingId === rule._id ? "Deleting..." : "Delete"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Delete Transformation Rule
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete the transformation rule
                        &ldquo;{rule.name}&rdquo;? This action cannot be undone
                        and will stop applying the associated transformations to
                        matching dispatches.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(rule._id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Form */}
      <TransformationRuleForm
        mode="edit"
        rule={editingRule}
        open={!!editingRule}
        onCloseAction={() => setEditingRule(null)}
      />
    </div>
  );
}
