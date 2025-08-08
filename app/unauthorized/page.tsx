import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <h1 className="text-3xl font-bold mb-4 text-red-600">Unauthorized</h1>
      <p className="mb-6 text-lg text-muted-foreground">You do not have permission to access this page.</p>
      <Link
        href="/"
        className="px-6 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
      >
        Go to Home
      </Link>
    </div>
  );
}




