import DepartmentForm from "@/forms/department-form";

export default function Home() {
  return (
    <div className="h-full place-content-center justify-items-center">
      <div className="min-w-2xl">
        <DepartmentForm />
      </div>
    </div>
  );
}
