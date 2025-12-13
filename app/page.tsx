import { getProgressBars } from "@/app/actions";
import { CreateBarForm } from "@/app/components/CreateBarForm";
import { ProgressBar } from "@/app/components/ProgressBar";

export default async function Home() {
  const bars = await getProgressBars();

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 py-12 font-sans dark:bg-black">
      <main className="w-full max-w-xl px-4">
        <h1 className="mb-8 text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Progress Bars
        </h1>

        <div className="flex flex-col gap-4">
          {bars.map((bar) => (
            <ProgressBar key={bar.id} bar={bar} />
          ))}
          <CreateBarForm />
        </div>

        {bars.length === 0 && (
          <p className="mt-4 text-center text-zinc-500 dark:text-zinc-400">
            No progress bars yet. Create one above!
          </p>
        )}
      </main>
    </div>
  );
}
