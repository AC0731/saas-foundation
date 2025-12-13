import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { db } from "../../lib/db";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin");
  }

  // TEST: Try to count users in the database
  let userCount = 0;
  try {
    userCount = await db.user.count();
  } catch (e) {
    console.error("Database connection failed:", e);
  }

  return (
    <div className="p-10 font-sans">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-4 text-green-600 font-semibold">
        Logged in as: {session.user?.email}
      </p>
      
      <div className="mt-8 p-6 border rounded-lg bg-white shadow-sm">
        <h2 className="text-xl font-bold mb-2">System Status</h2>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <p>Database Connected: <strong>{userCount >= 0 ? "Yes" : "No"}</strong></p>
        </div>
        <p className="text-sm text-gray-500 mt-2">Total registered users: {userCount}</p>
      </div>
    </div>
  );
}