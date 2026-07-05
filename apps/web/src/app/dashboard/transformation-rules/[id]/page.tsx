import { RuleEditor } from "../_components/rule-editor/rule-editor";

export default async function EditTransformationRulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RuleEditor ruleId={id} />;
}
