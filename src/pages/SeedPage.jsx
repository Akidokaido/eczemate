import React, { useState } from "react";
import { seedDatabase } from "../firebase/seed";

const SeedPage = () => {
  const [status, setStatus] = useState("Ready to seed. Click the button below.");
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    setStatus("Seeding started...");
    await seedDatabase(setStatus);
    setSeeding(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full space-y-6">
        <h1 className="text-3xl font-bold text-blue-600">🌱 Database Seed</h1>
        <p className="text-gray-600">
          This will create test users and populate Firestore with sample data.
        </p>

        <button
          onClick={handleSeed}
          disabled={seeding}
          className={`px-6 py-3 rounded-xl font-semibold text-white shadow-md transition ${
            seeding
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {seeding ? "Seeding..." : "Seed Database"}
        </button>

        <pre className="bg-gray-900 text-green-400 p-4 rounded-xl text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
          {status}
        </pre>
      </div>
    </div>
  );
};

export default SeedPage;
