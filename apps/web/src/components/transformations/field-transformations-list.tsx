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
import { FieldTransformationForm } from "@/forms/transformations/create-field-transformation-form";
import type { Id } from "@sizeupdashboard/convex/src/api/_generated/dataModel.js";
import type { FieldTransformation } from "@sizeupdashboard/convex/src/api/schema.js";

export function FieldTransformationsList() {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingTransformation, setEditingTransformation] =
    useState<FieldTransformation | null>(null);
  const { data: transformations, status } = useQuery(
    api.transformations.getFieldTransformations,
    {},
  );
  const deleteTransformation = useMutation(
    api.transformations.deleteFieldTransformation,
  );

  if (status === "pending") {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading transformations...</div>
      </div>
    );
  }

  if (!transformations || transformations.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="text-muted-foreground mb-4">
          No field transformations created yet
        </div>
        <p className="text-muted-foreground text-sm">
          Create your first transformation to get started
        </p>
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteTransformation({
        id: id as Id<"fieldTransformations">,
      });
    } catch (error) {
      console.error("Failed to delete transformation:", error);
      alert(
        "Failed to delete transformation. It may be in use by transformation rules.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const getStrategyBadgeColor = (strategy: string) => {
    switch (strategy) {
      case "static_value":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "random_offset":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "random_string":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "merge_data":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {transformations.map((transformation) => (
          <div
            key={transformation._id}
            className="hover:bg-accent/50 rounded-lg border p-4 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold">{transformation.name}</h3>
                  <Badge
                    className={getStrategyBadgeColor(transformation.strategy)}
                    variant="secondary"
                  >
                    {transformation.strategy}
                  </Badge>
                </div>
                <div className="text-muted-foreground text-sm">
                  <span className="font-medium">Field:</span>{" "}
                  {transformation.field}
                </div>
                {transformation.params &&
                  Object.keys(transformation.params).length > 0 && (
                    <div className="text-muted-foreground text-sm">
                      <span className="font-medium">Parameters:</span>{" "}
                      {JSON.stringify(transformation.params)}
                    </div>
                  )}
                <div className="text-muted-foreground text-xs">
                  Created:{" "}
                  {new Date(transformation._creationTime).toLocaleDateString()}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingTransformation(transformation);
                  }}
                >
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deletingId === transformation._id}
                    >
                      {deletingId === transformation._id
                        ? "Deleting..."
                        : "Delete"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Transformation</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete the transformation
                        &ldquo;{transformation.name}&rdquo;? This action cannot
                        be undone and will fail if the transformation is
                        currently being used by any transformation rules.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(transformation._id)}
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
      <FieldTransformationForm
        mode="edit"
        transformation={editingTransformation}
        open={!!editingTransformation}
        onCloseAction={() => setEditingTransformation(null)}
      />
    </div>
  );
}
